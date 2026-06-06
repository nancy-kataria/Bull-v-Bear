# Bull-v-Bear

**Bull-v-Bear** is an AI-powered investment research assistant that helps users organize stock-specific notes and receive balanced, evidence-based insights before making investment decisions.

The platform is designed for educational and research purposes. Instead of relying on a single AI opinion, Bull-v-Bear uses multiple specialized AI agents that debate both bullish and bearish perspectives, followed by a neutral judge agent that delivers a final verdict with confidence scores.

> **Disclaimer:** Bull-v-Bear does not provide financial advice. All outputs are generated for educational and informational purposes only.

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
   GOOGLE_GENAI_API_KEY=your_google_genai_key
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
