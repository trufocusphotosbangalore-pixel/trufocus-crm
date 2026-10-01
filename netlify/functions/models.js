exports.handler = async () => {
  const activeModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      activeModel: activeModel,
      models: [
        { id: activeModel, name: activeModel },
        { id: 'gpt-4o-mini', name: 'gpt-4o-mini' },
        { id: 'gpt-4o', name: 'gpt-4o' },
        { id: 'o3-mini', name: 'o3-mini' },
      ],
    }),
  }
}
