AI-Powered HRMS - Local Setup Instructions
This guide will help you set up, run, and develop this Enterprise Human Resource Management System (HRMS) on any machine.

Prerequisites
Node.js v18+ and npm must be installed

PostgreSQL database (local or cloud, e.g., Neon)

Optionally: API keys for Gemini, OpenAI, Claude for full AI capabilities

Clone the Project
Copy or download the project files into a local directory.

Install Dependencies
text
npm install
Environment Variables
Create a .env file in your project root with the following:

text
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=your_session_encryption_secret
ENCRYPTION_KEY=your_64_char_hex_encryption_key
GEMINI_API_KEY=your_google_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_claude_api_key
Setup Database
Push schema to the database:

text
npm run db:push
Running Locally (Development)
Start the development server:

text
npm run dev
Frontend: Vite + React
Backend: Express + TypeScript

Production Build
Build and serve for production:

text
npm run build
npm run start
Available Scripts
npm run dev - Start dev server

npm run build - Build frontend and backend

npm run start - Start production server

npm run db:push - Apply database schema

Notes
Ensure your database accepts connections from your machine.

For AI features, configure Gemini API key (primary) and optionally OpenAI/Claude.

Ports can be changed in the code or .env file if needed.
