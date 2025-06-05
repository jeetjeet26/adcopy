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

            const analysis = await this.openaiConnector.generateResponse(analysisPrompt, 'gpt-3.5-turbo');
            
            // Parse the JSON response
            const analysisData = JSON.parse(analysis);
            
            console.log('Enhanced client info analysis completed:', analysisData);
            return analysisData;
            
        } catch (error) {
            console.error('Error analyzing client info:', error);
            throw new Error('Failed to analyze client information for keyword research');
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
                type: 'phrase_this',
                phrase: keyword,
                database: database,
                export_columns: 'Ph,Nq,Cp,Co,Nr,Td',
                display_limit: limit,
                key: this.apiKey
            };

            // Use the correct Semrush API endpoint format
            const response = await axios.get(this.baseUrl, {
                params: params,
                timeout: 30000
            });

            return this.parseKeywordData(response.data);
            
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
    async getKeywordSuggestions(seedKeywords, database = 'us', limitPerKeyword = 20) {
        const allKeywords = [];
        const promises = [];

        // Search for keywords for each seed term
        for (const seedKeyword of seedKeywords) {
            promises.push(
                this.searchKeywords(seedKeyword, database, limitPerKeyword)
                    .catch(error => {
                        console.warn(`Failed to fetch keywords for "${seedKeyword}":`, error.message);
                        return []; // Return empty array on error to continue with other keywords
                    })
            );
        }

        try {
            const results = await Promise.all(promises);
            
            // Combine all results
            for (const keywordSet of results) {
                allKeywords.push(...keywordSet);
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
            // Step 1: Analyze client info with campaign context to get search terms
            const analysis = await this.analyzeClientInfo(clientInfo, campaignContext, adGroupContext);
            
            // Step 2: Combine all potential search terms
            const allSearchTerms = [
                ...analysis.coreTopics,
                ...analysis.industryTerms,
                ...analysis.seedKeywords
            ];

            // Step 3: Get keyword suggestions from Semrush
            const keywordSuggestions = await this.getKeywordSuggestions(allSearchTerms);

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
                    all: keywordSuggestions.slice(0, 100)
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
            const lines = rawData.trim().split('\n');
            const keywords = [];

            for (let i = 1; i < lines.length; i++) { // Skip header row
                const parts = lines[i].split(';');
                if (parts.length >= 6) {
                    keywords.push({
                        keyword: parts[0].replace(/"/g, ''),
                        searchVolume: parseInt(parts[1]) || 0,
                        cpc: parseFloat(parts[2]) || 0,
                        competition: parseFloat(parts[3]) || 0,
                        results: parseInt(parts[4]) || 0,
                        intent: parts[5] || 'unknown'
                    });
                }
            }

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
}

module.exports = SemrushConnector; 