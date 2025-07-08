/**
 * Enhanced Error Handling for Google Ads Campaign Builder
 * 
 * This module provides robust error handling for the OpenAI API integration
 * and other potential failure points in the application.
 */

// Error classes for server-side use
class AppError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
    }
}

class ErrorHandler {
    constructor() {
        // Only initialize DOM elements if we're in a browser environment
        if (typeof document !== 'undefined') {
            this.errorContainer = document.createElement('div');
            this.errorContainer.className = 'error-message';
            this.errorContainer.style.display = 'none';
            this.errorContainer.style.color = 'white';
            this.errorContainer.style.backgroundColor = '#d9534f';
            this.errorContainer.style.padding = '10px';
            this.errorContainer.style.borderRadius = '5px';
            this.errorContainer.style.marginBottom = '15px';
            this.errorContainer.style.fontWeight = 'bold';
            
            // Add to document body for global access
            document.body.appendChild(this.errorContainer);
        }
    }

    /**
     * Show an error message to the user (browser only)
     * @param {string} message - The error message to display
     * @param {string} location - Where to show the error (default: before the first h1)
     * @param {number} duration - How long to show the error in ms (0 = until dismissed)
     */
    showError(message, location = 'default', duration = 5000) {
        if (typeof document === 'undefined') {
            console.error('showError called in non-browser environment:', message);
            return;
        }

        this.errorContainer.textContent = message;
        this.errorContainer.style.display = 'block';
        
        // Position the error message
        if (location === 'default') {
            // Insert before the first heading
            const firstHeading = document.querySelector('h1, h2, h3');
            if (firstHeading && firstHeading.parentNode && firstHeading.parentNode.contains(firstHeading)) {
                firstHeading.parentNode.insertBefore(this.errorContainer, firstHeading);
            } else if (firstHeading) {
                // Fallback: insert at the top of the body
                document.body.insertBefore(this.errorContainer, document.body.firstChild);
            }
        } else if (location === 'adCopy') {
            // Insert in the ad copy section
            const adCopySection = document.querySelector('#ad-copy-tab');
            if (adCopySection) {
                adCopySection.prepend(this.errorContainer);
            }
        }
        
        // Auto-hide after duration (if not 0)
        if (duration > 0) {
            setTimeout(() => {
                this.hideError();
            }, duration);
        }
        
        // Log error to console for debugging
        console.error(`Error: ${message}`);
    }
    
    /**
     * Hide the current error message (browser only)
     */
    hideError() {
        if (typeof document !== 'undefined' && this.errorContainer) {
            this.errorContainer.style.display = 'none';
        }
    }
    
    /**
     * Validate OpenAI API key format
     * @param {string} apiKey - The API key to validate
     * @returns {boolean} - Whether the key format is valid
     */
    validateApiKeyFormat(apiKey) {
        // Basic validation for OpenAI API key format
        return apiKey && apiKey.startsWith('sk-') && apiKey.length > 20;
    }
    
    /**
     * Handle OpenAI API errors
     * @param {Error} error - The error object from the API call
     * @returns {string} - User-friendly error message
     */
    handleOpenAIError(error) {
        let userMessage = 'Error generating ad copy. ';
        
        if (!error) {
            return userMessage + 'Unknown error occurred.';
        }
        
        // Check for common API errors
        if (error.message && error.message.includes('401')) {
            return userMessage + 'Invalid API key. Please check your OpenAI API key.';
        }
        
        if (error.message && error.message.includes('429')) {
            return userMessage + 'Rate limit exceeded. Please try again later.';
        }
        
        if (error.message && error.message.includes('500')) {
            return userMessage + 'OpenAI service error. Please try again later.';
        }
        
        // Generic error with the original message
        return userMessage + (error.message || 'Please try again.');
    }
    
    /**
     * Check if OpenAI API key is available (browser only)
     * @returns {boolean} - Whether a valid API key is available
     */
    isApiKeyAvailable() {
        if (typeof document === 'undefined') {
            return false;
        }

        const apiKeyElement = document.querySelector('#openai-api-key');
        if (!apiKeyElement) {
            return false;
        }

        const apiKey = apiKeyElement.value;
        if (!this.validateApiKeyFormat(apiKey)) {
            this.showError('Please enter a valid OpenAI API key in the Client Information section.', 'adCopy');
            return false;
        }
        return true;
    }
    
    /**
     * Validate that campaign and ad group are selected (browser only)
     * @returns {boolean} - Whether selections are valid
     */
    validateSelections() {
        if (typeof document === 'undefined') {
            return false;
        }

        const campaignSelect = document.querySelector('#campaign-select');
        const adGroupSelect = document.querySelector('#ad-group-select');
        
        if (!campaignSelect || campaignSelect.selectedIndex <= 0) {
            this.showError('Please select a campaign before generating ad copy.', 'adCopy');
            return false;
        }
        
        if (!adGroupSelect || adGroupSelect.selectedIndex <= 0) {
            this.showError('Please select an ad group before generating ad copy.', 'adCopy');
            return false;
        }
        
        return true;
    }
}

// Server-side error handler function
function handleError(error, res) {
    console.error('Error:', error);

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    // Handle custom AppError instances
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        code = error.code;
    } else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
        code = 'VALIDATION_ERROR';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Service unavailable';
        code = 'SERVICE_UNAVAILABLE';
    } else if (error.response) {
        // Handle axios/HTTP errors
        statusCode = error.response.status || 500;
        message = error.response.data?.message || error.message || 'External service error';
        code = 'EXTERNAL_SERVICE_ERROR';
    }

    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message
        }
    });
}

// Create global error handler instance (browser only)
let errorHandler;
if (typeof document !== 'undefined') {
    errorHandler = new ErrorHandler();
}

// Export for use in other modules
if (typeof module !== 'undefined') {
    module.exports = { 
        ErrorHandler, 
        AppError, 
        handleError,
        errorHandler: errorHandler || null 
    };
}
