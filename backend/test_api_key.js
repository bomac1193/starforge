const axios = require('axios');
require('dotenv').config();

async function testAPIKey() {
  console.log('Testing API key validity...\n');

  // Try the official latest model name according to Anthropic docs
  const modelsToTry = [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Trying: ${model}`);
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
          },
          timeout: 10000
        }
      );
      console.log(`✓ SUCCESS with ${model}!`);
      console.log('Response:', response.data);
      return model;
    } catch (error) {
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Error:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(`  Error: ${error.message}`);
      }
    }
  }

  console.log('\n❌ All models failed. API key might be invalid or has no access.');
  console.log('Check: https://console.anthropic.com/settings/keys');
}

testAPIKey();
