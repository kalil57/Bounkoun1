# Bounkoun Literature Service

This is the independent backend literature microservice for Bounkoun.
It provides:
- Academic literature searches via the OpenAlex API
- Saved paper summaries and concepts
- AI-powered summaries (using Anthropic Claude)
- Citation extraction and database integration (Supabase)

## API Endpoints

- `POST /search/:projectId` - Performs literature search on OpenAlex and persists search & paper logs.
- `GET /papers/:paperId/summary` - Gets or generates AI-powered summary for a paper.
- `POST /citations/:paperId` - Generates and saves AI citations.

## Run locally

1. Create a `.env` file in the root directory:
   ```env
   PORT=3001
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start server:
   ```bash
   npm start
   ```
