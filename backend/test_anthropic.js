const axios = require('axios');
require('dotenv').config();

async function test() {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 100,
        messages: [{ role: 'user', content: 'Say hello' }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.log('ERROR:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

test();
