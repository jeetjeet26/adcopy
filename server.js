const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const OpenAIConfig = require('./openai_config');
const OpenAIConnector = require('./openai_connector');
const SemrushConnector = require('./semrush_connector');
const { handleError, AppError } = require('./error_handling');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Initialize services
let openaiConnector;
let semrushConnector;

try {
    const config = new OpenAIConfig();
    openaiConnector = new OpenAIConnector(config);
    console.log('OpenAI connector initialized successfully');
    
    // Initialize Semrush connector if API key is provided
    if (process.env.SEMRUSH_API_KEY) {
        semrushConnector = new SemrushConnector(process.env.SEMRUSH_API_KEY, openaiConnector);
        console.log('Semrush connector initialized successfully');
    } else {
        console.warn('SEMRUSH_API_KEY not found in environment variables.');
        console.warn('Keyword generation will require Semrush API configuration.');
        console.warn('To enable keyword generation:');
        console.warn('1. Get your API key from https://www.semrush.com/api-documentation/');
        console.warn('2. Add SEMRUSH_API_KEY=your_key_here to your .env file');
        console.warn('3. Restart the server');
    }
    
    console.log('Services initialized successfully');
} catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                openai: await openaiConnector.testConnection(),
                semrush: {
                    configured: !!semrushConnector,
                    working: semrushConnector ? await semrushConnector.testConnection() : false
                }
            }
        };
        
        // Add configuration guidance if Semrush is not configured
        if (!semrushConnector) {
            health.configuration = {
                semrush: {
                    required: true,
                    message: "Semrush API key required for keyword generation",
                    instructions: [
                        "1. Get API key from https://www.semrush.com/api-documentation/",
                        "2. Add SEMRUSH_API_KEY=your_key_here to .env file",
                        "3. Restart server"
                    ]
                }
            };
        }
        
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API endpoint to generate ad copy
app.post('/api/generate-ad-copy', async (req, res) => {
    try {
        console.log('=== AD COPY GENERATION REQUEST ===');
        console.log('Full request body:', JSON.stringify(req.body, null, 2));
        console.log('Client info received:', req.body.clientInfo);
        console.log('Campaign context received:', req.body.campaignContext);
        console.log('Saved keywords received:', req.body.savedKeywords);
        console.log('Generating ad copy for client:', req.body.clientInfo?.name || 'Unknown');
        
        const { clientInfo, campaignContext, adGroupContext, savedKeywords } = req.body;
        
        let keywordData = null;
        
        // Check if this is a unit type campaign with saved keywords
        console.log('Checking unit type conditions:');
        console.log('- campaignContext exists:', !!campaignContext);
        console.log('- campaignContext.isUnitType:', campaignContext?.isUnitType);
        console.log('- savedKeywords exists:', !!savedKeywords);
        console.log('- savedKeywords length:', savedKeywords?.length);
        
        if (campaignContext && campaignContext.isUnitType && savedKeywords && savedKeywords.length > 0) {
            console.log('✓ Unit type campaign detected with saved keywords. Using saved keywords for ad copy generation.');
            
            // Convert saved keywords to the expected keywordData format
            const formattedKeywords = savedKeywords.map(kw => ({
                keyword: kw.text,
                searchVolume: 1000, // Default values since we don't have real data for saved keywords
                competition: 0.5,
                cpc: 1.50,
                matchType: kw.matchType
            }));
            
            keywordData = {
                keywords: {
                    highVolume: formattedKeywords.slice(0, 10),
                    mediumVolume: formattedKeywords.slice(10, 20),
                    lowVolume: [],
                    lowCompetition: formattedKeywords.filter(kw => kw.matchType === 'exact'),
                    all: formattedKeywords
                },
                analysis: {
                    coreTopics: [adGroupContext.name],
                    industryTerms: ['real estate', 'property', 'homes'],
                    seedKeywords: formattedKeywords.slice(0, 5).map(kw => kw.keyword),
                    targetingInsights: `Keywords focused on ${adGroupContext.name} for unit type campaign`
                },
                recommendations: {
                    primaryKeywords: formattedKeywords.slice(0, 5),
                    longTail: formattedKeywords.filter(kw => kw.keyword.split(' ').length >= 3),
                    branded: []
                }
            };
        } else {
            // For non-unit type campaigns or when no saved keywords, generate keywords via Semrush
            console.log('✗ Not a unit type campaign with saved keywords. Using Semrush keyword generation.');
            if (semrushConnector) {
                try {
                    console.log('Generating keywords for ad copy context...');
                    keywordData = await semrushConnector.generateKeywordRecommendations(
                        clientInfo, 
                        campaignContext, 
                        adGroupContext
                    );
                    console.log('Keywords generated successfully for ad copy');
                } catch (error) {
                    console.warn('Failed to generate keywords for ad copy, proceeding without them:', error.message);
                    // Continue without keywords if generation fails
                }
            } else {
                console.log('Semrush not configured, generating ad copy without keyword data');
            }
        }
        
        // Use the OpenAI connector to generate ad copy with keyword context
        const adCopy = await openaiConnector.generateAdCopy(clientInfo, campaignContext, adGroupContext, keywordData);
        
        res.json({
            success: true,
            data: {
                adCopy
            }
        });
        
    } catch (error) {
        console.error('Error generating ad copy:', error);
        handleError(error, res);
    }
});

app.post('/api/generate-keywords', async (req, res) => {
    try {
        console.log('Generating keywords for client:', req.body.clientInfo?.clientName || 'Unknown');
        
        if (!semrushConnector) {
            // Return a helpful response instead of throwing an error
            return res.json({
                success: false,
                message: 'Keyword generation is not available',
                reason: 'Semrush API key not configured',
                instructions: {
                    title: 'To enable keyword generation:',
                    steps: [
                        '1. Get your API key from https://www.semrush.com/api-documentation/',
                        '2. Add SEMRUSH_API_KEY=your_key_here to your .env file',
                        '3. Restart the server'
                    ]
                },
                data: {
                    keywords: [],
                    message: 'Configure Semrush API key to generate keyword recommendations'
                }
            });
        }
        
        if (!req.body.adGroupContext || !req.body.adGroupContext.name) {
            throw new AppError(400, 'AD_GROUP_NAME_REQUIRED', 'Ad group name is required for keyword generation');
        }
        let { clientInfo, campaignContext, adGroupContext } = req.body;
        // If this is a unit type campaign, only use adGroupContext.name
        if (campaignContext && campaignContext.isUnitType) {
            clientInfo = {};
            campaignContext = null;
            adGroupContext = { name: adGroupContext.name };
        }
        // Generate keyword recommendations using AI analysis + Semrush data with campaign context
        const keywordData = await semrushConnector.generateKeywordRecommendations(
            clientInfo, 
            campaignContext, 
            adGroupContext
        );
        res.json({
            success: true,
            data: keywordData
        });
    } catch (error) {
        console.error('Error generating keywords:', error);
        handleError(error, res);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    handleError(err, res);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 