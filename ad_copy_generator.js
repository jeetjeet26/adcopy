/**
 * Ad Copy Generator
 * This script generates ad copy based on client information and industry best practices
 */

class AdCopyGenerator {
    constructor(clientInfo) {
        this.clientInfo = clientInfo;
    }

    /**
     * Generate headlines based on client information
     * @returns {Array} Array of headline options
     */
    generateHeadlines() {
        const headlines = [];
        const clientName = this.clientInfo.name;
        const industry = this.clientInfo.industry;
        const usp = this.parseUSP(this.clientInfo.uniqueSellingPoints);
        const cta = this.clientInfo.callToAction;
        const location = this.clientInfo.geographicTargeting;

        // Name-based headlines
        if (clientName && clientName.length <= 30) {
            headlines.push(clientName);
        }

        // USP-based headlines
        if (usp.length > 0) {
            for (let i = 0; i < Math.min(usp.length, 3); i++) {
                const headline = this.truncateToLength(usp[i], 30);
                if (headline) headlines.push(headline);
            }
        }

        // Location-based headlines
        if (location && location.length <= 25) {
            headlines.push(`${industry} in ${location}`);
            if (usp.length > 0) {
                headlines.push(`Top ${industry} in ${location}`);
            }
        }

        // CTA-based headlines
        if (cta && cta.length <= 25) {
            headlines.push(this.truncateToLength(cta, 30));
        }

        // Generic headlines based on industry
        if (industry) {
            headlines.push(`Premium ${industry}`);
            headlines.push(`${industry} Experts`);
            headlines.push(`Quality ${industry} Services`);
        }

        // Add benefit-oriented headlines
        if (usp.length > 0) {
            headlines.push(this.createBenefitHeadline(usp));
        }

        // Ensure we have at least 11 headlines
        while (headlines.length < 11) {
            headlines.push(this.getGenericHeadline(industry));
        }

        // Return only unique headlines, up to 11
        return [...new Set(headlines)].slice(0, 11);
    }

    /**
     * Generate descriptions based on client information
     * @returns {Array} Array of description options
     */
    generateDescriptions() {
        const descriptions = [];
        const clientName = this.clientInfo.name;
        const industry = this.clientInfo.industry;
        const usp = this.parseUSP(this.clientInfo.uniqueSellingPoints);
        const cta = this.clientInfo.callToAction;
        const location = this.clientInfo.geographicTargeting;

        // USP-based descriptions
        if (usp.length > 0) {
            let uspDescription = `${usp[0]}`;
            if (usp.length > 1) {
                uspDescription += ` and ${usp[1]}`;
            }
            if (cta) {
                uspDescription += `. ${cta}`;
            }
            descriptions.push(this.truncateToLength(uspDescription, 90));
        }

        // Location-based descriptions
        if (location && clientName) {
            descriptions.push(this.truncateToLength(`${clientName} offers premium ${industry} services in ${location}. ${cta || 'Contact us today!'}`, 90));
        }

        // Benefit-oriented descriptions
        if (usp.length > 0) {
            const benefits = this.extractBenefits(usp);
            if (benefits.length > 0) {
                let benefitDesc = `Experience the benefits: ${benefits.join(', ')}`;
                if (cta) {
                    benefitDesc += `. ${cta}`;
                }
                descriptions.push(this.truncateToLength(benefitDesc, 90));
            }
        }

        // Generic descriptions based on industry
        descriptions.push(this.truncateToLength(`Looking for quality ${industry}? We offer the best solutions tailored to your needs. ${cta || 'Contact us today!'}`, 90));
        
        // Add more descriptions for variety
        descriptions.push(this.truncateToLength(`Premium ${industry} services with exceptional customer satisfaction. ${cta || 'Get in touch now!'}`, 90));
        
        descriptions.push(this.truncateToLength(`Professional ${industry} solutions designed to exceed your expectations. ${cta || 'Learn more today!'}`, 90));
        
        descriptions.push(this.truncateToLength(`Trusted ${industry} provider with proven results and outstanding service quality. ${cta || 'Contact us!'}`, 90));

        // Return exactly 4 unique descriptions
        return [...new Set(descriptions)].slice(0, 4);
    }

    /**
     * Generate path fields based on client information
     * @returns {Array} Array of path options
     */
    generatePaths() {
        const paths = [];
        const industry = this.clientInfo.industry;
        const location = this.clientInfo.geographicTargeting;

        // Industry-based paths
        if (industry) {
            const industryWords = industry.split(' ');
            if (industryWords.length > 0) {
                paths.push(this.truncateToLength(industryWords[0].toLowerCase(), 15));
            }
            if (industryWords.length > 1) {
                paths.push(this.truncateToLength(industryWords[1].toLowerCase(), 15));
            }
        }

        // Location-based paths
        if (location) {
            const locationWords = location.split(' ');
            if (locationWords.length > 0) {
                paths.push(this.truncateToLength(locationWords[0].toLowerCase(), 15));
            }
            if (locationWords.length > 1) {
                paths.push(this.truncateToLength(locationWords[1].toLowerCase(), 15));
            }
        }

        // Generic paths
        paths.push('services');
        paths.push('offers');
        paths.push('solutions');
        paths.push('products');
        paths.push('contact');

        // Return only unique paths
        return [...new Set(paths)].slice(0, 2);
    }

    /**
     * Generate complete ad variations
     * @param {number} count Number of ad variations to generate
     * @returns {Array} Array of ad objects
     */
    generateAds(count = 3) {
        const headlines = this.generateHeadlines();
        const descriptions = this.generateDescriptions();
        const paths = this.generatePaths();
        const ads = [];

        // Create ad variations
        for (let i = 0; i < count; i++) {
            // Ensure we have enough variations
            if (headlines.length < 3 || descriptions.length < 2) break;

            // Select different combinations for each ad
            const headlineIndices = this.getUniqueRandomIndices(headlines.length, 3);
            const descriptionIndices = this.getUniqueRandomIndices(descriptions.length, 2);

            const ad = {
                headlines: [
                    headlines[headlineIndices[0]],
                    headlines[headlineIndices[1]],
                    headlines[headlineIndices[2]]
                ],
                descriptions: [
                    descriptions[descriptionIndices[0]],
                    descriptions[descriptionIndices[1]]
                ],
                paths: paths.slice(0, 2)
            };

            ads.push(ad);
        }

        return ads;
    }

    /**
     * Parse unique selling points from text
     * @param {string} uspText Text containing USPs
     * @returns {Array} Array of USPs
     */
    parseUSP(uspText) {
        if (!uspText) return [];
        
        // Split by numbered list format or new lines
        let points = [];
        if (uspText.includes('\n')) {
            points = uspText.split('\n').map(p => p.trim());
        } else {
            // Try to extract numbered or bulleted points
            const matches = uspText.match(/(?:\d+\.\s*|\*\s*|-)?(.*?)(?=\d+\.\s*|\*\s*|-|$)/g);
            if (matches) {
                points = matches.map(p => p.replace(/^\d+\.\s*|\*\s*|-\s*/, '').trim()).filter(p => p);
            } else {
                // Just split by periods or semicolons
                points = uspText.split(/[.;]/).map(p => p.trim()).filter(p => p);
            }
        }
        
        // Clean up and filter empty points
        return points.map(p => {
            // Remove any leading numbers, bullets, etc.
            return p.replace(/^\d+\.\s*|\*\s*|-\s*/, '').trim();
        }).filter(p => p);
    }

    /**
     * Create a benefit-oriented headline from USPs
     * @param {Array} usp Array of USPs
     * @returns {string} Benefit headline
     */
    createBenefitHeadline(usp) {
        const benefits = [
            'Save Time & Money',
            'Premium Quality Guaranteed',
            'Expert Solutions',
            'Top-Rated Service',
            'Customer Satisfaction',
            'Best Value'
        ];
        
        // Try to extract a benefit from the USPs
        for (const point of usp) {
            if (point.toLowerCase().includes('save') || 
                point.toLowerCase().includes('discount') || 
                point.toLowerCase().includes('affordable')) {
                return 'Save Time & Money';
            }
            if (point.toLowerCase().includes('quality') || 
                point.toLowerCase().includes('premium') || 
                point.toLowerCase().includes('luxury')) {
                return 'Premium Quality Guaranteed';
            }
            if (point.toLowerCase().includes('expert') || 
                point.toLowerCase().includes('professional') || 
                point.toLowerCase().includes('experienced')) {
                return 'Expert Solutions';
            }
        }
        
        // Return a random benefit if none matches
        return benefits[Math.floor(Math.random() * benefits.length)];
    }

    /**
     * Extract benefits from USPs
     * @param {Array} usp Array of USPs
     * @returns {Array} Array of benefits
     */
    extractBenefits(usp) {
        const benefits = [];
        
        for (const point of usp) {
            // Extract short benefit phrases
            const words = point.split(' ');
            if (words.length > 3) {
                // Take first 3-4 words as a benefit
                benefits.push(words.slice(0, 3).join(' '));
            } else {
                benefits.push(point);
            }
        }
        
        return benefits;
    }

    /**
     * Get a generic headline based on industry
     * @param {string} industry Industry name
     * @returns {string} Generic headline
     */
    getGenericHeadline(industry) {
        const templates = [
            `Top ${industry} Provider`,
            `Quality ${industry} Services`,
            `${industry} Experts`,
            `Professional ${industry}`,
            `Trusted ${industry} Solutions`,
            `Premium ${industry} Options`,
            `Elite ${industry} Services`,
            `Leading ${industry} Company`,
            `Best ${industry} Results`,
            `Certified ${industry} Pro`,
            `Award-Winning ${industry}`
        ];
        
        // Cycle through templates to ensure variety
        const index = Math.floor(Math.random() * templates.length);
        return this.truncateToLength(templates[index], 30);
    }

    /**
     * Get unique random indices from a range
     * @param {number} max Maximum index value
     * @param {number} count Number of indices to get
     * @returns {Array} Array of unique indices
     */
    getUniqueRandomIndices(max, count) {
        const indices = [];
        const available = Array.from({length: max}, (_, i) => i);
        
        for (let i = 0; i < count && available.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * available.length);
            indices.push(available[randomIndex]);
            available.splice(randomIndex, 1);
        }
        
        return indices;
    }

    /**
     * Truncate text to specified length with 90%-100% optimization
     * @param {string} text Text to truncate
     * @param {number} maxLength Maximum length
     * @returns {string} Optimized text within 90%-100% of limit
     */
    truncateToLength(text, maxLength) {
        if (!text) return '';
        
        const minLength = Math.ceil(maxLength * 0.9); // 90% of max length
        const trimmedText = text.trim();
        
        // If already in optimal range, return as is
        if (trimmedText.length >= minLength && trimmedText.length <= maxLength) {
            return trimmedText;
        }
        
        // If too long, intelligently truncate
        if (trimmedText.length > maxLength) {
            // Try to find a good word boundary within the target range
            let bestCut = maxLength;
            
            // Look for word boundaries from maxLength down to minLength
            for (let i = maxLength; i >= minLength; i--) {
                if (i < trimmedText.length && (trimmedText[i] === ' ' || trimmedText[i] === '.' || trimmedText[i] === ',')) {
                    bestCut = i;
                    break;
                }
            }
            
            // If we found a good boundary, use it
            if (bestCut < trimmedText.length) {
                const result = trimmedText.substring(0, bestCut).trim();
                if (result.length >= minLength) {
                    return result;
                }
            }
            
            // Otherwise, cut at maxLength and remove any partial word
            let truncated = trimmedText.substring(0, maxLength);
            const lastSpaceIndex = truncated.lastIndexOf(' ');
            
            if (lastSpaceIndex > minLength) {
                return truncated.substring(0, lastSpaceIndex).trim();
            }
            
            return truncated.trim();
        }
        
        // If too short, extend it strategically
        if (trimmedText.length < minLength) {
            let result = trimmedText;
            const charsNeeded = minLength - trimmedText.length;
            
            // Get appropriate extensions based on the type of content
            const extensions = this.getTargetedExtensions(trimmedText, maxLength, charsNeeded);
            
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
        
        return trimmedText;
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
            
        } else if (maxLength === 15) { // Paths
            // Short, relevant extensions for paths
            if (charsNeeded <= 3) {
                extensions.push('pro', 'top', 'new');
            } else if (charsNeeded <= 6) {
                extensions.push('today', 'offers', 'deals');
            } else {
                extensions.push('services', 'solutions', 'contact');
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
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdCopyGenerator;
}
