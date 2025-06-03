/**
 * Agentic Ad Copy Generator
 * This module integrates with the backend API to generate ad copy based on user inputs
 */

class AgenticAdCopyGenerator {
    constructor() {
        this.isGenerating = false;
        this.apiBaseUrl = window.location.origin; // Use the same origin as the current page
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for the UI
     */
    setupEventListeners() {
        // Add event listener for generate button
        const generateButton = document.getElementById('generate-ad-copy');
        if (generateButton) {
            generateButton.addEventListener('click', () => {
                this.generateAdCopy();
            });
        }
    }

    /**
     * Collect client information from the form
     * @returns {Object} - Client information
     */
    collectClientInfo() {
        return {
            name: document.getElementById('client-name').value,
            website: document.getElementById('website-url').value,
            industry: document.getElementById('industry').value,
            targetAudience: document.getElementById('target-audience').value,
            geographicTargeting: document.getElementById('geographic-targeting').value,
            uniqueSellingPoints: document.getElementById('unique-selling-points').value,
            competitors: document.getElementById('competitors').value,
            brandVoice: document.getElementById('brand-voice').value,
            callToAction: document.getElementById('call-to-action').value,
            budget: document.getElementById('budget').value
        };
    }

    /**
     * Generate ad copy using backend API
     */
    async generateAdCopy() {
        if (this.isGenerating) {
            return;
        }

        // Get selected campaign and ad group
        const campaignSelect = document.getElementById('ad-campaign-select');
        const adGroupSelect = document.getElementById('ad-group-select');
        
        if (!campaignSelect || !adGroupSelect) {
            this.showError('Please select a campaign and ad group first.');
            return;
        }

        const campaignId = campaignSelect.value;
        const adGroupId = adGroupSelect.value;
        
        if (!campaignId || !adGroupId) {
            this.showError('Please select a campaign and ad group first.');
            return;
        }

        // Collect client information
        const clientInfo = this.collectClientInfo();
        
        // Validate required fields
        if (!this.validateClientInfo(clientInfo)) {
            this.showError('Please fill in all required client information fields.');
            return;
        }

        try {
            this.isGenerating = true;
            this.showGeneratingStatus(true);

            // Make API call to backend
            const response = await fetch(`${this.apiBaseUrl}/api/generate-ad-copy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clientInfo)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate ad copy');
            }

            const result = await response.json();
            
            // Update UI with generated ad copy
            this.updateAdCopyUI(result.adCopy);
            
            // Show success message
            this.showSuccess('Ad copy generated successfully!');
        } catch (error) {
            console.error('Error generating ad copy:', error);
            this.showError(`Failed to generate ad copy: ${error.message}`);
        } finally {
            this.isGenerating = false;
            this.showGeneratingStatus(false);
        }
    }

    /**
     * Validate client information
     * @param {Object} clientInfo - Client information
     * @returns {boolean} - Whether client information is valid
     */
    validateClientInfo(clientInfo) {
        const requiredFields = [
            'name', 'website', 'industry', 'targetAudience', 
            'geographicTargeting', 'uniqueSellingPoints', 'brandVoice', 'callToAction'
        ];
        
        for (const field of requiredFields) {
            if (!clientInfo[field] || clientInfo[field].trim() === '') {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Update UI with generated ad copy
     * @param {Object} adCopy - Generated ad copy
     */
    updateAdCopyUI(adCopy) {
        // Update headlines - Fixed to match actual HTML IDs
        const headlineIds = ['headline1', 'headline2', 'headline3'];
        for (let i = 0; i < adCopy.headlines.length; i++) {
            const headlineInput = document.getElementById(headlineIds[i]);
            if (headlineInput) {
                headlineInput.value = adCopy.headlines[i];
                // Trigger input event to update character count
                const event = new Event('input', { bubbles: true });
                headlineInput.dispatchEvent(event);
            }
        }
        
        // Update descriptions - Fixed to match actual HTML IDs
        const descriptionIds = ['description1', 'description2'];
        for (let i = 0; i < adCopy.descriptions.length; i++) {
            const descriptionInput = document.getElementById(descriptionIds[i]);
            if (descriptionInput) {
                descriptionInput.value = adCopy.descriptions[i];
                // Trigger input event to update character count
                const event = new Event('input', { bubbles: true });
                descriptionInput.dispatchEvent(event);
            }
        }
        
        // Update paths - Fixed to match actual HTML IDs
        const pathIds = ['path1', 'path2'];
        for (let i = 0; i < adCopy.paths.length; i++) {
            const pathInput = document.getElementById(pathIds[i]);
            if (pathInput) {
                pathInput.value = adCopy.paths[i];
                // Trigger input event to update character count
                const event = new Event('input', { bubbles: true });
                pathInput.dispatchEvent(event);
            }
        }
        
        // Update the preview
        this.updateAdPreview();
    }

    /**
     * Update ad preview
     */
    updateAdPreview() {
        const headline1 = document.getElementById('headline1').value;
        const headline2 = document.getElementById('headline2').value;
        const headline3 = document.getElementById('headline3').value;
        const description1 = document.getElementById('description1').value;
        const description2 = document.getElementById('description2').value;
        const path1 = document.getElementById('path1').value;
        const path2 = document.getElementById('path2').value;
        const websiteUrl = document.getElementById('website-url').value;

        const previewContainer = document.getElementById('ad-preview');
        if (previewContainer) {
            const domain = this.extractDomain(websiteUrl);
            previewContainer.innerHTML = `
                <div style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; background-color: #fff;">
                    <div style="color: #1a73e8; font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                        ${headline1 || 'Headline 1'} | ${headline2 || 'Headline 2'} | ${headline3 || 'Headline 3'}
                    </div>
                    <div style="color: #006621; font-size: 14px; margin-bottom: 5px;">
                        ${domain}/${path1 || 'path1'}/${path2 || 'path2'}
                    </div>
                    <div style="color: #545454; font-size: 14px; line-height: 1.4;">
                        ${description1 || 'Description 1'} ${description2 || 'Description 2'}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Extract domain from URL
     * @param {string} url - Full URL
     * @returns {string} - Domain
     */
    extractDomain(url) {
        try {
            if (!url) return 'www.example.com';
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (e) {
            return 'www.example.com';
        }
    }

    /**
     * Show generating status
     * @param {boolean} isGenerating - Whether currently generating
     */
    showGeneratingStatus(isGenerating) {
        const loadingElement = document.getElementById('loading-ad-copy');
        const generateButton = document.getElementById('generate-ad-copy');
        
        if (loadingElement) {
            loadingElement.style.display = isGenerating ? 'block' : 'none';
        }
        
        if (generateButton) {
            generateButton.disabled = isGenerating;
            generateButton.textContent = isGenerating ? 'Generating...' : 'Generate Ad Copy';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Remove any existing error messages
        this.clearMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.display = 'block';
        errorDiv.textContent = message;
        
        const generateButton = document.getElementById('generate-ad-copy');
        if (generateButton && generateButton.parentNode) {
            generateButton.parentNode.insertBefore(errorDiv, generateButton);
        }
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Remove any existing messages
        this.clearMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        
        const generateButton = document.getElementById('generate-ad-copy');
        if (generateButton && generateButton.parentNode) {
            generateButton.parentNode.insertBefore(successDiv, generateButton);
        }
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        const messages = document.querySelectorAll('.error-message, .success');
        messages.forEach(message => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        });
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgenticAdCopyGenerator;
}
