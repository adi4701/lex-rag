# LexRAG

LexRAG is an enterprise legal document analysis platform powered by Retrieval-Augmented Generation (RAG). It is based on a peer-reviewed IEEE research paper and uses a 100% free-tier tech stack.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Vercel
- **Backend**: FastAPI, Render.com / HuggingFace Spaces
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Vector DB**: ChromaDB
- **Embeddings**: sentence-transformers (`BAAI/bge-small-en-v1.5`)
- **LLM**: Groq (`llama-3.1-70b-versatile`)

## Setup Instructions

### 1. Supabase Setup
1. Create a free project on [Supabase](https://supabase.com).
2. Run the SQL script located in `supabase/schema.sql` in the SQL Editor.
3. Create a new Storage bucket named `legal-documents` and set it to private.

### 2. Backend Setup
1. Get a free API key from [Groq](https://groq.com).
2. Navigate to the `backend` directory.
3. Install dependencies: `pip install -r requirements.txt`
4. Create a `.env` file based on `backend/config.py` and fill in the keys.
5. Run the server: `uvicorn main:app --reload --port 8000`

### 3. Frontend Setup
1. Navigate to the root directory.
2. Install dependencies: `npm install`
3. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Run the development server: `npm run dev`

## Deployment
- **Frontend**: Push to GitHub and import to Vercel.
- **Backend**: Push to GitHub and deploy as a Web Service on Render.com using `uvicorn main:app --host 0.0.0.0 --port $PORT`.
