const axios = require('axios');
const OpenAIConnector = require('./openai_connector');

class SemrushConnector {
    constructor(apiKey, openaiConnector) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.semrush.com/';
        this.openaiConnector = openaiConnector;
    }

    /**
     * Analyze client information to extract key topics and themes for keyword research
     * @param {Object} clientInfo - Client information from the form
     * @param {Object} campaignContext - Selected campaign context (name, objective, budget)
     * @param {Object} adGroupContext - Selected ad group context (name, theme, target audience)
     * @returns {Promise<Object>} - Analysis results with topics and search terms
     */
    async analyzeClientInfo(clientInfo, campaignContext = null, adGroupContext = null) {
        try {
            console.log('\n=== ANALYZE CLIENT INFO ===');
            console.log('Input clientInfo:', clientInfo);
            console.log('Input campaignContext:', campaignContext);
            console.log('Input adGroupContext:', adGroupContext);
            
            // Check if this is a unit type campaign (empty clientInfo and campaignContext, only adGroupContext.name)
            const isUnitTypeCampaign = (!clientInfo || Object.keys(clientInfo).length === 0) && 
                                       !campaignContext && 
                                       adGroupContext && 
                                       adGroupContext.name;

            // Check if this is a General Search campaign (isUnitType=false) with Location ad group
            const isGeneralSearchCampaign = campaignContext && 
                                           campaignContext.isUnitType === false && 
                                           adGroupContext && 
                                           adGroupContext.name === 'Location';
                                           
            console.log('Campaign type detection:');
            console.log('- isUnitTypeCampaign:', isUnitTypeCampaign);
            console.log('- isGeneralSearchCampaign:', isGeneralSearchCampaign);
            console.log('===========================\n');

            if (isGeneralSearchCampaign) {
                // For General Search campaigns, generate location-based keywords
                console.log('General Search campaign detected. Generating location-based keywords.');
                
                const locationPrompt = [
                    {
                        role: "system",
                        content: `You are a keyword research specialist for General Search real estate campaigns. Your task is to generate location-based keywords that cover the 4 main classifications:

1. Location - Direct location-based terms
2. New Apartments - New apartment/property related terms
3. Near - Proximity-based terms (near, close to, by)
4. Access To - Access/connectivity terms (access to, walking distance to, minutes from)

Generate keywords that attract users searching for apartments or homes with language about:
- Nearby locations (downtown, neighborhoods, landmarks)
- Public works (transit, utilities, infrastructure)
- Schools (elementary, high school, college)
- Amenities (shopping, dining, entertainment)
- Must cover: client name, price point, amenities, nearby locations

Return JSON with:
- coreTopics: array of 4-6 location-based topics
- industryTerms: array of 6-10 real estate location terms
- seedKeywords: array of 15-20 location-focused keywords
- targetingInsights: description of location targeting strategy`
                    },
                    {
                        role: "user",
                        content: `Generate General Search location-based keywords for:

Client Information:
- Client Name: ${clientInfo.clientName || clientInfo.name || 'Property Management'}
- Location: ${clientInfo.geographicTargeting || 'Metropolitan Area'}
- Industry: ${clientInfo.industry || 'Real Estate'}
- Target Audience: ${clientInfo.targetAudience || 'Apartment/Home Seekers'}
- Unique Selling Points: ${clientInfo.uniqueSellingPoints || 'Quality Living'}
- Price Point: ${clientInfo.budget || 'Competitive Pricing'}

Campaign Context:
- Campaign Name: ${campaignContext.name}
- Campaign Budget: ${campaignContext.budget || 'Not specified'}

Focus on creating keywords that cover:
1. **Location**: Direct location terms (e.g., "apartments downtown [city]", "[neighborhood] homes")
2. **New Apartments**: New construction terms (e.g., "new apartments [location]", "newly built homes")
3. **Near**: Proximity terms (e.g., "apartments near [landmark]", "homes close to [area]")
4. **Access To**: Connectivity terms (e.g., "apartments walking distance to [transit]", "homes with access to [amenities]")

Generate keywords that would attract searchers looking for properties in the specified location with nearby amenities, schools, and public works.`
                    }
                ];

                const analysis = await this.openaiConnector.generateResponse(locationPrompt, 'gpt-4o');
                const analysisData = this.parseJsonResponse(analysis);
                
                console.log('General Search campaign analysis completed:', analysisData);
                return analysisData;
            }

            if (isUnitTypeCampaign) {
                // For unit type campaigns, generate keywords strictly based on ad group name
                const adGroupName = adGroupContext.name;
                console.log('Unit type campaign detected. Using ad group name only:', adGroupName);
                
                const unitTypePrompt = [
                    {
                        role: "system",
                        content: `You are a keyword research specialist for real estate/property unit type campaigns. Your task is to generate keyword variations and related terms based STRICTLY on the ad group name provided.

For unit type campaigns like "4 bedroom house", "3 bedroom apartment", etc., generate:
1. Direct variations of the ad group name
2. Related property search terms
3. Intent-based variations (for sale, for rent, new, etc.)
4. Location-agnostic terms that could apply anywhere

Return JSON with:
- coreTopics: array of 3-5 core property types/categories
- industryTerms: array of 5-8 real estate related terms
- seedKeywords: array of 10-15 keyword variations based on the ad group name
- targetingInsights: brief description of what searchers would be looking for`
                    },
                    {
                        role: "user",
                        content: `Generate keyword research terms based ONLY on this ad group name: "${adGroupName}"

Focus on creating variations like:
- Direct matches (e.g., "4 bedroom homes")
- Property type variations (e.g., "4 bedroom house", "4 bedroom townhouse")
- Search intent variations (e.g., "4 bedroom homes for sale", "new 4 bedroom houses")
- Feature variations (e.g., "4 bed 4 bath homes", "four bedroom properties")

Do NOT include any business names, locations, or unrelated terms. Focus strictly on property/unit type keywords.`
                    }
                ];

                const analysis = await this.openaiConnector.generateResponse(unitTypePrompt, 'gpt-4o');
                const analysisData = this.parseJsonResponse(analysis);
                
                console.log('Unit type campaign analysis completed:', analysisData);
                return analysisData;
            }

            // Original logic for regular campaigns
            // Build enhanced context for analysis
            let contextInfo = `Client Information:
- Client Name: ${clientInfo.clientName || 'N/A'}
- Industry: ${clientInfo.industry || 'N/A'}
- Target Audience: ${clientInfo.targetAudience || 'N/A'}
- Geographic Targeting: ${clientInfo.geographicTargeting || 'N/A'}
- Unique Selling Points: ${clientInfo.uniqueSellingPoints || 'N/A'}
- Competitors: ${clientInfo.competitors || 'N/A'}
- Brand Voice: ${clientInfo.brandVoice || 'N/A'}`;

            if (campaignContext) {
                contextInfo += `

Campaign Context:
- Campaign Name: ${campaignContext.name}
- Campaign Objective: ${campaignContext.objective || 'Not specified'}
- Campaign Budget: ${campaignContext.budget || 'Not specified'}`;
            }

            if (adGroupContext) {
                contextInfo += `

Ad Group Context:
- Ad Group Name: ${adGroupContext.name}
- Ad Group Theme: ${adGroupContext.theme || 'Not specified'}
- Ad Group Target Audience: ${adGroupContext.targetAudience || 'Not specified'}`;
            }

            const analysisPrompt = [
                {
                    role: "system",
                    content: `You are a keyword research strategist specializing in Google Ads campaign optimization. Analyze the provided client information and campaign context to extract the most relevant topics, themes, and seed keywords for keyword research using Semrush.

Your task is to:
1. Identify core business topics aligned with campaign goals
2. Extract relevant industry terms specific to the campaign/ad group focus
3. Generate targeted seed keywords that align with campaign objectives and ad group themes
4. Consider geographic and demographic targeting
5. Focus on keywords that will work well for both keyword targeting AND ad copy creation

${campaignContext ? 'IMPORTANT: Pay special attention to the campaign context and tailor keywords to support the campaign objective.' : ''}
${adGroupContext ? 'IMPORTANT: Focus keywords specifically around the ad group theme and target audience for maximum relevance.' : ''}

Return your response as a JSON object with:
- coreTopics: array of 3-5 main business topics aligned with campaign goals
- industryTerms: array of 5-8 relevant industry keywords that fit the campaign context
- seedKeywords: array of 8-12 targeted seed keywords optimized for this specific campaign/ad group
- geoModifiers: array of location-based modifiers if applicable
- targetingInsights: brief description of target audience keywords to focus on
- campaignAlignment: how these keywords support the campaign objective (if campaign context provided)
- adGroupAlignment: how these keywords fit the ad group theme (if ad group context provided)`
                },
                {
                    role: "user", 
                    content: `Analyze this information for targeted keyword research:

${contextInfo}

Focus on extracting terms that would be valuable for finding relevant keywords in Semrush that align with the specific campaign strategy and ad group focus.`
                }
            ];

            const analysis = await this.openaiConnector.generateResponse(analysisPrompt, 'gpt-4o');
            
            // Parse the JSON response - handle both pure JSON and markdown-wrapped JSON
            const analysisData = this.parseJsonResponse(analysis);
            
            console.log('Enhanced client info analysis completed:', analysisData);
            return analysisData;
            
        } catch (error) {
            console.error('Error analyzing client info:', error);
            throw new Error('Failed to analyze client information for keyword research');
        }
    }

    /**
     * Parse JSON response from OpenAI, handling both pure JSON and markdown-wrapped JSON
     * @param {string} response - Raw response from OpenAI
     * @returns {Object} - Parsed JSON object
     */
    parseJsonResponse(response) {
        try {
            // First try to parse as pure JSON
            return JSON.parse(response);
        } catch (error) {
            try {
                // If that fails, try to extract JSON from markdown code blocks
                const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (jsonMatch && jsonMatch[1]) {
                    return JSON.parse(jsonMatch[1].trim());
                }
                
                // If no code blocks, try to find JSON object in the response
                const objectMatch = response.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                    return JSON.parse(objectMatch[0]);
                }
                
                throw new Error('No valid JSON found in response');
            } catch (parseError) {
                console.error('Failed to parse JSON response:', response);
                console.error('Parse error:', parseError);
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }
        }
    }

    /**
     * Search for keywords using Semrush Keyword Magic Tool
     * @param {string} keyword - Seed keyword to search for
     * @param {string} database - Country database (default: 'us')
     * @param {number} limit - Number of keywords to return (default: 50)
     * @returns {Promise<Array>} - Array of keyword objects
     */
    async searchKeywords(keyword, database = 'us', limit = 50) {
        try {
            const params = {
                type: 'phrase_all',
                phrase: keyword,
                database: database,
                export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
                display_limit: limit,
                key: this.apiKey
            };

            console.log(`Semrush API call for "${keyword}" with limit ${limit}`);
            console.log('API parameters:', JSON.stringify(params, null, 2));

            // Use the correct Semrush API endpoint format
            const response = await axios.get(this.baseUrl, {
                params: params,
                timeout: 30000
            });

            console.log(`Raw response length for "${keyword}":`, response.data?.length || 'undefined');
            console.log(`Raw response preview for "${keyword}":`, response.data?.substring(0, 200) + '...');

            const parsedKeywords = this.parseKeywordData(response.data);
            console.log(`Final parsed count for "${keyword}": ${parsedKeywords.length} keywords`);
            
            return parsedKeywords;
            
        } catch (error) {
            console.error('Error fetching keywords from Semrush:', error.message);
            console.error('Full error response:', error.response?.data);
            throw new Error('Failed to fetch keywords from Semrush API');
        }
    }

    /**
     * Get keyword suggestions for multiple seed keywords
     * @param {Array} seedKeywords - Array of seed keywords
     * @param {string} database - Country database
     * @param {number} limitPerKeyword - Limit per seed keyword
     * @returns {Promise<Array>} - Combined and deduplicated keyword results
     */
    async getKeywordSuggestions(seedKeywords, database = 'us', limitPerKeyword = 50) {
        const allKeywords = [];

        // Create tasks for batched execution
        const tasks = seedKeywords.map(seedKeyword => 
            () => this.searchKeywords(seedKeyword, database, limitPerKeyword)
                .then(results => {
                    console.log(`✅ Keywords found for "${seedKeyword}": ${results.length}`);
                    return results;
                })
                .catch(error => {
                    console.warn(`❌ Failed to fetch keywords for "${seedKeyword}":`, error.message);
                    return []; // Return empty array on error to continue with other keywords
                })
        );

        try {
            console.log(`Processing ${seedKeywords.length} seed keywords with batching...`);
            const results = await this.executeBatched(tasks, 3, 2000); // 3 requests per batch, 2 second delay
            
            // Combine all results
            for (const keywordSet of results) {
                if (Array.isArray(keywordSet)) {
                    allKeywords.push(...keywordSet);
                }
            }

            // Remove duplicates and sort by search volume
            const uniqueKeywords = this.deduplicateKeywords(allKeywords);
            return this.prioritizeKeywords(uniqueKeywords);
            
        } catch (error) {
            console.error('Error getting keyword suggestions:', error);
            throw new Error('Failed to get keyword suggestions');
        }
    }

    /**
     * Generate keyword recommendations based on client info analysis
     * @param {Object} clientInfo - Client information
     * @param {Object} campaignContext - Selected campaign context (optional)
     * @param {Object} adGroupContext - Selected ad group context (optional)
     * @returns {Promise<Object>} - Organized keyword recommendations
     */
    async generateKeywordRecommendations(clientInfo, campaignContext = null, adGroupContext = null) {
        try {
            console.log('\n=== SEMRUSH KEYWORD GENERATION ===');
            console.log('Client info:', clientInfo);
            console.log('Campaign context:', campaignContext);
            console.log('Ad group context:', adGroupContext);
            
            // Step 1: Analyze client info with campaign context to get search terms
            const analysis = await this.analyzeClientInfo(clientInfo, campaignContext, adGroupContext);
            console.log('Analysis completed:', analysis);
            
            // Step 2: Combine all potential search terms
            const allSearchTerms = [
                ...analysis.coreTopics,
                ...analysis.industryTerms,
                ...analysis.seedKeywords
            ];
            console.log('All search terms:', allSearchTerms);

            // Step 3: Get keyword suggestions from Semrush
            const keywordSuggestions = await this.getKeywordSuggestions(allSearchTerms);
            console.log('Keyword suggestions from Semrush:', keywordSuggestions.length, 'keywords');

            // Step 4: Organize and categorize results with enhanced context
            const result = {
                analysis: analysis,
                campaignContext: campaignContext,
                adGroupContext: adGroupContext,
                keywords: {
                    highVolume: keywordSuggestions.filter(kw => kw.searchVolume > 500),
                    mediumVolume: keywordSuggestions.filter(kw => kw.searchVolume >= 100 && kw.searchVolume <= 500),
                    lowVolume: keywordSuggestions.filter(kw => kw.searchVolume < 100 && kw.searchVolume > 0),
                    lowCompetition: keywordSuggestions.filter(kw => kw.competition < 0.3),
                    all: keywordSuggestions.slice(0, 200)
                },
                recommendations: {
                    primaryKeywords: keywordSuggestions.slice(0, 10),
                    longTail: keywordSuggestions.filter(kw => kw.keyword.split(' ').length >= 3).slice(0, 15),
                    branded: keywordSuggestions.filter(kw => 
                        clientInfo.clientName && 
                        kw.keyword.toLowerCase().includes(clientInfo.clientName.toLowerCase())
                    )
                }
            };

            // Add campaign-specific insights if context provided
            if (campaignContext || adGroupContext) {
                result.contextualInsights = {
                    campaignAlignment: analysis.campaignAlignment || 'No campaign context provided',
                    adGroupAlignment: analysis.adGroupAlignment || 'No ad group context provided',
                    recommendedFocus: this.generateContextualRecommendations(analysis, campaignContext, adGroupContext)
                };
            }

            return result;
            
        } catch (error) {
            console.error('Error generating keyword recommendations:', error);
            throw new Error('Failed to generate keyword recommendations');
        }
    }

    /**
     * Parse raw keyword data from Semrush API response
     * @param {string} rawData - Raw CSV-like response from Semrush
     * @returns {Array} - Parsed keyword objects
     */
    parseKeywordData(rawData) {
        try {
            console.log('=== PARSING RAW DATA ===');
            console.log('Raw data:', rawData);
            
            // Check for error responses
            if (rawData.includes('ERROR') || rawData.includes('NOTHING FOUND')) {
                console.log('⚠️ Semrush returned error or no results:', rawData);
                return [];
            }
            
            const lines = rawData.trim().split('\n');
            console.log('Lines count:', lines.length);
            console.log('Header:', lines[0]);
            
            const keywords = [];

            for (let i = 1; i < lines.length; i++) { // Skip header row
                const parts = lines[i].split(';');
                console.log(`Line ${i} parts (${parts.length}):`, parts);
                
                // Accept 5 or more columns (trends column might be missing)
                if (parts.length >= 5) {
                    const keyword = {
                        keyword: parts[0].replace(/"/g, ''),
                        searchVolume: parseInt(parts[1]) || 0,
                        cpc: parseFloat(parts[2]) || 0,
                        competition: parseFloat(parts[3]) || 0,
                        results: parseInt(parts[4]) || 0,
                        intent: parts[5] || 'informational' // Default if trends column missing
                    };
                    
                    console.log('✅ Parsed keyword:', keyword);
                    keywords.push(keyword);
                } else {
                    console.log('❌ Skipping line with insufficient columns:', parts);
                }
            }

            console.log('Total parsed keywords:', keywords.length);
            console.log('========================');
            return keywords;
        } catch (error) {
            console.error('Error parsing keyword data:', error);
            return [];
        }
    }

    /**
     * Remove duplicate keywords
     * @param {Array} keywords - Array of keyword objects
     * @returns {Array} - Deduplicated keywords
     */
    deduplicateKeywords(keywords) {
        const seen = new Set();
        return keywords.filter(keyword => {
            const key = keyword.keyword.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Prioritize keywords based on search volume, competition, and relevance
     * @param {Array} keywords - Array of keyword objects
     * @returns {Array} - Prioritized keywords
     */
    prioritizeKeywords(keywords) {
        return keywords.sort((a, b) => {
            // Primary sort: search volume (higher is better)
            if (b.searchVolume !== a.searchVolume) {
                return b.searchVolume - a.searchVolume;
            }
            
            // Secondary sort: competition (lower is better)
            return a.competition - b.competition;
        });
    }

    /**
     * Test API connection
     * @returns {Promise<boolean>} - True if connection successful
     */
    async testConnection() {
        try {
            // Test with a simple keyword search
            await this.searchKeywords('marketing', 'us', 1);
            return true;
        } catch (error) {
            console.error('Semrush API connection test failed:', error.message);
            return false;
        }
    }

    /**
     * Generate contextual recommendations based on campaign and ad group analysis
     * @param {Object} analysis - AI analysis results
     * @param {Object} campaignContext - Campaign context
     * @param {Object} adGroupContext - Ad group context
     * @returns {string} - Contextual recommendations
     */
    generateContextualRecommendations(analysis, campaignContext, adGroupContext) {
        let recommendations = [];

        if (campaignContext) {
            recommendations.push(`Campaign "${campaignContext.name}" focus: Prioritize keywords that align with the campaign objective.`);
        }

        if (adGroupContext) {
            recommendations.push(`Ad Group "${adGroupContext.name}" theme: Focus on keywords that match the ad group's specific targeting.`);
        }

        if (analysis.targetingInsights) {
            recommendations.push(`Targeting insight: ${analysis.targetingInsights}`);
        }

        return recommendations.join(' ');
    }

    /**
     * Generate keyword recommendations using tiered strategy based on Semrush success patterns
     * @param {Object} clientInfo - Client information
     * @param {Object} campaignContext - Selected campaign context (optional)
     * @param {Object} adGroupContext - Selected ad group context (optional)
     * @returns {Promise<Object>} - Organized keyword recommendations with success-validated approach
     */
    async generateTieredKeywordRecommendations(clientInfo, campaignContext = null, adGroupContext = null) {
        try {
            console.log('\n=== TIERED KEYWORD GENERATION ===');
            console.log('Using success-pattern validated approach');
            
            // Step 1: Generate broad seed keywords using validated patterns
            const seedKeywords = await this.generateValidatedSeedKeywords(clientInfo, campaignContext, adGroupContext);
            console.log('Validated seed keywords:', seedKeywords);
            
            // Step 2: Test seeds in Semrush and get successful ones
            const successfulSeeds = await this.validateSeedsWithSemrush(seedKeywords);
            console.log('Successful seeds:', successfulSeeds.map(s => s.keyword));
            
            // Step 3: Expand successful seeds using proven patterns
            const expandedKeywords = await this.expandSuccessfulSeeds(successfulSeeds);
            console.log('Expanded keywords:', expandedKeywords.length, 'total keywords');
            
            // Step 4: Hybrid fallback - if coverage is low, supplement with AI-generated terms
            let finalKeywords = expandedKeywords;
            if (expandedKeywords.length < 25) { // Minimum threshold for good coverage
                console.log('⚠️ Low keyword coverage detected. Activating hybrid fallback...');
                const fallbackKeywords = await this.generateFallbackKeywords(clientInfo, campaignContext, adGroupContext, expandedKeywords);
                finalKeywords = [...expandedKeywords, ...fallbackKeywords];
                console.log('Added', fallbackKeywords.length, 'fallback keywords. Total:', finalKeywords.length);
            }
            
            // Remove duplicates one more time after fallback
            finalKeywords = this.deduplicateKeywords(finalKeywords);
            
            // Step 5: Generate specific terms for ad copy (not targeting)
            const adCopyTerms = this.generateSpecificAdCopyTerms(clientInfo, campaignContext, adGroupContext);
            
            // Step 6: Organize results with actionable insights
            const result = {
                strategy: expandedKeywords.length < 25 ? 'tiered_validated_with_hybrid_fallback' : 'tiered_validated',
                seedKeywords: seedKeywords,
                successfulSeeds: successfulSeeds,
                targetingKeywords: {
                    primary: finalKeywords.filter(kw => kw.searchVolume > 500).slice(0, 15), // Increased limits
                    secondary: finalKeywords.filter(kw => kw.searchVolume >= 100 && kw.searchVolume <= 500).slice(0, 25),
                    longTail: finalKeywords.filter(kw => kw.searchVolume < 100 && kw.searchVolume > 0).slice(0, 35),
                    all: finalKeywords
                },
                adCopyTerms: adCopyTerms,
                recommendations: {
                    targetingStrategy: 'Use broad keywords for targeting, specific terms in ad copy',
                    successRate: `${successfulSeeds.length}/${seedKeywords.length} seeds had data (${Math.round(successfulSeeds.length/seedKeywords.length*100)}%)`,
                    totalKeywords: finalKeywords.length,
                    coverageStatus: finalKeywords.length >= 25 ? 'Good' : 'Limited',
                    nextSteps: [
                        'Target the primary keywords for maximum reach',
                        'Use ad copy terms in headlines and descriptions',
                        'Test secondary keywords for cost efficiency',
                        'Monitor long-tail for emerging opportunities'
                    ]
                },
                analysis: {
                    broadTermsWorking: successfulSeeds.filter(s => s.keyword.split(' ').length <= 2),
                    specificTermsFailed: seedKeywords.filter(kw => !successfulSeeds.find(s => s.keyword === kw)),
                    patternInsights: this.generatePatternInsights(seedKeywords, successfulSeeds),
                    hybridFallbackUsed: expandedKeywords.length < 25
                }
            };
            
            return result;
            
        } catch (error) {
            console.error('Error in tiered keyword generation:', error);
            throw new Error('Failed to generate tiered keyword recommendations');
        }
    }

    /**
     * Generate validated seed keywords using proven success patterns
     * @param {Object} clientInfo - Client information
     * @param {Object} campaignContext - Campaign context
     * @param {Object} adGroupContext - Ad group context
     * @returns {Promise<Array>} - Array of validated seed keywords
     */
    async generateValidatedSeedKeywords(clientInfo, campaignContext = null, adGroupContext = null) {
        try {
            // Define proven keyword patterns from keys.txt analysis
            const provenPatterns = {
                // Tier 1: Single broad terms (90% success rate)
                tier1: [
                    'luxury apartments',
                    'apartments',
                    'luxury rentals',
                    'downtown living',
                    'apartment amenities',
                    'urban apartments',
                    'luxury living',
                    'rental properties',
                    'apartment complex',
                    'modern apartments'
                ],
                // Tier 2: Location + broad term (70% success rate)
                tier2: [],
                // Tier 3: Commercial intent terms
                tier3: [
                    'luxury apartments for rent',
                    'new apartment construction',
                    'premium rentals',
                    'luxury living',
                    'apartment communities',
                    'apartment homes',
                    'rental apartments',
                    'upscale apartments',
                    'high end apartments'
                ],
                // Tier 4: Dynamic terms based on client info
                tier4: []
            };

            // Build context-aware seed keywords
            const seedKeywords = [];
            
            // Add tier 1 terms (always high success)
            seedKeywords.push(...provenPatterns.tier1);
            
            // Add location-based tier 2 terms if location provided
            if (clientInfo.geographicTargeting) {
                const location = clientInfo.geographicTargeting;
                provenPatterns.tier2 = [
                    `${location} apartments`,
                    `apartments ${location}`,
                    `luxury apartments ${location}`,
                    `${location} rentals`,
                    `downtown ${location}`,
                    `${location} luxury rentals`,
                    `${location} apartment complex`,
                    `${location} apartment homes`
                ];
                seedKeywords.push(...provenPatterns.tier2);
            }
            
            // Add tier 3 commercial terms
            seedKeywords.push(...provenPatterns.tier3);
            
            // Add dynamic tier 4 terms based on client information
            if (clientInfo.uniqueSellingPoints) {
                const usp = clientInfo.uniqueSellingPoints.toLowerCase();
                
                // Generate broader terms for targeting (not specific amenities)
                if (usp.includes('pool')) {
                    provenPatterns.tier4.push('apartments with pool', 'pool apartments');
                }
                if (usp.includes('gym') || usp.includes('fitness')) {
                    provenPatterns.tier4.push('apartments with gym', 'fitness apartments');
                }
                if (usp.includes('pet')) {
                    provenPatterns.tier4.push('pet friendly apartments', 'pet apartments');
                }
                if (usp.includes('parking') || usp.includes('garage')) {
                    provenPatterns.tier4.push('apartments with parking', 'garage apartments');
                }
            }
            
            // Add industry-specific broad terms
            if (clientInfo.industry) {
                const industry = clientInfo.industry.toLowerCase();
                if (industry.includes('real estate') || industry.includes('property')) {
                    provenPatterns.tier4.push('real estate', 'properties', 'homes for rent', 'rental homes');
                }
            }
            
            // Add target audience specific terms
            if (clientInfo.targetAudience) {
                const audience = clientInfo.targetAudience.toLowerCase();
                if (audience.includes('luxury') || audience.includes('high-end')) {
                    provenPatterns.tier4.push('luxury housing', 'upscale living', 'premium housing');
                }
                if (audience.includes('young') || audience.includes('professional')) {
                    provenPatterns.tier4.push('professional housing', 'young professional apartments');
                }
            }
            
            seedKeywords.push(...provenPatterns.tier4);
            
            // Add ad group specific terms (keep broad)
            if (adGroupContext && adGroupContext.name) {
                const adGroupName = adGroupContext.name.toLowerCase();
                
                // For unit types, add the exact term and variations
                if (adGroupName.includes('bedroom') || adGroupName.includes('bed')) {
                    seedKeywords.push(adGroupName);
                    // Add broader versions and variations
                    if (adGroupName.includes('4')) {
                        seedKeywords.push('4 bedroom', '4 bedroom apartments', '4 bed apartments');
                    }
                    if (adGroupName.includes('3')) {
                        seedKeywords.push('3 bedroom', '3 bedroom apartments', '3 bed apartments');
                    }
                    if (adGroupName.includes('2')) {
                        seedKeywords.push('2 bedroom', '2 bedroom apartments', '2 bed apartments');
                    }
                    if (adGroupName.includes('1')) {
                        seedKeywords.push('1 bedroom', '1 bedroom apartments', 'studio apartments');
                    }
                }
                
                // For location-based ad groups
                if (adGroupName === 'location' && clientInfo.geographicTargeting) {
                    // Already handled in tier 2 above
                }
            }
            
            // Remove duplicates and increase limit for better coverage
            const uniqueSeeds = [...new Set(seedKeywords)].slice(0, 25); // Increased from 12 to 25
            
            console.log('Generated validated seed keywords:', uniqueSeeds);
            return uniqueSeeds;
            
        } catch (error) {
            console.error('Error generating validated seed keywords:', error);
            throw error;
        }
    }

    /**
     * Validate seed keywords with Semrush to find which ones have data
     * @param {Array} seedKeywords - Array of seed keywords to test
     * @returns {Promise<Array>} - Array of successful keywords with data
     */
    async validateSeedsWithSemrush(seedKeywords) {
        console.log('Testing', seedKeywords.length, 'seed keywords in Semrush with batching...');
        
        // Create tasks for batched execution
        const tasks = seedKeywords.map(seed => 
            () => this.searchKeywords(seed, 'us', 20) // Increased from 5 to 20 for better validation
                .then(results => {
                    if (results.length > 0) {
                        console.log(`✅ "${seed}" - Found ${results.length} keywords`);
                        // Return the seed with its top result data
                        const topResult = results[0];
                        return {
                            keyword: seed,
                            searchVolume: topResult.searchVolume,
                            competition: topResult.competition,
                            cpc: topResult.cpc,
                            success: true,
                            relatedCount: results.length
                        };
                    } else {
                        console.log(`❌ "${seed}" - No data found`);
                        return {
                            keyword: seed,
                            success: false
                        };
                    }
                })
                .catch(error => {
                    console.log(`❌ "${seed}" - Error: ${error.message}`);
                    return {
                        keyword: seed,
                        success: false,
                        error: error.message
                    };
                })
        );
        
        try {
            const results = await this.executeBatched(tasks, 3, 2000); // 3 requests per batch, 2 second delay
            
            // Filter successful seeds
            const successful = results.filter(r => r && r.success);
            console.log(`Validation complete: ${successful.length}/${seedKeywords.length} seeds successful`);
            
            return successful;
            
        } catch (error) {
            console.error('Error validating seeds:', error);
            throw error;
        }
    }

    /**
     * Expand successful seed keywords using proven patterns
     * @param {Array} successfulSeeds - Seeds that have data in Semrush
     * @returns {Promise<Array>} - Expanded keyword list
     */
    async expandSuccessfulSeeds(successfulSeeds) {
        const allKeywords = [];
        
        console.log('Expanding', successfulSeeds.length, 'successful seeds with batching...');
        
        // Create tasks for batched execution
        const tasks = successfulSeeds.map(seed => 
            () => this.expandSingleSeed(seed.keyword)
                .then(results => {
                    console.log(`Expanded "${seed.keyword}": ${results.length} keywords`);
                    return results;
                })
                .catch(error => {
                    console.warn(`Failed to expand "${seed.keyword}":`, error.message);
                    return [];
                })
        );
        
        try {
            const results = await this.executeBatched(tasks, 2, 3000); // 2 requests per batch, 3 second delay (expansion makes more API calls)
            
            // Combine all results
            for (const keywordSet of results) {
                if (Array.isArray(keywordSet)) {
                    allKeywords.push(...keywordSet);
                }
            }
            
            // Remove duplicates and prioritize
            const uniqueKeywords = this.deduplicateKeywords(allKeywords);
            return this.prioritizeKeywords(uniqueKeywords);
            
        } catch (error) {
            console.error('Error expanding seeds:', error);
            throw error;
        }
    }

    /**
     * Expand a single seed keyword using multiple approaches
     * @param {string} seedKeyword - The seed keyword to expand
     * @returns {Promise<Array>} - Expanded keywords
     */
    async expandSingleSeed(seedKeyword) {
        const expandedKeywords = [];
        
        try {
            // Method 1: Direct keyword search (primary method)
            console.log(`Expanding "${seedKeyword}" with direct search...`);
            const directResults = await this.searchKeywords(seedKeyword, 'us', 100); // Increased limit
            expandedKeywords.push(...directResults);
            
            // Method 2: If direct search yields few results, try keyword suggestions API
            if (directResults.length < 5) {
                console.log(`Direct search returned only ${directResults.length} results, trying keyword suggestions...`);
                const suggestionResults = await this.getKeywordSuggestions([seedKeyword], 'us', 50);
                expandedKeywords.push(...suggestionResults);
            }
            
            // Method 3: If still limited results, generate pattern-based variations
            if (expandedKeywords.length < 10) {
                console.log(`Still limited results (${expandedKeywords.length}), generating pattern variations...`);
                const patternVariations = this.generatePatternVariations(seedKeyword);
                
                // Test a few pattern variations
                for (const variation of patternVariations.slice(0, 3)) {
                    try {
                        const variationResults = await this.searchKeywords(variation, 'us', 20);
                        expandedKeywords.push(...variationResults);
                    } catch (error) {
                        console.warn(`Pattern variation "${variation}" failed:`, error.message);
                    }
                }
            }
            
            console.log(`Total expanded keywords for "${seedKeyword}": ${expandedKeywords.length}`);
            return this.deduplicateKeywords(expandedKeywords);
            
        } catch (error) {
            console.error(`Error expanding seed "${seedKeyword}":`, error);
            return [];
        }
    }

    /**
     * Generate pattern-based variations of a seed keyword
     * @param {string} seedKeyword - The seed keyword
     * @returns {Array} - Array of keyword variations
     */
    generatePatternVariations(seedKeyword) {
        const variations = [];
        const words = seedKeyword.split(' ');
        
        // Pattern 1: Add commercial intent modifiers
        const commercialModifiers = ['for rent', 'for lease', 'near me', 'in my area'];
        commercialModifiers.forEach(modifier => {
            variations.push(`${seedKeyword} ${modifier}`);
        });
        
        // Pattern 2: Add descriptive adjectives (if not already present)
        if (!seedKeyword.includes('luxury') && !seedKeyword.includes('premium')) {
            variations.push(`luxury ${seedKeyword}`);
            variations.push(`premium ${seedKeyword}`);
        }
        
        if (!seedKeyword.includes('new') && !seedKeyword.includes('modern')) {
            variations.push(`new ${seedKeyword}`);
            variations.push(`modern ${seedKeyword}`);
        }
        
        // Pattern 3: Plural/singular variations
        if (seedKeyword.endsWith('s')) {
            variations.push(seedKeyword.slice(0, -1)); // Remove 's'
        } else {
            variations.push(`${seedKeyword}s`); // Add 's'
        }
        
        // Pattern 4: Word order variations (for 2+ word terms)
        if (words.length === 2) {
            variations.push(`${words[1]} ${words[0]}`);
        }
        
        // Pattern 5: Related term substitutions
        const substitutions = {
            'apartments': ['apartment', 'apartment complex', 'apartment homes'],
            'luxury': ['premium', 'upscale', 'high-end', 'deluxe'],
            'rentals': ['rental', 'rent', 'for rent'],
            'living': ['housing', 'homes', 'residence']
        };
        
        words.forEach(word => {
            if (substitutions[word]) {
                substitutions[word].forEach(sub => {
                    const newVariation = seedKeyword.replace(word, sub);
                    if (newVariation !== seedKeyword) {
                        variations.push(newVariation);
                    }
                });
            }
        });
        
        return variations;
    }

    /**
     * Generate specific terms for ad copy (not targeting)
     * @param {Object} clientInfo - Client information
     * @param {Object} campaignContext - Campaign context
     * @param {Object} adGroupContext - Ad group context
     * @returns {Object} - Specific terms for ad copy use
     */
    generateSpecificAdCopyTerms(clientInfo, campaignContext = null, adGroupContext = null) {
        const adCopyTerms = {
            amenityTerms: [],
            locationTerms: [],
            featureTerms: [],
            proximityTerms: []
        };
        
        // Extract specific amenities from USPs (for ad copy, not targeting)
        if (clientInfo.uniqueSellingPoints) {
            const usp = clientInfo.uniqueSellingPoints.toLowerCase();
            
            // Common amenity patterns
            if (usp.includes('pool') || usp.includes('rooftop')) adCopyTerms.amenityTerms.push('rooftop pool');
            if (usp.includes('gym') || usp.includes('fitness')) adCopyTerms.amenityTerms.push('fitness center');
            if (usp.includes('parking') || usp.includes('garage')) adCopyTerms.amenityTerms.push('garage parking');
            if (usp.includes('pet') || usp.includes('dog')) adCopyTerms.amenityTerms.push('pet-friendly');
            if (usp.includes('balcon')) adCopyTerms.amenityTerms.push('private balconies');
            if (usp.includes('ev') || usp.includes('charging')) adCopyTerms.amenityTerms.push('EV charging');
            if (usp.includes('concierge')) adCopyTerms.amenityTerms.push('concierge service');
        }
        
        // Generate location-specific terms for ad copy
        if (clientInfo.geographicTargeting) {
            const location = clientInfo.geographicTargeting;
            adCopyTerms.locationTerms.push(`in ${location}`);
            adCopyTerms.locationTerms.push(`${location} location`);
            adCopyTerms.proximityTerms.push(`near downtown ${location}`);
            adCopyTerms.proximityTerms.push(`minutes from ${location} attractions`);
        }
        
        // Generate feature terms
        adCopyTerms.featureTerms = [
            'luxury finishes',
            'modern amenities',
            'premium features',
            'spacious floor plans',
            'newly renovated',
            'high-end appliances'
        ];
        
        return adCopyTerms;
    }

    /**
     * Generate pattern insights based on success/failure analysis
     * @param {Array} allSeeds - All tested seed keywords
     * @param {Array} successfulSeeds - Successful seed keywords
     * @returns {Object} - Pattern insights
     */
    generatePatternInsights(allSeeds, successfulSeeds) {
        const failedSeeds = allSeeds.filter(seed => !successfulSeeds.find(s => s.keyword === seed));
        
        const insights = {
            workingPatterns: [],
            failingPatterns: [],
            recommendations: []
        };
        
        // Analyze successful patterns
        successfulSeeds.forEach(seed => {
            const wordCount = seed.keyword.split(' ').length;
            const hasLocation = seed.keyword.toLowerCase().includes('san diego') || 
                               seed.keyword.toLowerCase().includes('downtown');
            
            if (wordCount <= 2) {
                insights.workingPatterns.push(`Broad terms work: "${seed.keyword}"`);
            }
            if (hasLocation) {
                insights.workingPatterns.push(`Location + broad term works: "${seed.keyword}"`);
            }
        });
        
        // Analyze failed patterns
        failedSeeds.forEach(seed => {
            const wordCount = seed.split(' ').length;
            if (wordCount >= 4) {
                insights.failingPatterns.push(`Too specific: "${seed}"`);
            }
        });
        
        // Generate recommendations
        insights.recommendations = [
            'Focus on 1-2 word broad terms for targeting',
            'Use specific amenities in ad copy, not keyword targeting',
            'Location + broad term combinations work well',
            'Avoid 4+ word keyword combinations'
        ];
        
        return insights;
    }

    /**
     * Generate fallback keywords when validated approach yields insufficient results
     * @param {Object} clientInfo - Client information
     * @param {Object} campaignContext - Campaign context
     * @param {Object} adGroupContext - Ad group context
     * @param {Array} existingKeywords - Keywords already found
     * @returns {Promise<Array>} - Additional fallback keywords
     */
    async generateFallbackKeywords(clientInfo, campaignContext, adGroupContext, existingKeywords) {
        try {
            console.log('Generating fallback keywords using AI analysis...');
            
            // Use the original AI analysis method as fallback
            const analysis = await this.analyzeClientInfo(clientInfo, campaignContext, adGroupContext);
            
            // Extract seed terms from AI analysis
            const aiSeeds = [
                ...(analysis.coreTopics || []),
                ...(analysis.industryTerms || []),
                ...(analysis.seedKeywords || [])
            ];
            
            console.log('AI-generated fallback seeds:', aiSeeds);
            
            // Test AI seeds and expand successful ones with batching
            const existingKeywordTexts = existingKeywords.map(kw => kw.keyword.toLowerCase());
            const uniqueAiSeeds = aiSeeds.slice(0, 8).filter(seed => 
                !existingKeywordTexts.includes(seed.toLowerCase())
            );
            
            const fallbackTasks = uniqueAiSeeds.map(seed => 
                () => this.searchKeywords(seed, 'us', 15)
                    .then(results => {
                        console.log(`Fallback "${seed}": ${results.length} keywords`);
                        return results;
                    })
                    .catch(error => {
                        console.warn(`Fallback "${seed}" failed:`, error.message);
                        return [];
                    })
            );
            
            console.log(`Processing ${uniqueAiSeeds.length} fallback seeds with batching...`);
            const fallbackResults = await this.executeBatched(fallbackTasks, 3, 2000); // 3 requests per batch, 2 second delay
            const allFallbackKeywords = [];
            
            for (const keywordSet of fallbackResults) {
                if (Array.isArray(keywordSet)) {
                    allFallbackKeywords.push(...keywordSet);
                }
            }
            
            // Filter out keywords that already exist
            const newKeywords = allFallbackKeywords.filter(fallbackKw => 
                !existingKeywordTexts.includes(fallbackKw.keyword.toLowerCase())
            );
            
            console.log('Generated', newKeywords.length, 'new fallback keywords');
            return this.deduplicateKeywords(newKeywords);
            
        } catch (error) {
            console.error('Error generating fallback keywords:', error);
            return [];
        }
    }

    /**
     * Execute API calls in batches with delays to prevent rate limiting
     * @param {Array} tasks - Array of functions that return promises
     * @param {number} batchSize - Number of concurrent requests per batch
     * @param {number} delayMs - Delay between batches in milliseconds
     * @returns {Promise<Array>} - Array of results
     */
    async executeBatched(tasks, batchSize = 3, delayMs = 2000) {
        const results = [];
        
        for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize);
            console.log(`Executing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(tasks.length / batchSize)} (${batch.length} requests)`);
            
            try {
                const batchResults = await Promise.all(batch.map(task => task()));
                results.push(...batchResults);
                
                // Add delay between batches (except for the last batch)
                if (i + batchSize < tasks.length) {
                    console.log(`Waiting ${delayMs}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            } catch (error) {
                console.error(`Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
                // Continue with next batch instead of failing completely
                results.push(...Array(batch.length).fill(null));
            }
        }
        
        return results;
    }
}

module.exports = SemrushConnector; 