# Clinical Protocol MVP

AI-powered web application for generating clinical study protocol drafts, SAP outlines, and ICF outlines.

## Features

- **Authentication**: Simple email/password login
- **Project Management**: Create and manage clinical study projects
- **Study Input Form**: Structured form for entering study parameters
- **AI Generation**: Generate protocol drafts, SAP outlines, and ICF outlines using AI
- **Version Control**: Save and compare different versions of generated documents
- **Export**: Export documents in Markdown, HTML, and DOCX formats
- **GCP/ICH Suggestions**: Get AI-powered suggestions for GCP/ICH-compliant wording
- **Warning Detection**: Identify potential logical inconsistencies in study design

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, custom components
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: OpenAI API (compatible)
- **Export**: docx library for DOCX generation

## Deployment to GitHub and Production

### Push to GitHub

1. **Install Git** (if not installed):
   - Download from https://git-scm.com/downloads
   - Install and restart terminal

2. **Initialize Git repository**:
   ```bash
   cd clinical-protocol-mvp
   git init
   ```

3. **Add files and commit**:
   ```bash
   git add .
   git commit -m "Initial commit: Clinical Protocol MVP"
   ```

4. **Create repository on GitHub** (via web interface):
   - Go to https://github.com/new
   - Create a new repository (e.g., `clinical-protocol-mvp`)
   - Do NOT initialize with README (we already have one)

5. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/clinical-protocol-mvp.git
   git branch -M main
   git push -u origin main
   ```

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Link to your GitHub repository

3. **Configure environment variables in Vercel**:
   - Go to your project settings in Vercel dashboard
   - Add these environment variables:
     - `DATABASE_URL`: Your SQLite file path or use Vercel Postgres
     - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
     - `NEXTAUTH_URL`: Your Vercel deployment URL
     - `OPENAI_API_KEY`: Your AI gateway key
     - `OPENAI_BASE_URL`: Your AI gateway URL
     - `OPENAI_MODEL`: Your model name
     - `NODE_TLS_REJECT_UNAUTHORIZED`: `0` (if needed for your gateway)

4. **Deploy database migrations**:
   - Vercel doesn't support SQLite file-based databases in production
   - Options:
     a) Use Vercel Postgres (recommended)
     b) Use PlanetScale or another MySQL/PostgreSQL service
     c) Use Supabase

   Update `prisma/schema.prisma` accordingly and run:
   ```bash
   vercel env pull  # Pull env vars locally
   npx prisma migrate deploy  # Deploy migrations
   npx prisma db seed  # Seed demo user
   ```

### Deploy to Railway/Render

1. **Connect GitHub repository**
2. **Add environment variables**
3. **Add database service** (PostgreSQL recommended)
4. **Add build command**: `npx prisma generate && npx prisma migrate deploy && npm run build`
5. **Add start command**: `npm start`

### Important Notes for Production

- **Database**: SQLite is not suitable for production with multiple users. Use PostgreSQL instead.
- **Authentication**: Consider using a more robust auth solution for production.
- **AI Gateway**: Ensure your AI gateway supports production traffic.
- **Security**: Update `NEXTAUTH_SECRET` with a strong random value.
- **Environment Variables**: Never commit `.env` file with real keys to GitHub.

### Quick Start After Deployment

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/clinical-protocol-mvp.git
   cd clinical-protocol-mvp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. Setup database:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   node prisma/seed.js
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000
   - Login: demo@example.com
   - Password: Demo12345!

## Demo Credentials

```
Email: demo@example.com
Password: Demo12345!
```

## Usage

1. **Login**: Use the demo credentials or create your own user
2. **Create Project**: Click "New Project" and fill in the basic study information
3. **Fill Study Input**: Navigate to the "Study Input" tab and fill in all study parameters
4. **Generate Draft**: Click "Generate Draft" to create protocol, SAP, and ICF outlines
5. **Review Output**: Check the generated content in different tabs (Protocol, SAP, ICF, Warnings, GCP Suggestions)
6. **Save Version**: Save the generated draft as a version for future reference
7. **Compare Versions**: Compare different versions of your document
8. **Export**: Download the document in your preferred format (MD, HTML, DOCX)

## Project Structure

```
clinical-protocol-mvp/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Database seeding script
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── projects/  # Project management
│   │   │   ├── study-input/ # Study input CRUD
│   │   │   ├── generate/  # AI generation endpoint
│   │   │   ├── versions/  # Version management
│   │   │   ├── compare/   # Version comparison
│   │   │   └── export/    # Document export
│   │   ├── login/         # Login page
│   │   ├── projects/      # Project pages
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/
│   │   ├── ui/            # Reusable UI components
│   │   ├── navbar.tsx     # Navigation bar
│   │   └── providers.tsx  # Context providers
│   └── lib/
│       ├── auth/          # Authentication utilities
│       └── db.ts          # Prisma client
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `POST /api/projects/[id]` - Get project details

### Study Input
- `POST /api/study-input` - Save study input

### AI Generation
- `POST /api/generate` - Generate protocol draft package

### Versions
- `POST /api/versions` - Save new version

### Compare
- `POST /api/compare` - Compare two versions

### Export
- `POST /api/export` - Export document (formats: markdown, html, docx)

## AI Generation

The AI generates structured JSON with the following components:

- **Protocol**: Full protocol draft with sections (Synopsis, Background, Objectives, Study Design, etc.)
- **SAP Outline**: Statistical Analysis Plan outline
- **ICF Outline**: Informed Consent Form outline
- **Warnings**: Potential logical inconsistencies
- **GCP Suggestions**: GCP/ICH-oriented wording recommendations
- **Disclaimer**: AI-generated content disclaimer

## Important Notes

⚠️ **This is an MVP for demonstration purposes only:**

- Uses synthetic/AI-generated data only
- Not a production-grade clinical system
- Does not include complex approval workflows
- AI assists with draft generation but does not replace expert review
- No real medical data is used or stored
- Not intended for regulatory submission

## License

MIT
