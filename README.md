# Bull-v-Bear

**Bull-v-Bear** is an AI-powered investment research assistant that helps users organize stock-specific notes and receive balanced, evidence-based insights before making investment decisions.

The platform is designed for educational and research purposes. Instead of relying on a single AI opinion, Bull-v-Bear uses multiple specialized AI agents that debate both bullish and bearish perspectives, followed by a neutral judge agent that delivers a final verdict with confidence scores.

> **Disclaimer:** Bull-v-Bear does not provide financial advice. All outputs are generated for educational and informational purposes only.

---

## 🚀 Built With

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-000000?style=for-the-badge&logo=vercel&logoColor=white)

![Tavily](https://img.shields.io/badge/Tavily-1A1A2E?style=for-the-badge)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

**Full-Stack Development • Retrieval-Augmented Generation (RAG) • Multi-Agent AI • Vector Search**

</div>

---

## Tech Stack

| Layer | Technologies | Role in the project |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion | Server/client components, app-shell layout, animated UI |
| **Data fetching & state** | TanStack Query (React Query) | Caching, request deduplication, and cache invalidation for all reads/mutations |
| **Backend** | Next.js Route Handlers & Server Actions, Node.js | API endpoints, auth, and server-side orchestration |
| **Database & ORM** | PostgreSQL (Supabase), Prisma, pgvector | Relational schema, migrations, and vector storage for semantic search |
| **AI / RAG** | OpenAI (embeddings + GPT-4o), Vercel AI SDK, Tavily, LangChain text splitters, Zod | Embeddings, vector retrieval, tool-calling research agent, multi-agent Bull/Bear/Judge debate with structured output |
| **Documents** | unpdf, mammoth, Tesseract.js (OCR) | PDF/DOCX text extraction with an OCR fallback for scanned files |
| **Auth & Storage** | Supabase Auth, Supabase Storage (private buckets + signed URLs + RLS) | Verified authentication and per-user document storage |
| **Market data** | Alpha Vantage (via a cached server-side proxy) | Live quotes & movers with rate-limit handling and stale-on-error fallback |
| **Testing & Tooling** | Vitest, ESLint, GitHub Actions (CI) | Unit tests for pure logic, linting, and continuous integration |

### Concepts demonstrated
- **Retrieval-Augmented Generation (RAG)** — chunking, embeddings, and pgvector cosine similarity (HNSW index)
- **Multi-agent LLM orchestration** — tool-calling research → parallel Bull/Bear analysts → Judge verdict
- **Functional core, imperative shell** — pure logic extracted into `lib/` and unit-tested; I/O kept in thin handlers
- **API resilience** — server-side caching proxy, rate-limit detection, and graceful degradation
- **Security by default** — server-verified auth, row-level security, signed URLs, and server-only API keys

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nancy-kataria/Bull-v-Bear.git
   cd Bull-v-Bear
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory with the following variables:
   ```
   DATABASE_URL=your_postgres_connection_string
   OPENAI_API_KEY=your_openai_key
   GEMINI_API_KEY=your_google_genai_key
   TAVILY_API_KEY=your_tavily_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database:**
   ```bash
   npx prisma migrate dev
   ```

### Running the Project

**Development mode:**
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

**Build for production:**
```bash
npm run build
npm start
```

### Testing

Run tests with:
```bash
npm run test       # Run tests in watch mode
```

### Linting

Check code quality:
```bash
npm run lint
```

---

## Contributing

We welcome contributions to Bull-v-Bear! Here's how you can help:

### Getting Started with Development

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write tests for new features
   - Ensure all tests pass: `npm run test:run`
   - Check linting: `npm run lint`

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Clear description of your changes"
   ```

4. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request:**
   - Provide a clear description of the changes
   - Reference any related issues
   - Ensure CI/CD checks pass

### Reporting Issues

- Check existing issues before creating a new one
- Provide clear steps to reproduce
- Include relevant error messages and logs
- Specify your environment (OS, Node version, etc.)

---
