const axios = require('axios');
require('dotenv').config();

const testSemrushAPI = async () => {
    try {
        const params = {
            type: 'phrase_this',
            phrase: 'seo',
            database: 'us',
            export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
            display_limit: 5,
            key: process.env.SEMRUSH_API_KEY
        };
        
        console.log('Testing Semrush API with params:', {
            ...params,
            key: params.key ? 'API_KEY_PRESENT' : 'NO_API_KEY'
        });
        
        const response = await axios.get('https://api.semrush.com/', {
            params: params,
            timeout: 30000
        });
        
        console.log('SUCCESS!');
        console.log('Response status:', response.status);
        console.log('Response data:', response.data.substring(0, 500) + '...');
    } catch (error) {
        console.error('ERROR DETAILS:');
        console.error('Status:', error.response?.status);
        console.error('Status text:', error.response?.statusText);
        console.error('Response data:', error.response?.data);
        console.error('Request URL:', error.config?.url);
        
        if (error.response?.status === 403) {
            console.error('\n403 Forbidden - This suggests:');
            console.error('1. Invalid API key');
            console.error('2. API key doesn\'t have permission for this endpoint');
            console.error('3. API key is expired or disabled');
            console.error('4. Incorrect endpoint or parameters');
        }
    }
};

testSemrushAPI(); 