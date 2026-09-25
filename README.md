# My Personal AI

This project is designed so the public website can be hosted on GitHub Pages while the secret AI API is kept on Vercel.

## Files
- index.html — website
- style.css — design
- app.js — frontend
- api/chat.js — secure backend
- vercel.json — Vercel configuration

## Vercel setup
Create a Vercel project from this repository. Add these Environment Variables:

AI_API_KEY = your AI provider API key
AI_BASE_URL = https://api.openai.com/v1
AI_MODEL = your chosen model
TAVILY_API_KEY = optional key for web search

Deploy the project.

## GitHub Pages setup
Put index.html, style.css and app.js in your GitHub Pages repository.
In app.js change:

const API_URL = "PASTE_YOUR_VERCEL_API_URL_HERE";

to:

const API_URL = "https://YOUR-VERCEL-DOMAIN/api/chat";

Do not put AI_API_KEY or TAVILY_API_KEY in GitHub.

## Important
This is a general-purpose assistant, not an unrestricted system. It should follow lawful and safe instructions, use web search when enabled and available, and be honest when information is unavailable.
