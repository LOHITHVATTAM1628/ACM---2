# ACM SQL Learning & Contest Platform

A full-stack, enterprise-grade interactive SQL learning, contest, and assessment platform featuring an in-browser SQLite runtime (`sql.js`), dual student and administrator portals, live AI mentorship (powered by Groq Cloud), and Supabase real-time backend synchronization.

---

## 🚀 Quick Start Guide for Collaborators

Follow these steps to run the platform locally on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/LOHITHVATTAM1628/ACM-1.git
cd ACM-1
```

### 2. Configure Environment Variables
Copy `.env.example` to create your `.env` configuration in both the root directory and `acm-sql-platform`:

```bash
# Root environment setup
cp .env.example .env

# Web application environment setup
cp acm-sql-platform/.env.example acm-sql-platform/.env
```

Open `.env` and fill in your Supabase and Groq API keys:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### 3. Install Dependencies
Install dependencies for both root and the frontend application:
```bash
# Install root dependencies
npm install

# Install web app dependencies
cd acm-sql-platform
npm install
cd ..
```

### 4. Seed Database (Optional / Initial Setup)
Populate track topics, challenges, quizzes, and initial datasets into Supabase:
```bash
npm run seed
```

### 5. Start the Development Server
From the root directory:
```bash
npm run dev
```
Or directly inside `acm-sql-platform`:
```bash
cd acm-sql-platform
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Recharts
- **SQL Editor**: `@uiw/react-codemirror` with `@codemirror/lang-sql` & `@codemirror/theme-one-dark`
- **In-Browser Execution Engine**: WebAssembly-powered `sql.js` (SQLite engine in browser)
- **Backend & Auth**: Supabase (PostgreSQL, Realtime DB, Row-Level Security, Auth)
- **AI Mentorship**: Groq Cloud LLM integration for live SQL code explanations and hints
- **Routing**: React Router v7 with role-based route guards (`/student` and `/admin`)

---

## 📂 Project Structure

```
ACM-s/
├── .env.example                     # Root environment variable template
├── .gitignore                       # Git ignore configuration
├── package.json                     # Root workspace scripts and dependencies
├── scripts/
│   └── seedContest.js               # Database seeding and migration script
└── acm-sql-platform/                # Frontend Vite application
    ├── .env.example                 # Frontend env template
    ├── .gitignore                   # Frontend git ignore configuration
    ├── index.html                   # HTML entry point
    ├── package.json                 # React frontend dependencies & scripts
    ├── tailwind.config.js           # Tailwind CSS configuration
    ├── vite.config.js               # Vite configuration
    ├── public/                      # Static assets & icons
    └── src/
        ├── assets/                  # Images and SVG assets
        ├── components/              # Reusable UI components & route guards
        ├── context/                 # AuthContext & state providers
        ├── layouts/                 # StudentLayout & AdminLayout
        ├── lib/                     # Supabase client, SQL engine & AI service
        └── pages/                   # Student & Admin pages
```

---

## 📦 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with HMR |
| `npm run build` | Bundles the application for production in `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs oxlint fast code linter |
| `npm run seed` | Seeds contest data, tracks, and challenges into Supabase |
