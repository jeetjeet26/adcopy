# Google Ads Campaign Builder - AI-Powered

A comprehensive web application that helps create Google Ads campaigns with AI-generated ad copy using OpenAI's GPT models.

## Features

- **Campaign Structure Builder**: Create organized Google Ads campaigns with multiple ad groups
- **AI-Powered Ad Copy Generation**: Automatically generate compelling ad copy based on client information
- **Keyword Management**: Add keywords with different match types for each ad group
- **AI-Powered Content**: Generate multiple ad variations with 11 headlines and 4 descriptions
- **Real-time Validation**: Character limits for headlines (30), descriptions (90), and paths (15)
- **Campaign Management**: Create multiple campaigns with structured ad groups
- **Export Functionality**: Export campaigns to CSV format for Google Ads Editor
- **Professional Interface**: Clean, intuitive design with step-by-step workflow
- **Dual AI Approach**: Uses GPT-4 for orchestration and GPT-3.5-Turbo for generation

## ✨ Key Features

- **Automated Ad Copy Generation**: Generate professional Google Ads copy with 11 unique headlines and 4 compelling descriptions

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Your `.env` file should already be configured with your OpenAI API key. If not, create a `.env` file in the root directory:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

### 3. Start the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Usage Workflow

### 1. Client Information
- Fill in comprehensive client details including:
  - Client name and website
  - Industry/niche
  - Target audience demographics
  - Geographic targeting
  - Unique selling points
  - Brand voice and call-to-action preferences

### 2. Campaign Structure
- Create campaigns and ad groups
- Build organized hierarchy for your ads

### 3. Keywords
- Add keywords to ad groups
- Select match types (exact, phrase, broad)
- Organize keyword targeting

### 4. **Ad Copy Generation**
   - AI automatically generates optimized ad copy with 11 unique headlines and 4 compelling descriptions
   - Headlines, descriptions, and paths are automatically generated based on client information
   - Manual editing and refinement capabilities
   - Real-time character count validation

### 5. Export
- Export campaigns in multiple formats:
  - CSV (Google Ads Editor compatible)
  - JSON
  - Excel (planned feature)

## Technical Architecture

- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **AI Integration**: OpenAI GPT-4 (orchestration) + GPT-3.5-Turbo (generation)
- **Storage**: LocalStorage for client-side data persistence
- **Security**: API keys stored server-side via environment variables

## API Endpoints

- `POST /api/generate-ad-copy` - Generate AI-powered ad copy
- `GET /api/health` - Health check and configuration status
- `GET /` - Serve main application

## File Structure

```
├── server.js                      # Express server
├── package.json                   # Dependencies
├── .env                          # Environment variables
├── index.html                    # Main application UI
├── agentic_ad_copy_generator.js  # Frontend AI integration
├── ad_copy_generator.js          # Rule-based ad generation
├── openai_connector.js           # OpenAI API connector
├── openai_config.js              # OpenAI configuration
└── error_handling.js             # Error management
```

## Customization

The application is specifically optimized for real estate marketing but can be adapted for other industries by:

1. Modifying prompts in `server.js`
2. Updating industry-specific templates
3. Adjusting validation rules and character limits

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a process manager like PM2
3. Configure reverse proxy (nginx)
4. Enable HTTPS
5. Set up monitoring and logging

## Security Notes

- API keys are stored server-side and never exposed to the browser
- All client data is processed locally (localStorage)
- CORS is enabled for development (configure for production)

## License

MIT License - See LICENSE file for details 