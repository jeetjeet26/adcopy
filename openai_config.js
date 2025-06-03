/**
 * OpenAI Configuration for Ad Copy Generation
 * This module handles the configuration and setup for OpenAI API integration
 */

class OpenAIConfig {
    constructor() {
        this.apiKey = ""; // Will be provided by user
        this.orchestrationModel = "gpt-4"; // For managing the process
        this.generationModel = "gpt-3.5-turbo"; // For generating ad copy
        this.maxTokens = 500;
        this.temperature = 0.7;
        this.baseUrl = "https://api.openai.com/v1";
    }

    /**
     * Set the API key
     * @param {string} apiKey - OpenAI API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Get the API key
     * @returns {string} - OpenAI API key
     */
    getApiKey() {
        return this.apiKey;
    }

    /**
     * Check if API key is set
     * @returns {boolean} - Whether API key is set
     */
    hasApiKey() {
        return this.apiKey && this.apiKey.trim() !== "";
    }

    /**
     * Get the orchestration model
     * @returns {string} - OpenAI model for orchestration
     */
    getOrchestrationModel() {
        return this.orchestrationModel;
    }

    /**
     * Get the generation model
     * @returns {string} - OpenAI model for generation
     */
    getGenerationModel() {
        return this.generationModel;
    }

    /**
     * Get the base URL for OpenAI API
     * @returns {string} - Base URL
     */
    getBaseUrl() {
        return this.baseUrl;
    }

    /**
     * Get the headers for OpenAI API requests
     * @returns {Object} - Headers object
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }

    /**
     * Get the default parameters for OpenAI API requests
     * @returns {Object} - Default parameters
     */
    getDefaultParams() {
        return {
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenAIConfig;
}
