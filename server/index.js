import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env file
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8')
  envConfig.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
}

const PORT = process.env.PORT || 3001
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Role')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  // Permission Guard Header Validation
  const userRole = req.headers['x-user-role']
  if (userRole === 'unauthorized') {
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      error: 'Access Denied: You do not have permission to execute this request.',
      status: 403,
      role: userRole,
    }))
    return
  }

  // ─── 1. CHAT COMPLETIONS ENDPOINT (/api/ai/chat) ───
  if (req.url === '/api/ai/chat' && req.method === 'POST') {
    if (!OPENAI_API_KEY) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the backend server.' }))
      return
    }

    let bodyStr = ''
    req.on('data', (chunk) => { bodyStr += chunk })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}')
        const clientMessages = body.messages || []
        const crmContext = body.crmContext || ''
        const systemPrompt = body.systemPrompt || 'You are Trufocus AI assistant.'
        const fullSystemPrompt = crmContext && !systemPrompt.includes('=== LIVE TRUFOCUS CRM CONTEXT ===')
          ? `${systemPrompt}\n\n=== LIVE CRM CONTEXT ===\n${crmContext}`
          : systemPrompt

        const formattedMessages = [
          {
            role: 'system',
            content: fullSystemPrompt,
          },
          ...clientMessages,
        ]

        const modelLower = (OPENAI_MODEL || '').toLowerCase().trim()
        const isReasoning = modelLower.startsWith('o1') || modelLower.startsWith('o3') || modelLower.includes('reasoning') || modelLower.startsWith('gpt-5')

        const payloadObj = {
          model: OPENAI_MODEL,
          messages: formattedMessages,
          stream: true,
        }
        if (!isReasoning) {
          payloadObj.temperature = 0.7
        }

        const postData = JSON.stringify(payloadObj)

        res.statusCode = 200
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        const apiReq = https.request(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (apiRes) => {
            if (apiRes.statusCode !== 200) {
              let errData = ''
              apiRes.on('data', (c) => { errData += c })
              apiRes.on('end', () => {
                console.error('[OpenAI API Error]', errData)
                let errorMsg = `OpenAI API Error (${apiRes.statusCode})`
                try {
                  const parsedErr = JSON.parse(errData)
                  if (parsedErr.error?.message) errorMsg = parsedErr.error.message
                } catch {
                  // default message
                }
                res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
                res.end()
              })
              return
            }

            let streamBuffer = ''

            apiRes.on('data', (chunk) => {
              streamBuffer += chunk.toString('utf-8')
              const lines = streamBuffer.split('\n')
              streamBuffer = lines.pop() || ''

              for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed || trimmed.startsWith(':')) continue

                if (trimmed.startsWith('data: ')) {
                  const dataStr = trimmed.slice(6).trim()
                  if (dataStr === '[DONE]') {
                    res.write('data: [DONE]\n\n')
                    continue
                  }
                  try {
                    const parsed = JSON.parse(dataStr)
                    const text =
                      parsed.choices?.[0]?.delta?.content ||
                      parsed.choices?.[0]?.text ||
                      parsed.choices?.[0]?.message?.content ||
                      ''
                    if (text) {
                      res.write(`data: ${JSON.stringify({ text })}\n\n`)
                    }
                  } catch {
                    // Ignore non-parseable raw JSON
                  }
                }
              }
            })

            apiRes.on('end', () => {
              if (streamBuffer.trim()) {
                const line = streamBuffer.trim()
                if (line.startsWith('data: ')) {
                  const dataStr = line.slice(6).trim()
                  if (dataStr !== '[DONE]') {
                    try {
                      const parsed = JSON.parse(dataStr)
                      const text = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || ''
                      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`)
                    } catch {
                      // ignore
                    }
                  }
                }
              }
              res.write('data: [DONE]\n\n')
              res.end()
            })
          }
        )

        apiReq.on('error', (err) => {
          console.error('[OpenAI Connection Error]', err)
          res.write(`data: ${JSON.stringify({ error: `Backend connection error: ${err.message}` })}\n\n`)
          res.end()
        })

        apiReq.write(postData)
        apiReq.end()
      } catch (e) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: `Invalid JSON body: ${e.message}` }))
      }
    })
    return
  }

  // ─── 2. CHECK AVAILABLE MODELS (/api/ai/models) ───
  if (req.url === '/api/ai/models' && req.method === 'GET') {
    if (!OPENAI_API_KEY) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the backend server.' }))
      return
    }

    const apiReq = https.request(
      'https://api.openai.com/v1/models',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      },
      (apiRes) => {
        let resData = ''
        apiRes.on('data', (c) => { resData += c })
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(resData)
            if (apiRes.statusCode !== 200) {
              res.statusCode = apiRes.statusCode || 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: parsed.error?.message || `Failed to fetch models (${apiRes.statusCode})` }))
              return
            }

            const allModels = parsed.data || []
            const imageModels = allModels
              .filter((m) => m.id.includes('image') || m.id.includes('dall-e'))
              .map((m) => ({
                id: m.id,
                name: m.id,
                available: true,
                created: m.created,
                owned_by: m.owned_by,
              }))

            const gptImage1InList = allModels.some((m) => m.id === 'gpt-image-1')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              models: imageModels,
              allModelsCount: allModels.length,
              gptImage1Available: gptImage1InList,
              reason: gptImage1InList
                ? 'gpt-image-1 model is listed and available for your API key.'
                : 'The model "gpt-image-1" was not returned by GET /v1/models for your API key. (Account permission or model rollout in progress).',
            }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `Parse error: ${e.message}` }))
          }
        })
      }
    )

    apiReq.on('error', (err) => {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: `Connection error: ${err.message}` }))
    })

    apiReq.end()
    return
  }

  // ─── 3. LATEST OPENAI IMAGES API ENDPOINT (/api/ai/image) ───
  if (req.url === '/api/ai/image' && req.method === 'POST') {
    if (!OPENAI_API_KEY) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured on the backend server.' }))
      return
    }

    let bodyStr = ''
    req.on('data', (chunk) => { bodyStr += chunk })

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyStr || '{}')
        const prompt = body.prompt
        if (!prompt) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Prompt is required for image generation.' }))
          return
        }

        const reqModel = body.model || 'gpt-image-1'
        const reqSize = body.size || '1024x1024'
        const allowedQuality = ['low', 'medium', 'high', 'auto']
        const reqQuality = allowedQuality.includes(body.quality) ? body.quality : 'auto'
        const reqN = body.n || 1

        const postObj = {
          model: reqModel,
          prompt: prompt,
          size: reqSize,
          quality: reqQuality,
          n: reqN,
        }
        const postData = JSON.stringify(postObj)
        const timestamp = new Date().toISOString()

        const apiReq = https.request(
          'https://api.openai.com/v1/images/generations',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (apiRes) => {
            let resData = ''
            apiRes.on('data', (c) => { resData += c })
            apiRes.on('end', () => {
              let parsedRes = null
              try {
                parsedRes = JSON.parse(resData)
              } catch {
                parsedRes = { raw: resData }
              }

              const requestId = apiRes.headers['x-request-id'] || parsedRes.error?.request_id || null

              // Requirement 5: Log full API request and response in server logs
              console.log('====================================================')
              console.log(`[OpenAI Image Request] ${timestamp}`)
              console.log(`Model: ${reqModel}`)
              console.log(`Prompt: ${prompt}`)
              console.log(`Size: ${reqSize}`)
              console.log(`Quality: ${reqQuality}`)
              console.log(`HTTP Status: ${apiRes.statusCode}`)
              console.log(`Request ID: ${requestId || 'N/A'}`)
              console.log(`OpenAI Response:`, JSON.stringify(parsedRes, null, 2))
              console.log('====================================================')

              if (apiRes.statusCode !== 200) {
                const errObj = parsedRes.error || {}
                const structuredError = {
                  httpStatus: apiRes.statusCode || 400,
                  type: errObj.type || 'invalid_request_error',
                  code: errObj.code || 'model_error',
                  message: errObj.message || `OpenAI API Error (${apiRes.statusCode})`,
                  requestedModel: reqModel,
                  requestId: requestId,
                  param: errObj.param || null,
                }

                // Requirement 1 & 7: NEVER fall back silently. Return EXACT structured OpenAI error.
                res.statusCode = apiRes.statusCode || 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  error: structuredError,
                  rawResponse: parsedRes,
                }))
                return
              }

              const imageUrl = parsedRes.data?.[0]?.url
              const b64 = parsedRes.data?.[0]?.b64_json
              if (imageUrl || b64) {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  url: imageUrl || `data:image/png;base64,${b64}`,
                  rawResponse: parsedRes,
                  modelUsed: reqModel,
                  requestId: requestId,
                }))
              } else {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'No image URL or Base64 data returned in OpenAI response.' }))
              }
            })
          }
        )

        apiReq.on('error', (err) => {
          console.error('[OpenAI Image Connection Error]', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: `Backend connection error: ${err.message}` }))
        })

        apiReq.write(postData)
        apiReq.end()
      } catch (e) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: `Invalid JSON body: ${e.message}` }))
      }
    })
    return
  }

  res.statusCode = 404
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: 'Endpoint Not Found' }))
})

server.listen(PORT, () => {
  console.log(`🤖 Trufocus AI Backend Proxy Server running on http://localhost:${PORT}`)
})
