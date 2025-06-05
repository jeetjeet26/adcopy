/**
 * OpenAI API Connector for Ad Copy Generation
 * This module handles the communication with OpenAI API for generating ad copy
 */

class OpenAIConnector {
    constructor(config) {
        this.config = config;
    }

    /**
     * Generate ad copy using OpenAI API
     * @param {Object} clientInfo - Client information
     * @param {Object} campaignContext - Campaign context (optional)
     * @param {Object} adGroupContext - Ad group context (optional)
     * @param {Object} keywordData - Keyword research data (optional)
     * @returns {Promise<Object>} - Generated ad copy
     */
    async generateAdCopy(clientInfo, campaignContext = null, adGroupContext = null, keywordData = null) {
        try {
            // First use GPT-4 for orchestration with keyword context
            const orchestrationPrompt = this.createOrchestrationPrompt(clientInfo, campaignContext, adGroupContext, keywordData);
            const orchestrationResult = await this.callOpenAI(
                this.config.getOrchestrationModel(),
                orchestrationPrompt
            );

            // Then use GPT-3.5-Turbo for generation based on orchestration
            const generationPrompt = this.createGenerationPrompt(clientInfo, orchestrationResult, campaignContext, adGroupContext, keywordData);
            const generationResult = await this.callOpenAI(
                this.config.getGenerationModel(),
                generationPrompt
            );

            // Parse and format the generated ad copy
            return this.parseGeneratedAdCopy(generationResult);
        } catch (error) {
            console.error('Error generating ad copy:', error);
            return this.getFallbackAdCopy(clientInfo);
        }
    }

    /**
     * Create prompt for orchestration
     * @param {Object} clientInfo - Client information
     * @param {Object} campaignContext - Campaign context (optional)
     * @param {Object} adGroupContext - Ad group context (optional)
     * @param {Object} keywordData - Keyword research data (optional)
     * @returns {Array} - Messages for OpenAI API
     */
    createOrchestrationPrompt(clientInfo, campaignContext, adGroupContext, keywordData) {
        // Build context information
        let contextInfo = `Client Name: ${clientInfo.name || 'N/A'}
Website: ${clientInfo.website || 'N/A'}
Industry: ${clientInfo.industry || 'N/A'}
Target Audience: ${clientInfo.targetAudience || 'N/A'}
Location: ${clientInfo.geographicTargeting || 'N/A'}
Unique Selling Points: ${clientInfo.uniqueSellingPoints || 'N/A'}
Competitors: ${clientInfo.competitors || 'N/A'}
Brand Voice: ${clientInfo.brandVoice || 'N/A'}
Call to Action: ${clientInfo.callToAction || 'N/A'}`;

        // Add campaign context if available
        if (campaignContext) {
            contextInfo += `

Campaign Context:
- Campaign Name: ${campaignContext.name}
- Campaign Objective: ${campaignContext.objective || 'Not specified'}
- Campaign Budget: ${campaignContext.budget || 'Not specified'}`;
        }

        // Add ad group context if available
        if (adGroupContext) {
            contextInfo += `

Ad Group Context:
- Ad Group Name: ${adGroupContext.name}
- Ad Group Theme: ${adGroupContext.theme || 'Not specified'}
- Ad Group Target Audience: ${adGroupContext.targetAudience || 'Not specified'}`;
        }

        // Add keyword data if available
        let keywordInfo = '';
        if (keywordData && keywordData.keywords) {
            keywordInfo = `

KEYWORD RESEARCH DATA (PRIMARY DRIVERS):
These keywords should be the foundation of your ad copy strategy:

High Volume Keywords (prioritize these):
${keywordData.keywords.highVolume ? keywordData.keywords.highVolume.slice(0, 10).map(k => `- ${k.keyword} (${k.searchVolume} searches/month, Competition: ${k.competition})`).join('\n') : 'None available'}

Medium Volume Keywords:
${keywordData.keywords.mediumVolume ? keywordData.keywords.mediumVolume.slice(0, 8).map(k => `- ${k.keyword} (${k.searchVolume} searches/month, Competition: ${k.competition})`).join('\n') : 'None available'}

Low Competition Keywords (good for cost efficiency):
${keywordData.keywords.lowCompetition ? keywordData.keywords.lowCompetition.slice(0, 8).map(k => `- ${k.keyword} (${k.searchVolume} searches/month, Competition: ${k.competition})`).join('\n') : 'None available'}

Keyword Analysis Insights:
${keywordData.analysis ? `
- Core Topics: ${keywordData.analysis.coreTopics ? keywordData.analysis.coreTopics.join(', ') : 'N/A'}
- Industry Terms: ${keywordData.analysis.industryTerms ? keywordData.analysis.industryTerms.join(', ') : 'N/A'}
- Target Insights: ${keywordData.analysis.targetingInsights || 'N/A'}
` : 'No analysis available'}`;
        }

        return [
            {
                role: "system",
                content: `You are an expert Google Ads strategist specializing in keyword-driven ad copy creation. Your task is to analyze client information, campaign context, and keyword research data to create a strategic plan for generating highly effective Google Ads copy.

${keywordData ? 'CRITICAL: The keyword research data provided should be the PRIMARY DRIVER of your strategy. These keywords represent what your target audience is actually searching for and should heavily influence your messaging approach.' : 'Note: No keyword data available, focus on client information and campaign context.'}

Focus on:
1. Using high-volume and relevant keywords as the foundation for messaging
2. Identifying keyword themes that resonate with target audience intent
3. Creating messaging angles that incorporate top-performing keywords naturally
4. Balancing keyword optimization with compelling benefit-driven copy
5. Ensuring campaign and ad group alignment with keyword strategy`
            },
            {
                role: "user",
                content: `Create a strategic approach for Google Ads copy based on this information:

${contextInfo}${keywordInfo}

${keywordData ? 'IMPORTANT: Base your strategy primarily on the keyword research data above. These keywords represent actual search behavior and should drive your messaging recommendations.' : ''}

Provide a strategic approach that identifies 3-5 key themes or angles to highlight, considering the keyword data as the primary driver alongside target audience and unique selling points. Do not write the actual ad copy yet.`
            }
        ];
    }

    /**
     * Create generation prompt
     * @param {Object} clientInfo - Client information
     * @param {string} orchestrationResult - Result from orchestration step
     * @param {Object} campaignContext - Campaign context (optional)
     * @param {Object} adGroupContext - Ad group context (optional)
     * @param {Object} keywordData - Keyword research data (optional)
     * @returns {Array} - Messages for OpenAI API
     */
    createGenerationPrompt(clientInfo, orchestrationResult, campaignContext, adGroupContext, keywordData) {
        // Build context information
        let contextInfo = `Client Name: ${clientInfo.name || 'N/A'}
Website: ${clientInfo.website || 'N/A'}
Industry: ${clientInfo.industry || 'N/A'}
Target Audience: ${clientInfo.targetAudience || 'N/A'}
Location: ${clientInfo.geographicTargeting || 'N/A'}
Unique Selling Points: ${clientInfo.uniqueSellingPoints || 'N/A'}
Brand Voice: ${clientInfo.brandVoice || 'N/A'}
Call to Action: ${clientInfo.callToAction || 'N/A'}`;

        // Add campaign context if available
        if (campaignContext) {
            contextInfo += `

Campaign Context:
- Campaign Name: ${campaignContext.name}
- Campaign Objective: ${campaignContext.objective || 'Not specified'}`;
        }

        // Add ad group context if available
        if (adGroupContext) {
            contextInfo += `

Ad Group Context:
- Ad Group Name: ${adGroupContext.name}
- Ad Group Theme: ${adGroupContext.theme || 'Not specified'}`;
        }

        // Build keyword instructions
        let keywordInstructions = '';
        if (keywordData && keywordData.keywords) {
            const topKeywords = [
                ...(keywordData.keywords.highVolume || []).slice(0, 8),
                ...(keywordData.keywords.mediumVolume || []).slice(0, 5),
                ...(keywordData.keywords.lowCompetition || []).slice(0, 5)
            ];

            keywordInstructions = `

KEYWORDS TO INCORPORATE (PRIMARY DRIVERS):
Use these keywords as the foundation for your headlines and descriptions:

Top Priority Keywords:
${topKeywords.slice(0, 15).map(k => `- "${k.keyword}" (${k.searchVolume} searches, Competition: ${k.competition})`).join('\n')}

KEYWORD INTEGRATION REQUIREMENTS:
1. Include top keywords naturally in headlines and descriptions
2. Use exact keyword phrases where they fit within character limits
3. Prioritize high-volume keywords for headlines
4. Use medium-volume keywords for descriptions
5. Ensure keywords align with the client's brand voice and messaging`;
        }

        return [
            {
                role: "system",
                content: `You are an expert Google Ads copywriter specializing in keyword-driven ad copy creation. Your task is to create exactly one Google Ad that follows these strict requirements:

CRITICAL CHARACTER COUNT REQUIREMENTS:
1. Headlines: Create exactly 11 headlines, each between 27-30 characters (aim for 90%-100% of the 30-character limit)
2. Descriptions: Create exactly 4 descriptions, each between 81-90 characters (aim for 90%-100% of the 90-character limit)
3. Path fields: Create exactly 2 path fields, each between 14-15 characters (aim for 90%-100% of the 15-character limit)

CHARACTER COUNT IS CRITICAL - spaces count as characters. Always aim to use 90%-100% of available characters to maximize impact.

${keywordData ? 'CRITICAL KEYWORD REQUIREMENTS:' : 'CONTENT REQUIREMENTS:'}
${keywordData ? '- Incorporate the provided keywords as PRIMARY DRIVERS of your copy' : '- Focus on client information and benefits'}
${keywordData ? '- Use high-volume keywords in headlines when possible' : '- Create compelling, benefit-focused copy'}
${keywordData ? '- Include medium-volume keywords in descriptions naturally' : '- Include clear call to action'}
${keywordData ? '- Ensure keywords flow naturally with brand voice and messaging' : '- Maintain professional tone'}
- The ad must be compelling, focused on benefits, and include a clear call to action
- Format your response as a JSON object with these exact keys: headlines (array of 11 strings), descriptions (array of 4 strings), paths (array of 2 strings)`
            },
            {
                role: "user",
                content: `Create one Google Ad based on this information:

${contextInfo}${keywordInstructions}

Strategic approach from our marketing team:
${orchestrationResult}

${keywordData ? 'IMPORTANT: Use the keywords listed above as the primary foundation for your ad copy. These represent actual search terms your audience uses.' : ''}

MANDATORY CHARACTER COUNT REQUIREMENTS (spaces count as characters):
- Each headline must be 27-30 characters (aim for 90%-100% of 30-character limit)
- Each description must be 81-90 characters (aim for 90%-100% of 90-character limit)
- Each path field must be 14-15 characters (aim for 90%-100% of 15-character limit)
- Format as JSON with keys: headlines, descriptions, paths
- Include the call to action
${keywordData ? '- Incorporate keywords naturally and strategically' : '- Focus on benefits and client value proposition'}

REMEMBER: Longer copy within the allowed limits performs better - aim to use as much of the available character space as possible while maintaining quality and readability.`
            }
        ];
    }

    /**
     * Call OpenAI API
     * @param {string} model - OpenAI model to use
     * @param {Array} messages - Messages for OpenAI API
     * @returns {Promise<string>} - OpenAI response
     */
    async callOpenAI(model, messages) {
        if (!this.config.hasApiKey()) {
            // For development/testing without API key
            return this.getMockResponse(model, messages);
        }

        try {
            const response = await fetch(`${this.config.getBaseUrl()}/chat/completions`, {
                method: 'POST',
                headers: this.config.getHeaders(),
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    ...this.config.getDefaultParams()
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            return this.getMockResponse(model, messages);
        }
    }

    /**
     * Parse generated ad copy from OpenAI response
     * @param {string} generationResult - OpenAI generation result
     * @returns {Object} - Parsed ad copy
     */
    parseGeneratedAdCopy(generationResult) {
        try {
            // Try to parse as JSON
            const jsonMatch = generationResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                const adCopy = JSON.parse(jsonStr);
                
                // Validate and ensure all required fields are present
                return {
                    headlines: this.validateAndOptimizeArray(adCopy.headlines || [], 11, 30),
                    descriptions: this.validateAndOptimizeArray(adCopy.descriptions || [], 4, 90),
                    paths: this.validateAndOptimizeArray(adCopy.paths || [], 2, 15)
                };
            }
            
            // If JSON parsing fails, try to extract content manually
            return this.extractAdCopyManually(generationResult);
        } catch (error) {
            console.error('Error parsing generated ad copy:', error);
            return this.getEmptyAdCopy();
        }
    }

    /**
     * Extract ad copy manually from text
     * @param {string} text - Text to extract from
     * @returns {Object} - Extracted ad copy
     */
    extractAdCopyManually(text) {
        const headlines = [];
        const descriptions = [];
        const paths = [];

        // Extract headlines
        const headlineMatches = text.match(/headline\s*\d*\s*:?\s*["']?([^"'\n]{1,30})["']?/gi);
        if (headlineMatches) {
            headlineMatches.forEach(match => {
                const headline = match.replace(/headline\s*\d*\s*:?\s*["']?/i, '').replace(/["']$/, '').trim();
                if (headline && headline.length <= 30) {
                    headlines.push(headline);
                }
            });
        }

        // Extract descriptions
        const descriptionMatches = text.match(/description\s*\d*\s*:?\s*["']?([^"'\n]{1,90})["']?/gi);
        if (descriptionMatches) {
            descriptionMatches.forEach(match => {
                const description = match.replace(/description\s*\d*\s*:?\s*["']?/i, '').replace(/["']$/, '').trim();
                if (description && description.length <= 90) {
                    descriptions.push(description);
                }
            });
        }

        // Extract paths
        const pathMatches = text.match(/path\s*\d*\s*:?\s*["']?([^"'\n]{1,15})["']?/gi);
        if (pathMatches) {
            pathMatches.forEach(match => {
                const path = match.replace(/path\s*\d*\s*:?\s*["']?/i, '').replace(/["']$/, '').trim();
                if (path && path.length <= 15) {
                    paths.push(path);
                }
            });
        }

        return {
            headlines: this.validateAndOptimizeArray(headlines, 11, 30),
            descriptions: this.validateAndOptimizeArray(descriptions, 4, 90),
            paths: this.validateAndOptimizeArray(paths, 2, 15)
        };
    }

    /**
     * Validate and optimize array to ensure character counts are within 90%-100% of limit
     * @param {Array} array - Array of strings to validate
     * @param {number} count - Required number of items
     * @param {number} maxLength - Maximum character length
     * @returns {Array} - Validated and optimized array
     */
    validateAndOptimizeArray(array, count, maxLength) {
        const result = [];
        const minLength = Math.ceil(maxLength * 0.9); // 90% of max length
        
        // Ensure we have exactly the required number of items
        for (let i = 0; i < count; i++) {
            if (i < array.length && array[i]) {
                let item = array[i].trim();
                
                // Check if item is within optimal range (90%-100%)
                if (item.length >= minLength && item.length <= maxLength) {
                    result.push(item);
                } else if (item.length > maxLength) {
                    // Item is too long - intelligently truncate
                    result.push(this.intelligentTruncate(item, maxLength, minLength));
                } else if (item.length < minLength) {
                    // Item is too short - try to extend it
                    result.push(this.intelligentExtend(item, maxLength, minLength, i));
                } else {
                    result.push(item);
                }
            } else {
                // Add optimized placeholder if missing
                result.push(this.getOptimizedPlaceholder(i, maxLength, minLength));
            }
        }
        
        return result;
    }

    /**
     * Intelligently truncate text while preserving meaning and staying within 90%-100% range
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @param {number} minLength - Minimum length (90% of max)
     * @returns {string} - Truncated text
     */
    intelligentTruncate(text, maxLength, minLength) {
        if (text.length <= maxLength) return text;
        
        // Try to find a good word boundary within the target range
        let bestCut = maxLength;
        
        // Look for word boundaries from maxLength down to minLength
        for (let i = maxLength; i >= minLength; i--) {
            if (i < text.length && (text[i] === ' ' || text[i] === '.' || text[i] === ',')) {
                bestCut = i;
                break;
            }
        }
        
        // If we found a good boundary, use it
        if (bestCut < text.length) {
            const result = text.substring(0, bestCut).trim();
            if (result.length >= minLength) {
                return result;
            }
        }
        
        // Otherwise, cut at maxLength and remove any partial word
        let truncated = text.substring(0, maxLength);
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        
        if (lastSpaceIndex > minLength) {
            return truncated.substring(0, lastSpaceIndex).trim();
        }
        
        return truncated.trim();
    }

    /**
     * Intelligently extend text to reach optimal length range
     * @param {string} text - Text to extend
     * @param {number} maxLength - Maximum length
     * @param {number} minLength - Minimum length (90% of max)
     * @param {number} index - Index for context
     * @returns {string} - Extended text
     */
    intelligentExtend(text, maxLength, minLength, index) {
        if (text.length >= minLength) return text;
        
        let result = text.trim();
        const charsNeeded = minLength - result.length;
        
        // Get appropriate extensions based on the type of content
        const extensions = this.getTargetedExtensions(result, maxLength, charsNeeded);
        
        // Try each extension to see if it gets us into the target range
        for (const extension of extensions) {
            const candidate = `${result} ${extension}`.trim();
            if (candidate.length >= minLength && candidate.length <= maxLength) {
                return candidate;
            }
            // If this extension would make it too long, skip it
            if (candidate.length > maxLength) {
                continue;
            }
        }
        
        // If single extensions don't work, try combining short ones
        if (result.length < minLength) {
            for (let i = 0; i < extensions.length - 1; i++) {
                for (let j = i + 1; j < extensions.length; j++) {
                    const combined = `${extensions[i]} ${extensions[j]}`;
                    const candidate = `${result} ${combined}`.trim();
                    if (candidate.length >= minLength && candidate.length <= maxLength) {
                        return candidate;
                    }
                    if (candidate.length > maxLength) {
                        break;
                    }
                }
            }
        }
        
        // Last resort: add generic padding words one by one
        const paddingWords = this.getPaddingWords(maxLength);
        for (const word of paddingWords) {
            const candidate = `${result} ${word}`.trim();
            if (candidate.length <= maxLength) {
                result = candidate;
                if (result.length >= minLength) {
                    return result;
                }
            } else {
                break;
            }
        }
        
        // If we still can't reach minLength, return what we have
        return result;
    }

    /**
     * Get targeted extensions based on content and requirements
     * @param {string} text Original text
     * @param {number} maxLength Maximum character length
     * @param {number} charsNeeded Characters needed to reach minimum
     * @returns {Array} Array of appropriate extension phrases
     */
    getTargetedExtensions(text, maxLength, charsNeeded) {
        const lowerText = text.toLowerCase();
        const extensions = [];
        
        if (maxLength === 30) { // Headlines
            // Short, impactful extensions for headlines
            if (charsNeeded <= 5) {
                extensions.push('Now', 'Pro', 'Plus', 'Here', 'Open');
            } else if (charsNeeded <= 10) {
                extensions.push('Today', 'Expert', 'Quality', 'Premium', 'Trusted');
            } else {
                extensions.push('Available Now', 'Book Today', 'Call Now', 'Visit Us', 'Get Started');
            }
            
            // Context-specific extensions
            if (lowerText.includes('service')) {
                extensions.unshift('Pro', 'Expert', 'Quality');
            }
            if (lowerText.includes('apartment') || lowerText.includes('home')) {
                extensions.unshift('Available', 'Ready', 'Open');
            }
            if (lowerText.includes('luxury') || lowerText.includes('premium')) {
                extensions.unshift('Awaits', 'Here', 'Today');
            }
            
        } else if (maxLength === 90) { // Descriptions
            // Meaningful extensions for descriptions
            if (charsNeeded <= 15) {
                extensions.push('Contact us today!', 'Learn more now.', 'Book your visit!', 'Call us now.');
            } else if (charsNeeded <= 25) {
                extensions.push('Get in touch today!', 'Schedule your visit now.', 'Contact our team today.');
            } else {
                extensions.push('Contact us today for more information!', 'Schedule your visit and see the difference.', 'Call us now to learn about our services.');
            }
            
            // Context-specific extensions
            if (lowerText.includes('quality') || lowerText.includes('premium')) {
                extensions.unshift('Experience the difference today!', 'See why we are the best choice.');
            }
            if (lowerText.includes('luxury')) {
                extensions.unshift('Premium amenities included.', 'Luxury living redefined.');
            }
            if (lowerText.includes('beach') || lowerText.includes('ocean')) {
                extensions.unshift('Steps from the shore.', 'Beachfront lifestyle.');
            }
            
        } else if (maxLength === 15) { // Paths
            // Short, relevant extensions for paths
            if (charsNeeded <= 3) {
                extensions.push('pro', 'top', 'new');
            } else if (charsNeeded <= 6) {
                extensions.push('today', 'offers', 'deals');
            } else {
                extensions.push('services', 'solutions', 'contact');
            }
            
            // Context-specific extensions
            if (lowerText.includes('luxury')) {
                extensions.unshift('luxury');
            }
            if (lowerText.includes('beach')) {
                extensions.unshift('beach');
            }
        }
        
        return extensions;
    }

    /**
     * Get padding words for last resort extension
     * @param {number} maxLength Maximum character length
     * @returns {Array} Array of short padding words
     */
    getPaddingWords(maxLength) {
        if (maxLength === 30) { // Headlines
            return ['&', 'Pro', 'Plus', 'New', 'Top', 'Best'];
        } else if (maxLength === 90) { // Descriptions
            return ['and more', 'with quality', 'plus service', 'and value'];
        } else if (maxLength === 15) { // Paths
            return ['pro', 'plus', 'new'];
        }
        return ['plus', 'pro'];
    }

    /**
     * Get optimized placeholder text within 90%-100% range
     * @param {number} index - Index of placeholder
     * @param {number} maxLength - Maximum length
     * @param {number} minLength - Minimum length (90% of max)
     * @returns {string} - Optimized placeholder text
     */
    getOptimizedPlaceholder(index, maxLength, minLength) {
        const placeholders = {
            30: [
                "Premium Living Space Today", // 27 chars (90%)
                "Luxury Apartments Available", // 28 chars (93%)
                "Modern Urban Homes Here Now", // 28 chars (93%)
                "Executive Residences Open", // 26 chars (87%) -> will be extended
                "Downtown Living Available", // 26 chars (87%) -> will be extended  
                "Upscale Amenities Await You", // 28 chars (93%)
                "Prime Location Units Ready", // 27 chars (90%)
                "Quality Craftsmanship Here", // 27 chars (90%)
                "Move-In Ready Homes Today", // 26 chars (87%) -> will be extended
                "Professional Housing Plus", // 25 chars (83%) -> will be extended
                "Elite Communities Available" // 28 chars (93%)
            ],
            90: [
                "Experience the perfect blend of luxury and convenience in our apartments. Schedule today!", // 88 chars (98%)
                "Discover upscale living with state-of-the-art amenities and prime location. Call now!", // 87 chars (97%)
                "Premium apartments featuring modern design, top amenities, and unbeatable location!", // 85 chars (94%)
                "Elevate your lifestyle with our luxury residences. Professional management services!" // 87 chars (97%)
            ],
            15: [
                "luxury-today", // 12 chars (80%) -> will be extended
                "apartments-now" // 14 chars (93%)
            ]
        };
        
        let placeholder = (placeholders[maxLength] && placeholders[maxLength][index]) || 
                         `Placeholder ${index+1}`;
        
        // Ensure placeholder is in optimal range
        if (placeholder.length < minLength) {
            return this.intelligentExtend(placeholder, maxLength, minLength, index);
        } else if (placeholder.length > maxLength) {
            return this.intelligentTruncate(placeholder, maxLength, minLength);
        }
        
        return placeholder;
    }

    /**
     * Get empty ad copy
     * @returns {Object} - Empty ad copy
     */
    getEmptyAdCopy() {
        return {
            headlines: [
                "Premium Living Space",
                "Luxury Apartments Now", 
                "Modern Urban Homes",
                "Executive Residences",
                "Downtown Living",
                "Upscale Amenities",
                "Prime Location Units",
                "Quality Craftsmanship", 
                "Move-In Ready Now",
                "Professional Housing",
                "Elite Communities"
            ],
            descriptions: [
                "Experience the perfect blend of luxury and convenience in our premium apartments. Schedule a tour today!",
                "Discover upscale living with state-of-the-art amenities and prime location. Contact us to learn more.",
                "Premium apartments featuring modern design, top amenities, and unbeatable location. Apply now!",
                "Elevate your lifestyle with our luxury residences. Professional management and exceptional service."
            ],
            paths: [
                "apartments",
                "luxury-living"
            ]
        };
    }

    /**
     * Get fallback ad copy
     * @param {Object} clientInfo - Client information
     * @returns {Object} - Fallback ad copy
     */
    getFallbackAdCopy(clientInfo) {
        const name = clientInfo.name || "Luxury Apartments";
        const location = clientInfo.geographicTargeting || "Prime Location";
        const cta = (clientInfo.callToAction || "Schedule a tour today").split(',')[0];
        
        return {
            headlines: [
                name.substring(0, 30),
                `${location.substring(0, 22)} Living`,
                `Premium Apartments`,
                "Executive Housing",
                "Modern Residences", 
                "Upscale Living",
                "Quality Homes",
                "Elite Properties",
                "Professional Units",
                "Luxury Available",
                "Prime Real Estate"
            ],
            descriptions: [
                `Experience luxury living with premium amenities and convenient location. ${cta.substring(0, 20)}`,
                `Modern design, exceptional service, and upscale features for discerning residents. Contact us now.`,
                `Discover refined living spaces with world-class amenities and professional management services.`,
                `Unparalleled luxury meets urban convenience. Premium apartments designed for modern professionals.`
            ],
            paths: [
                "apartments",
                "luxury-living"
            ]
        };
    }

    /**
     * Get mock response for testing without API key
     * @param {string} model - OpenAI model
     * @param {Array} messages - Messages array
     * @returns {string} - Mock response
     */
    getMockResponse(model, messages) {
        if (model === this.config.getOrchestrationModel()) {
            return `Based on the client information provided, here are the key strategic themes for effective Google Ads:

1. **Luxury Living Experience**: Emphasize premium amenities, high-end finishes, and sophisticated lifestyle
2. **Professional Convenience**: Highlight location benefits for working professionals, commute advantages
3. **Exclusive Community**: Focus on the selective nature and quality of residents
4. **Modern Technology**: Showcase smart home features, modern appliances, tech-enabled living
5. **Personalized Service**: Emphasize concierge services, responsive management, white-glove experience

These themes should resonate with young professionals and high-income individuals seeking luxury living options.`;
        } else {
            return JSON.stringify({
                headlines: [
                    "Luxury Apartments Available",
                    "Premium Living Spaces",
                    "High-End Rentals",
                    "Exclusive Apartments",
                    "Modern Luxury Living",
                    "Professional Housing",
                    "Upscale Rentals",
                    "Elite Apartments",
                    "Luxury Rentals",
                    "Premium Locations",
                    "Schedule Tour Today"
                ],
                descriptions: [
                    "Discover luxury living in our premium apartment community. Professional amenities.",
                    "High-end apartments with modern finishes. Perfect for discerning professionals.",
                    "Exclusive rental community with concierge services. Schedule your tour today.",
                    "Luxury apartments in prime location. Experience sophisticated urban living."
                ],
                paths: [
                    "luxury-rentals",
                    "schedule-tour"
                ]
            });
        }
    }

    /**
     * Test API connection
     * @returns {Promise<boolean>} - True if connection successful
     */
    async testConnection() {
        try {
            if (!this.config.hasApiKey()) {
                // Return true for mock mode
                return true;
            }

            // Test with a simple API call
            const response = await fetch(`${this.config.getBaseUrl()}/chat/completions`, {
                method: 'POST',
                headers: this.config.getHeaders(),
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: 'Hello'
                        }
                    ],
                    max_tokens: 5
                })
            });

            return response.ok;
        } catch (error) {
            console.error('OpenAI API connection test failed:', error.message);
            return false;
        }
    }

    /**
     * Generate a response using OpenAI API with custom messages and model
     * @param {Array} messages - Array of message objects for the conversation
     * @param {string} model - The OpenAI model to use (default: gpt-3.5-turbo)
     * @returns {Promise<string>} - The generated response content
     */
    async generateResponse(messages, model = 'gpt-3.5-turbo') {
        try {
            return await this.callOpenAI(model, messages);
        } catch (error) {
            console.error('Error generating OpenAI response:', error);
            throw new Error('Failed to generate response from OpenAI');
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenAIConnector;
}
