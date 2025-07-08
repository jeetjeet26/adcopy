require('dotenv').config();
const https = require('https');
const SEMRUSH_API_KEY = process.env.SEMRUSH_API_KEY;

async function testAlternativeKeywordEndpoints() {
    console.log('=== TESTING ALTERNATIVE KEYWORD ENDPOINTS ===\n');
    
    if (!SEMRUSH_API_KEY) {
        console.error('❌ No Semrush API key found');
        return;
    }
    
    const testKeyword = 'luxury apartments';
    
    // Test different keyword-related endpoints
    const endpoints = [
        {
            name: 'Current (phrase_all) - TIMING OUT',
            type: 'phrase_all',
            params: `phrase=${encodeURIComponent(testKeyword)}&database=us&export_columns=Ph,Nq,Cp,Co,Nr,Td&display_limit=10`
        },
        {
            name: 'Related Keywords (phrase_related)',
            type: 'phrase_related', 
            params: `phrase=${encodeURIComponent(testKeyword)}&database=us&export_columns=Ph,Nq,Cp,Co,Nr,Td&display_limit=10`
        },
        {
            name: 'Keyword Overview (phrase_this)',
            type: 'phrase_this',
            params: `phrase=${encodeURIComponent(testKeyword)}&database=us&export_columns=Ph,Nq,Cp,Co,Nr,Td`
        },
        {
            name: 'Keyword Questions (phrase_questions)',
            type: 'phrase_questions',
            params: `phrase=${encodeURIComponent(testKeyword)}&database=us&export_columns=Ph,Nq,Cp,Co,Nr,Td&display_limit=10`
        },
        {
            name: 'Phrase Fullsearch',
            type: 'phrase_fullsearch',
            params: `phrase=${encodeURIComponent(testKeyword)}&database=us&export_columns=Ph,Nq,Cp,Co,Nr,Td&display_limit=10`
        },
        {
            name: 'Working Domain Organic (for comparison)',
            type: 'domain_organic',
            params: `domain=realtor.com&database=us&export_columns=Ph,Po,Pp,Pd,Nq,Cp,Ur,Tr,Tc,Co,Nr,Td&display_limit=10`
        }
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n🧪 Testing: ${endpoint.name}`);
        console.log(`📋 Type: ${endpoint.type}`);
        
        const url = `https://api.semrush.com/?type=${endpoint.type}&key=${SEMRUSH_API_KEY}&${endpoint.params}`;
        console.log(`🔗 URL: ${url.replace(SEMRUSH_API_KEY, '[API_KEY]')}`);
        
        try {
            const startTime = Date.now();
            const response = await makeRequest(url, 15000); // 15 second timeout
            const duration = Date.now() - startTime;
            
            console.log(`✅ Success! Response time: ${duration}ms`);
            console.log(`📝 Response length: ${response.length} characters`);
            
            if (response.includes('ERROR')) {
                console.log(`⚠️  API Error: ${response}`);
            } else if (response.includes('NOTHING FOUND')) {
                console.log(`ℹ️  No data found for this query`);
            } else {
                const lines = response.split('\n').slice(0, 3);
                console.log(`📄 Response preview:`);
                lines.forEach((line, i) => {
                    if (line.trim()) console.log(`   ${i + 1}: ${line.substring(0, 100)}...`);
                });
            }
            
        } catch (error) {
            console.log(`❌ Failed: ${error.message}`);
            
            if (error.message.includes('timeout')) {
                console.log('   → This endpoint is timing out (like the main issue)');
            } else if (error.message.includes('400')) {
                console.log('   → Bad request - endpoint might not exist or have wrong parameters');
            }
        }
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('Based on results above:');
    console.log('1. ✅ Working endpoints should be used as alternatives');
    console.log('2. ❌ Timing out endpoints should be avoided');
    console.log('3. 🔄 Consider hybrid approach using working endpoints');
}

function makeRequest(url, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error(`Request timeout after ${timeout}ms`));
        });
        
        req.on('error', (error) => {
            reject(error);
        });
    });
}

testAlternativeKeywordEndpoints().catch(console.error); 