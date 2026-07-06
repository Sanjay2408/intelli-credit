# IntelliCredit — AI-Powered Corporate Credit Appraisal Engine

> Rebuilt end-to-end from the IIT Hyderabad hackathon project ([original](https://github.com/Priyanshu-Madhup/intelli_credit)) — now supporting **every document format**, with an Apple-inspired UI, and deployable to a single serverless host.

## What it does

Upload a company's financial documents → the AI pipeline classifies, chunks and indexes them → get an explainable credit decision: risk score (0–100), approve/conditional/reject, recommended loan amount, rate & tenor, risk alerts, SWOT, GST reconciliation, live web research, and a bank-grade Credit Appraisal Memo (CAM) exportable as PDF or DOCX.

## Key improvements over the original

| | Original | This version |
|---|---|---|
| File formats | PDF only (Excel partially) | **PDF, XLSX, XLS, CSV, TSV, DOCX, TXT, MD, JSON, PNG/JPG/WEBP (vision OCR)** |
| Retrieval | FAISS + PyTorch embeddings (~2 GB, can't deploy serverless) | **Stateless BM25** — pure Python, deploys anywhere, survives cold starts |
| Web research | Serper API (extra paid key) | **Groq compound model with built-in web search** — one key for everything |
| Hosting | Not hosted | **Single Vercel deployment** (React + FastAPI serverless) |
| UI | Basic Tailwind | **Apple design language** — SF type, frosted nav, rounded cards |
| State | Server-side index (single user) | Client-held document chunks — every visitor gets an isolated session |

## Architecture

```
React 18 (Vite + Tailwind)  ──►  FastAPI (Vercel Python function)
 Dashboard · New Assessment        /api/documents/process  (any format → chunks)
 AI Analysis · Recommendation      /api/query              (BM25 RAG Q&A)
 CAM Report · Research             /api/assess             (structured credit decision)
 SWOT · GST · Doc Q&A              /api/swot · /api/gst/validate · /api/research
                                   /api/cam/generate · /api/cam/docx
                                          │
                                          ▼
                                   Groq — llama-3.3-70b (analysis)
                                          llama-4-scout (image OCR)
                                          compound-mini (live web search)
```

Documents are parsed and chunked server-side, but the chunks are stored **in the browser** (localStorage) and sent with each analysis request. Retrieval is per-request BM25 — no vector DB, no state, no cold-start data loss.

## Run locally

```bash
# 1. Backend
pip install -r requirements.txt uvicorn
cp .env.example .env        # put your GROQ_API_KEY in .env
python -m uvicorn api.index:app --port 8000

# 2. Frontend (proxies /api → :8000)
npm install
npm run dev                 # http://localhost:5173
```

## Deploy (Vercel)

Push this repo, import into Vercel, set env var `GROQ_API_KEY`. That's it — the frontend is a static Vite build and `api/index.py` becomes a serverless function automatically.

## Environment variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | **Required.** Get one free at [console.groq.com](https://console.groq.com) |
| `GROQ_MODEL` | Analysis model (default `llama-3.3-70b-versatile`) |
| `GROQ_VISION_MODEL` | OCR model for images (default `meta-llama/llama-4-scout-17b-16e-instruct`) |
| `GROQ_RESEARCH_MODEL` | Web-search model (default `groq/compound-mini`) |

API keys are **never** committed — `.env` is gitignored; production keys live in Vercel project env vars.

## Credits

Originally built at the IIT Hyderabad *Intelli-Credit* hackathon by the team behind [Priyanshu-Madhup/intelli_credit](https://github.com/Priyanshu-Madhup/intelli_credit). This repository is a ground-up rebuild focused on universal file support, deployability, and design.
