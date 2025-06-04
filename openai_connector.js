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
     * @returns {Promise<Object>} - Generated ad copy
     */
    async generateAdCopy(clientInfo) {
        try {
            // First use GPT-4 for orchestration
            const orchestrationPrompt = this.createOrchestrationPrompt(clientInfo);
            const orchestrationResult = await this.callOpenAI(
                this.config.getOrchestrationModel(),
                orchestrationPrompt
            );

            // Then use GPT-3.5-Turbo for generation based on orchestration
            const generationPrompt = this.createGenerationPrompt(clientInfo, orchestrationResult);
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
     * @returns {Array} - Messages for OpenAI API
     */
    createOrchestrationPrompt(clientInfo) {
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

    /**
     * Create generation prompt
     * @param {Object} clientInfo - Client information
     * @param {string} orchestrationResult - Result from orchestration step
     * @returns {Array} - Messages for OpenAI API
     */
    createGenerationPrompt(clientInfo, orchestrationResult) {
        return [
            {
                role: "system",
                content: `You are an expert Google Ads copywriter specializing in real estate marketing. Your task is to create exactly one Google Ad that follows these strict requirements:

1. Headlines: Create exactly 11 headlines, each maximum 30 characters
2. Descriptions: Create exactly 4 descriptions, each maximum 90 characters
3. Path fields: Create exactly 2 path fields, each maximum 15 characters

The ad must be compelling, focused on benefits, and include a clear call to action. Format your response as a JSON object with these exact keys: headlines (array of 11 strings), descriptions (array of 4 strings), paths (array of 2 strings).`
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
                    headlines: this.validateAndTruncateArray(adCopy.headlines || [], 11, 30),
                    descriptions: this.validateAndTruncateArray(adCopy.descriptions || [], 4, 90),
                    paths: this.validateAndTruncateArray(adCopy.paths || [], 2, 15)
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
            headlines: this.validateAndTruncateArray(headlines, 11, 30),
            descriptions: this.validateAndTruncateArray(descriptions, 4, 90),
            paths: this.validateAndTruncateArray(paths, 2, 15)
        };
    }

    /**
     * Validate and truncate array
     * @param {Array} array - Array to validate
     * @param {number} count - Required count
     * @param {number} maxLength - Maximum length of each item
     * @returns {Array} - Validated and truncated array
     */
    validateAndTruncateArray(array, count, maxLength) {
        const result = [];
        
        // Ensure we have exactly the required number of items
        for (let i = 0; i < count; i++) {
            if (i < array.length && array[i]) {
                // Truncate to maxLength if needed
                result.push(array[i].substring(0, maxLength));
            } else {
                // Add placeholder if missing
                result.push(this.getPlaceholder(i, maxLength));
            }
        }
        
        return result;
    }

    /**
     * Get placeholder text
     * @param {number} index - Index of placeholder
     * @param {number} maxLength - Maximum length
     * @returns {string} - Placeholder text
     */
    getPlaceholder(index, maxLength) {
        const placeholders = {
            30: [
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
            90: [
                "Experience the perfect blend of luxury and convenience in our premium apartments. Schedule a tour today!",
                "Discover upscale living with state-of-the-art amenities and prime location. Contact us to learn more.",
                "Premium apartments featuring modern design, top amenities, and unbeatable location. Apply now!",
                "Elevate your lifestyle with our luxury residences. Professional management and exceptional service."
            ],
            15: [
                "apartments",
                "luxury-living"
            ]
        };
        
        return (placeholders[maxLength] && placeholders[maxLength][index]) || 
               `Placeholder ${index+1}`.substring(0, maxLength);
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
