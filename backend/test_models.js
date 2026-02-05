const axios = require('axios');
require('dotenv').config();

const models = [
  'claude-3-5-sonnet-latest',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-20240620',
  'claude-3-opus-latest',
  'claude-3-sonnet-20240229'
];

async function testModel(model) {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    console.log(`✓ ${model} - WORKS!`);
    return true;
  } catch (error) {
    const errMsg = error.response && error.response.data && error.response.data.error
      ? error.response.data.error.message
      : error.message;
    console.log(`✗ ${model} - ${errMsg}`);
    return false;
  }
}

async function main() {
  console.log('Testing Anthropic Claude models...\n');
  for (const model of models) {
    await testModel(model);
  }
}

main();
