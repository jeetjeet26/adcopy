# AI-Powered Google Ads Campaign Builder

A production-ready web application that combines AI-powered content generation with real keyword data to create highly effective Google Ads campaigns. Built for marketing professionals who need powerful, data-driven campaign creation tools.

## 🌟 Overview

This tool revolutionizes Google Ads campaign creation by combining:
- **Real Keyword Data**: Semrush API integration for actual search volumes and competition metrics
- **AI-Powered Content**: OpenAI GPT-4 for intelligent ad copy generation
- **Professional Workflow**: Structured campaign building with export capabilities
- **Smart Fallbacks**: Graceful degradation when external APIs are unavailable

## 🚀 Key Features

### **Professional Keyword Research**
- **Semrush Integration**: Live keyword data with search volumes, CPC estimates, and competition analysis
- **Context-Aware Generation**: Keywords tailored to specific campaigns and business contexts
- **AI Enhancement**: OpenAI-powered keyword analysis and categorization
- **Smart Categorization**: Automatic grouping by volume, competition, and relevance

### **Intelligent Campaign Management**
- **Hierarchical Structure**: Organized campaigns, ad groups, and keyword management
- **Unit Type Campaigns**: Special handling for real estate and location-based campaigns
- **Dynamic Targeting**: Keywords aligned with campaign objectives and budgets
- **Theme-Based Organization**: Focused keyword sets for maximum ad relevance

### **AI-Powered Content Creation**
- **Contextual Ad Copy**: GPT-4 orchestrated content that aligns with keyword strategy
- **Real-Time Validation**: Character limit enforcement (headlines: 30, descriptions: 90, paths: 15)
- **Brand Voice Integration**: Consistent messaging across all campaign content
- **Multi-Format Generation**: Headlines, descriptions, and display URLs

### **Professional Export System**
- **Google Ads Editor Ready**: Direct CSV export for seamless campaign imports
- **Multiple Formats**: JSON, CSV support with planned Excel integration
- **Data Integrity**: Complete campaign structure preservation across exports

## 🛠️ Quick Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **OpenAI API Key** (required) - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Semrush API Key** (recommended) - Get from [Semrush API](https://www.semrush.com/api-documentation/)

### 1. Environment Configuration

Create a `.env` file in the project root:

```bash
# Required: OpenAI API Key for AI-powered features
OPENAI_API_KEY=your_openai_api_key_here

# Recommended: Semrush API Key for real keyword data
SEMRUSH_API_KEY=your_semrush_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 2. Installation & Launch

```bash
# Install all dependencies
npm install

# Start the application
npm start

# For development with auto-reload
npm run dev
```

**Access the application**: `http://localhost:3000`

## 📋 Professional Workflow

### Step 1: Client Information Setup
Complete the client profile with:
- **Business Details**: Company name, website, industry vertical
- **Target Audience**: Demographics, geographic targeting, customer personas
- **Marketing Goals**: Campaign objectives, budget considerations, KPIs
- **Brand Guidelines**: Voice, tone, messaging preferences, CTAs

### Step 2: Campaign Architecture
- **Create Campaigns**: Define clear objectives and budget allocation
- **Build Ad Groups**: Organize by themes, products, or services
- **Structure Hierarchy**: Logical organization for optimal performance

### Step 3: Advanced Keyword Research
- **Automated Analysis**: AI analyzes client profile and campaign context
- **Live Data Integration**: Semrush provides real search volumes and competition
- **Smart Categorization**: Keywords organized by performance potential
- **Strategic Alignment**: Keywords matched to campaign goals and budget

### Step 4: AI Content Generation
- **Context-Aware Creation**: Ad copy generated based on keywords and client info
- **Real-Time Optimization**: Automatic character limit compliance
- **Performance Focus**: Content optimized for click-through rates
- **Brand Consistency**: Messaging aligned with client voice and guidelines

### Step 5: Export & Implementation
- **Google Ads Ready**: CSV format compatible with Google Ads Editor
- **Complete Campaign Data**: All elements preserved for immediate use
- **Quality Assurance**: Validation checks before export

## 🔧 Technical Architecture

### Backend Infrastructure
- **Runtime**: Node.js with Express.js framework
- **API Integration**: RESTful architecture with robust error handling
- **Security**: Environment-based configuration management
- **Performance**: Optimized request handling and response caching

### AI & Data Integration
- **Primary AI**: OpenAI GPT-4 for complex analysis and orchestration
- **Content Generation**: GPT-4 for high-quality ad copy creation
- **Keyword Data**: Semrush API for professional market intelligence
- **Fallback Systems**: Graceful degradation when external services unavailable

### Frontend Technology
- **Framework**: Modern vanilla JavaScript with ES6+ features
- **Interface**: Responsive design with professional UX
- **Validation**: Real-time input validation and feedback
- **Storage**: LocalStorage for session data persistence

## 🔌 API Reference

| Endpoint | Method | Purpose | Parameters |
|----------|--------|---------|------------|
| `/api/generate-ad-copy` | POST | Generate AI-powered ad copy | `clientInfo`, `campaignContext`, `adGroupContext`, `savedKeywords` |
| `/api/generate-keywords` | POST | Generate keyword suggestions with real data | `clientInfo`, `campaignContext`, `adGroupContext` |
| `/api/health` | GET | System health and service status | None |
| `/` | GET | Serve main application | None |

### Sample Request: Ad Copy Generation
```javascript
POST /api/generate-ad-copy
{
  "clientInfo": {
    "name": "Real Estate Agency",
    "industry": "Real Estate",
    "targetAudience": "Home buyers in Miami",
    "uniqueSellingPoints": ["Local expertise", "24/7 service"]
  },
  "campaignContext": {
    "name": "Miami Homes Campaign",
    "objective": "Lead Generation",
    "budget": 5000
  },
  "adGroupContext": {
    "name": "Luxury Condos",
    "theme": "High-end properties"
  }
}
```

## 🚨 Error Handling & Reliability

- **Graceful Degradation**: System continues operation even if external APIs fail
- **Comprehensive Logging**: Detailed error tracking and debugging information
- **Input Validation**: Client-side and server-side data validation
- **Rate Limiting**: Responsible API usage with proper throttling
- **Timeout Management**: Prevents hanging requests and ensures responsiveness

## 📁 File Structure

```
google-ads-campaign-builder/
├── server.js                        # Main Express server
├── package.json                     # Dependencies and scripts
├── .env                            # Environment variables
├── index.html                      # Main application interface
├── agentic_ad_copy_generator.js    # Frontend AI integration
├── ad_copy_generator.js            # Rule-based ad generation
├── openai_connector.js             # OpenAI API integration
├── openai_config.js                # OpenAI configuration
├── semrush_connector.js            # Semrush API integration
├── error_handling.js               # Error management system
└── test_semrush.js                 # Semrush API testing utilities
```

## 🌐 Production Deployment

### Environment Setup
```bash
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your_production_key
SEMRUSH_API_KEY=your_production_key
```

### Recommended Infrastructure
- **Process Manager**: PM2 for application management
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **Security**: HTTPS enforcement, API rate limiting, input sanitization
- **Monitoring**: Application performance monitoring and logging
- **Backup**: Regular data backup strategy

### Deployment Checklist
- [ ] Environment variables secured and configured
- [ ] API keys tested in production environment
- [ ] HTTPS/SSL certificates installed and configured
- [ ] Application monitoring and alerting configured
- [ ] Performance optimization and caching implemented
- [ ] Security headers and CORS properly configured

## 🔑 API Key Setup

### OpenAI API (Required)
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env` file as `OPENAI_API_KEY=your_key_here`
4. Ensure billing is configured for API usage

### Semrush API (Recommended)
1. Visit [Semrush API Documentation](https://www.semrush.com/api-documentation/)
2. Sign up for API access
3. Generate your API key
4. Add to `.env` file as `SEMRUSH_API_KEY=your_key_here`
5. Test connection using the health endpoint

## 🛟 Troubleshooting

### Common Issues

**"OpenAI API key not configured"**
- Verify `.env` file exists and contains `OPENAI_API_KEY`
- Check API key validity on OpenAI platform
- Ensure billing is active on your OpenAI account

**"Semrush integration unavailable"**
- Verify `SEMRUSH_API_KEY` in `.env` file
- Test API key using `/api/health` endpoint
- Check Semrush account status and API limits

**"Application won't start"**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires v14+)
- Verify port 3000 is available

### Getting Help
- Check the `/api/health` endpoint for service status
- Review application logs for detailed error information
- Verify all environment variables are properly configured

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

This project is optimized for marketing professionals and can be customized for various industries. Contributions welcome for:
- Additional export formats
- Enhanced keyword analysis
- Extended API integrations
- UI/UX improvements

---

**Built for Marketing Professionals** | **Powered by AI** | **Real Data Integration** 