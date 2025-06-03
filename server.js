const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not found in environment variables');
    process.exit(1);
}

// OpenAI API call function
async function callOpenAI(model, messages) {
    try {
        const response = await axios.post(`${OPENAI_BASE_URL}/chat/completions`, {
            model: model,
            messages: messages,
            max_tokens: 500,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling OpenAI API:', error.response?.data || error.message);
        throw new Error('Failed to generate content from OpenAI');
    }
}

// Create orchestration prompt
function createOrchestrationPrompt(clientInfo) {
    return [
        {
            role: "system",
            content: `You are an expert real estate marketing strategist. Your task is to analyze client information and create a strategic plan for generating effective Google Ads copy. Focus on identifying key selling points, target audience motivations, and effective messaging approaches for real estate marketing.`
        },
        {
            role: "user",
            content: `I need to create Google Ads for a real estate client with the following information:
            
Client Name: ${clientInfo.name || 'N/A'}
Website: ${clientInfo.website || 'N/A'}
Property Type: ${clientInfo.industry || 'Luxury Apartment Rentals'}
Target Audience: ${clientInfo.targetAudience || 'Young professionals and high-income individuals'}
Location: ${clientInfo.geographicTargeting || 'N/A'}
Unique Selling Points: ${clientInfo.uniqueSellingPoints || 'N/A'}
Competitors: ${clientInfo.competitors || 'N/A'}
Brand Voice: ${clientInfo.brandVoice || 'Professional and upscale'}
Call to Action: ${clientInfo.callToAction || 'Schedule a tour today'}

Provide a strategic approach for creating effective Google Ads copy for this client. Identify 3-5 key themes or angles to highlight, considering the target audience and unique selling points. Do not write the actual ad copy yet.`
        }
    ];
}

// Create generation prompt
function createGenerationPrompt(clientInfo, orchestrationResult) {
    return [
        {
            role: "system",
            content: `You are an expert Google Ads copywriter specializing in real estate marketing. Your task is to create exactly one Google Ad that follows these strict requirements:

1. Headlines: Create exactly 3 headlines, each maximum 30 characters
2. Descriptions: Create exactly 2 descriptions, each maximum 90 characters
3. Path fields: Create exactly 2 path fields, each maximum 15 characters

The ad must be compelling, focused on benefits, and include a clear call to action. Format your response as a JSON object with these exact keys: headlines (array of 3 strings), descriptions (array of 2 strings), paths (array of 2 strings).`
        },
        {
            role: "user",
            content: `Create one Google Ad for this real estate client:
            
Client Name: ${clientInfo.name || 'N/A'}
Website: ${clientInfo.website || 'N/A'}
Property Type: ${clientInfo.industry || 'Luxury Apartment Rentals'}
Target Audience: ${clientInfo.targetAudience || 'Young professionals and high-income individuals'}
Location: ${clientInfo.geographicTargeting || 'N/A'}
Unique Selling Points: ${clientInfo.uniqueSellingPoints || 'N/A'}
Brand Voice: ${clientInfo.brandVoice || 'Professional and upscale'}
Call to Action: ${clientInfo.callToAction || 'Schedule a tour today'}

Strategic approach from our marketing team:
${orchestrationResult}

Remember:
- Each headline must be 30 characters or less
- Each description must be 90 characters or less
- Each path field must be 15 characters or less
- Format as JSON with keys: headlines, descriptions, paths
- Focus on real estate marketing best practices
- Include the call to action`
        }
    ];
}

// Parse generated ad copy
function parseGeneratedAdCopy(generationResult) {
    try {
        // Try to parse as JSON
        const jsonMatch = generationResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const adCopy = JSON.parse(jsonStr);
            
            // Validate and ensure all required fields are present
            return {
                headlines: validateAndTruncateArray(adCopy.headlines || [], 3, 30),
                descriptions: validateAndTruncateArray(adCopy.descriptions || [], 2, 90),
                paths: validateAndTruncateArray(adCopy.paths || [], 2, 15)
            };
        }
        
        // If JSON parsing fails, return fallback
        return getFallbackAdCopy();
    } catch (error) {
        console.error('Error parsing generated ad copy:', error);
        return getFallbackAdCopy();
    }
}

// Validate and truncate array
function validateAndTruncateArray(array, count, maxLength) {
    const result = [];
    
    for (let i = 0; i < count; i++) {
        if (i < array.length && array[i] && typeof array[i] === 'string') {
            const truncated = array[i].substring(0, maxLength).trim();
            result.push(truncated);
        } else {
            result.push(getPlaceholder(i + 1, maxLength));
        }
    }
    
    return result;
}

// Get placeholder text
function getPlaceholder(index, maxLength) {
    const placeholders = {
        30: [`Headline ${index}`, `Great Service`, `Quality Work`],
        90: [`Description ${index} - Provide details about your service offering.`, `Professional service with excellent results.`],
        15: [`path${index}`, `service`, `contact`]
    };
    
    const options = placeholders[maxLength] || [`text${index}`];
    const placeholder = options[(index - 1) % options.length];
    return placeholder.substring(0, maxLength);
}

// Get fallback ad copy
function getFallbackAdCopy() {
    return {
        headlines: ["Premium Service", "Quality Results", "Expert Solutions"],
        descriptions: ["Professional service with excellent results.", "Contact us today for a free consultation."],
        paths: ["service", "contact"]
    };
}

// API endpoint to generate ad copy
app.post('/api/generate-ad-copy', async (req, res) => {
    try {
        const clientInfo = req.body;
        
        // Validate required fields
        const requiredFields = ['name', 'website', 'industry', 'targetAudience', 'geographicTargeting', 'uniqueSellingPoints', 'brandVoice', 'callToAction'];
        const missingFields = requiredFields.filter(field => !clientInfo[field] || clientInfo[field].trim() === '');
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missingFields: missingFields
            });
        }

        // First use GPT-4 for orchestration
        const orchestrationPrompt = createOrchestrationPrompt(clientInfo);
        const orchestrationResult = await callOpenAI('gpt-4', orchestrationPrompt);

        // Then use GPT-3.5-Turbo for generation based on orchestration
        const generationPrompt = createGenerationPrompt(clientInfo, orchestrationResult);
        const generationResult = await callOpenAI('gpt-3.5-turbo', generationPrompt);

        // Parse and format the generated ad copy
        const adCopy = parseGeneratedAdCopy(generationResult);
        
        res.json({
            success: true,
            adCopy: adCopy,
            orchestration: orchestrationResult
        });
        
    } catch (error) {
        console.error('Error in /api/generate-ad-copy:', error);
        res.status(500).json({
            error: 'Failed to generate ad copy',
            message: error.message,
            adCopy: getFallbackAdCopy()
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        openaiConfigured: !!OPENAI_API_KEY
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`OpenAI API Key configured: ${OPENAI_API_KEY ? 'Yes' : 'No'}`);
});

module.exports = app; 