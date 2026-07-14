# Bounkoun-WritingEngine

Writing Engine Microservice for the Bounkoun academic writing platform. Built with Node.js, Express, Supabase, and Anthropic Claude.

## Features

- **Thesis Outline Generation**: Produces a comprehensive thesis outline matching the academic level of the project.
- **Section Writing**: Generates deep academic prose for specific sections, incorporating references from relevant literature.
- **Chapter Writing**: Produces a cohesive, fully developed chapter structure with academic rigor.
- **Academic Language Polish**: Elevates existing prose to standard professional academic language.
- **Bilingual Outputs**: Provides English and French translations of the academic content.

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3002
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ```

3. **Start the Service**:
   ```bash
   # Production mode
   npm start

   # Development mode (with live watch)
   npm run dev
   ```

## API Documentation

### Health Check
- **GET `/`**
  - Response: `{ "status": "Bounkoun Writing Engine running" }`

### Create Outline
- **POST `/outline/:projectId`**
  - Generates the complete thesis structure for the specified project.

### Write Section
- **POST `/sections/:projectId`**
  - Body:
    ```json
    {
      "sectionName": "1.1 Background of the Study"
    }
    ```
  - Generates highly academic prose for the given section name.

### Write Chapter
- **POST `/chapters/:projectId`**
  - Body:
    ```json
    {
      "chapterTitle": "Chapter 2: Literature Review"
    }
    ```
  - Generates a full length chapter with deep literature synthesis.

### Polish Text
- **POST `/polish/:projectId`**
  - Body:
    ```json
    {
      "text": "The existing text to polish...",
      "bilingual": true
    }
    ```
  - Rewrites text with academic tone. If `bilingual` is `true`, it returns dual English and French versions.
