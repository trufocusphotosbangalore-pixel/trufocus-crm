const https = require('https')

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

  const apiKey = process.env.OPENAI_API_KEY || ''
  
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'OPENAI_API_KEY is missing on server.' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const prompt = body.prompt
    const model = body.model || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'
    const size = body.size || '1024x1024'
    let quality = body.quality || 'auto'
    const supportedQualities = ['low', 'medium', 'high', 'auto']
    if (!supportedQualities.includes(quality)) quality = 'auto'

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required.' }) }
    }

    const payload = { model, prompt, size, quality, n: 1 }
    const postData = JSON.stringify(payload)

    return new Promise((resolve) => {
      const apiReq = https.request(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (apiRes) => {
          let resData = ''
          apiRes.on('data', (chunk) => { resData += chunk })
          apiRes.on('end', () => {
            if (apiRes.statusCode !== 200) {
              let parsedErr = {}
              try { parsedErr = JSON.parse(resData) } catch (e) {}

              const errorObj = parsedErr.error || {}
              return resolve({
                statusCode: apiRes.statusCode,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  error: {
                    httpStatus: apiRes.statusCode,
                    type: errorObj.type || 'api_error',
                    code: errorObj.code || 'unknown_error',
                    message: errorObj.message || `OpenAI returned status ${apiRes.statusCode}`,
                    requestedModel: model,
                    requestId: apiRes.headers['x-request-id'] || null,
                  },
                }),
              })
            }

            return resolve({
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
              body: resData,
            })
          })
        }
      )

      apiReq.on('error', (err) => {
        resolve({
          statusCode: 500,
          body: JSON.stringify({
            error: {
              httpStatus: 500,
              type: 'network_error',
              code: 'request_failed',
              message: err.message,
              requestedModel: model,
            },
          }),
        })
      })

      apiReq.write(postData)
      apiReq.end()
    })
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON request body.' }) }
  }
}
