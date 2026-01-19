# Research Feature Setup Guide

This guide explains how to set up and deploy the Research feature for RepuShield.

## Overview

The Research feature allows users to:
- Create deep research projects with AI-powered analysis
- Upload documents for context
- Get clarifying questions to refine research scope
- Track research progress in real-time
- View comprehensive research reports with citations
- Export reports as JSON

## Prerequisites

1. Supabase account and project
2. Google Gemini API key
3. SerpAPI key (optional, for web search)

## Setup Steps

### 1. Database Setup

Run the SQL migration in your Supabase SQL Editor:

```bash
# File: database/migrations/create_research_tables.sql
```

This creates:
- `researches` table - Stores research tasks
- `research_reports` table - Stores completed reports

### 2. Supabase Edge Functions Deployment

Deploy the three edge functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy deep-Research-gemini
supabase functions deploy clarify-Questions-gemini
supabase functions deploy extract-file-text
```

### 3. Environment Variables

#### Supabase Dashboard → Settings → Edge Functions → Secrets

Add these secrets:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `SERPAPI_KEY` - Your SerpAPI key (optional, for web search)

#### Frontend Environment Variables

Add to your `.env` or Netlify environment variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. File Structure

The following files have been created:

**Backend (Supabase Edge Functions):**
- `supabase/functions/deep-Research-gemini/index.ts`
- `supabase/functions/clarify-Questions-gemini/index.ts`
- `supabase/functions/extract-file-text/index.ts`

**Frontend:**
- `frontend/src/services/researchApi.ts` - API service
- `frontend/src/components/generated/ResearchPage.tsx` - Main hub
- `frontend/src/components/generated/DeepResearchPage.tsx` - Research form
- `frontend/src/components/generated/ResearchProgress.tsx` - Progress tracker
- `frontend/src/components/generated/ResearchReportPage.tsx` - Report viewer

**Database:**
- `database/migrations/create_research_tables.sql`

## Features

### Supported AI Models
- Gemini 2.5 Flash (default)
- Gemini 1.5 Pro Latest
- Gemini Pro

### Supported File Types
- PDF (.pdf)
- Word Documents (.docx)
- Text Files (.txt)
- Markdown (.md)

### Research Depth Levels
- **Light**: Quick overview
- **Standard**: Balanced analysis
- **Deep**: Comprehensive investigation

## Usage Flow

1. User navigates to Research tab
2. Clicks "Initialize Research Agent"
3. Fills out research form:
   - Enter research topic
   - (Optional) Upload document
   - Select depth level
   - Choose AI model
   - (Optional) Generate and answer clarifying questions
4. Research starts automatically
5. Progress is tracked in real-time
6. On completion, report is displayed
7. User can export report as JSON

## Troubleshooting

### Research not starting
- Check Supabase Edge Functions are deployed
- Verify environment variables are set
- Check browser console for errors

### File upload not working
- Ensure file is under 50MB
- Check file type is supported
- Verify Supabase Edge Function is deployed

### Report not loading
- Research may still be processing
- Check research status in database
- Verify Edge Function completed successfully

## Notes

- Research processing can take 30-90 seconds
- Large documents are truncated to 20KB of text
- SerpAPI is optional - mock results will be used if not configured
- All research data is stored in Supabase PostgreSQL database






