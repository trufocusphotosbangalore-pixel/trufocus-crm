const https = require('https')

function isReasoningModel(model) {
  const m = (model || '').toLowerCase().trim()
  return m.startsWith('o1') || m.startsWith('o3') || m.includes('reasoning') || m.startsWith('gpt-5')
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  const openAiKey = process.env.OPENAI_API_KEY || ''
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  try {
    const body = JSON.parse(event.body || '{}')
    const clientMessages = body.messages || []
    const crmContext = body.crmContext || ''
    const systemPrompt = body.systemPrompt || 'You are Trufocus AI assistant.'
    const fullSystemPrompt = crmContext && !systemPrompt.includes('=== LIVE TRUFOCUS CRM CONTEXT ===')
      ? `${systemPrompt}\n\n=== LIVE CRM CONTEXT ===\n${crmContext}`
      : systemPrompt

    const formattedMessages = [
      { role: 'system', content: fullSystemPrompt },
      ...clientMessages,
    ]

    // Helper: Make HTTP request to OpenAI
    const requestOpenAI = (includeTemperature = true) => {
      return new Promise((resolve) => {
        const payloadObj = {
          model: modelName,
          messages: formattedMessages,
        }

        // Only include temperature if model supports it and includeTemperature is true
        if (includeTemperature && !isReasoningModel(modelName)) {
          payloadObj.temperature = 0.7
        }

        const postData = JSON.stringify(payloadObj)

        const req = https.request(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openAiKey}`,
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res) => {
            let data = ''
            res.on('data', (c) => { data += c })
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data)
                if (res.statusCode === 200 && parsed.choices?.[0]?.message?.content) {
                  const replyText = parsed.choices[0].message.content
                  return resolve({
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                      reply: replyText,
                      model: modelName,
                      choices: [{ delta: { content: replyText } }],
                    }),
                  })
                }
                const errMsg = parsed.error?.message || (typeof parsed.error === 'string' ? parsed.error : `OpenAI status ${res.statusCode}`)
                return resolve({ statusCode: res.statusCode || 500, errorMsg: errMsg, rawResponse: parsed })
              } catch (e) {
                return resolve({ statusCode: 500, errorMsg: 'Failed to parse OpenAI API response.' })
              }
            })
          }
        )

        req.on('error', (err) => resolve({ statusCode: 500, errorMsg: err.message }))
        req.write(postData)
        req.end()
      })
    }

    // Helper: Call Gemini API as fallback
    const callGemini = () => {
      return new Promise((resolve) => {
        const contents = clientMessages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }))

        const postData = JSON.stringify({
          systemInstruction: { parts: [{ text: fullSystemPrompt }] },
          contents: contents,
        })

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
        const req = https.request(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
            },
          },
          (res) => {
            let data = ''
            res.on('data', (c) => { data += c })
            res.on('end', () => {
              try {
                const parsed = JSON.parse(data)
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                if (res.statusCode === 200 && text) {
                  return resolve({
                    statusCode: 200,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                    body: JSON.stringify({
                      reply: text,
                      model: 'gemini-1.5-flash',
                      choices: [{ delta: { content: text } }],
                    }),
                  })
                }
                const errMsg = parsed.error?.message || (typeof parsed.error === 'string' ? parsed.error : `Gemini status ${res.statusCode}`)
                return resolve({ statusCode: res.statusCode || 500, body: JSON.stringify({ error: errMsg }) })
              } catch (e) {
                return resolve({ statusCode: 500, body: JSON.stringify({ error: 'Failed to parse Gemini response.' }) })
              }
            })
          }
        )

        req.on('error', (err) => resolve({ statusCode: 500, body: JSON.stringify({ error: err.message }) }))
        req.write(postData)
        req.end()
      })
    }

    if (openAiKey) {
      let openAiRes = await requestOpenAI(true)
      // Retry without temperature if OpenAI returns temperature error
      if (openAiRes.statusCode !== 200 && openAiRes.errorMsg && openAiRes.errorMsg.includes('temperature')) {
        console.warn(`[OpenAI Netlify] Temperature unsupported for model '${modelName}'. Retrying without temperature...`)
        openAiRes = await requestOpenAI(false)
      }

      if (openAiRes.statusCode === 200) return openAiRes
      if (geminiKey) return await callGemini()
      return {
        statusCode: openAiRes.statusCode || 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: openAiRes.errorMsg || 'OpenAI request failed.' }),
      }
    }

    if (geminiKey) {
      return await callGemini()
    }

    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'No AI API Key configured on server. Set OPENAI_API_KEY in Netlify Environment Variables.' }),
    }
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON request body.' }) }
  }
}
