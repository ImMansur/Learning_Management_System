# 🔧 LMS Backend — FastAPI + Azure AI

> The backend API powering the AI-driven Learning Management System. Handles authentication, course management, and a 5-step AI pipeline for video processing.

## 🏗️ Architecture

```
backend/
├── main.py                    # FastAPI app entry, CORS, route mounting
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (DO NOT COMMIT)
├── ai_features/               # AI pipeline & endpoints
│   ├── router.py              # /ai routes
│   ├── services.py            # Transcription, summarization, vectorization, RAG
│   ├── schemas.py             # Pydantic models
│   ├── ai_quiz/
│   │   ├── quiz_generator.py  # OpenAI-powered quiz generation
│   │   └── prompts.py         # System prompts for quiz format
│   └── tts/
│       └── tts.py             # Text-to-speech in 8 languages
├── core/                      # Shared infrastructure
│   ├── config.py              # Settings from environment variables
│   ├── database.py            # Firebase Admin SDK + Firestore init
│   ├── security.py            # Bearer token verification
│   ├── email_service.py       # SMTP emails + certificate generation
│   └── firebase_config.json   # Service account key (DO NOT COMMIT)
└── courses/                   # Course management
    ├── router.py              # /courses routes
    ├── services.py            # Blob upload, SAS token generation
    └── schemas.py             # Course/module models
```

## ⚙️ Setup

### 1. Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in `backend/`:

```env
# Azure Speech Services
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_ENDPOINT=your_speech_endpoint
AZURE_SPEECH_REGION=your_region

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=your_openai_endpoint
AZURE_OPENAI_API_KEY=your_openai_api_key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_DEPLOYMENT_NAME_EMBEDDING=your_embedding_deployment

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_URL=https://youraccount.blob.core.windows.net
BLOB_CONTAINER_NAME=videos

# Pinecone Vector DB
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Email (Gmail SMTP)
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 4. Firebase Admin SDK

Place your Firebase service account JSON file at `core/firebase_config.json`.

Download it from Firebase Console → Project Settings → Service Accounts → Generate New Private Key.

> ⚠️ **Both `.env` and `firebase_config.json` contain real secrets — never commit them.**

### 5. Run the Server

```bash
uvicorn main:app --reload
```

Server runs at **http://localhost:8000**. API docs available at `/docs` (Swagger UI).

---

## 🤖 AI Pipeline

When a trainer uploads a video module, `services.py` runs a 5-step background pipeline:

```
Video Upload
    │
    ▼
┌──────────────────────┐
│  1. Transcription     │  Azure Speech REST API v3.1
│     (audio → text)    │  Polls until job completes
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  2. Transcript Upload │  Saved to Azure Blob Storage
│     (blob storage)    │  transcripts/{course_id}/{module_id}.txt
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  3. Summarization     │  Azure OpenAI GPT-4o
│     (text → markdown) │  Structured study notes
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  4. Quiz Generation   │  Azure OpenAI GPT-4o
│     (text → 7 MCQs)  │  JSON with options & explanations
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  5. Vectorization     │  Azure Embeddings → Pinecone
│     (text → vectors)  │  Chunked (1000 chars, 200 overlap)
└──────────────────────┘
           ▼
    Firestore Updated
    (ai_assets/{module_id})
```

### RAG Chat

The `/ai/chat` endpoint:
1. Embeds the user's question via Azure OpenAI embedding model.
2. Queries Pinecone for the top-5 matching chunks (min score 0.70) within the course namespace.
3. Sends retrieved context + question to GPT-4o for a factual answer.

### Text-to-Speech

The `/ai/tts/stream` endpoint:
1. Fetches the AI summary for a module from Firestore.
2. Optionally translates it via Azure Translator API.
3. Synthesizes speech using Azure neural voices.

**Supported Languages:**

| Code | Language | Voice |
|------|----------|-------|
| en | English | en-US (default) |
| hi | Hindi | hi-IN |
| es | Spanish | es-ES |
| fr | French | fr-FR |
| de | German | de-DE |
| ja | Japanese | ja-JP |
| ar | Arabic | ar-SA |
| zh | Chinese | zh-CN |

---

## 🔌 API Reference

### Health Check

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/` | `{"status": "LMS Backend is Running"}` |

### Courses (`/courses`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/courses/` | Trainer | Create a new course |
| GET | `/courses/my-courses` | Trainer | List trainer's courses |
| GET | `/courses/catalog` | Any | Browse all published courses |
| POST | `/{course_id}/modules` | Trainer | Upload video module (triggers AI pipeline) |
| POST | `/{course_id}/enroll` | Learner | Enroll in a course |
| GET | `/{course_id}/modules` | Any | Get ordered modules |
| POST | `/{course_id}/modules/{module_id}/complete` | Learner | Mark module complete |
| POST | `/{course_id}/modules/{module_id}/quiz-result` | Learner | Submit quiz results |
| GET | `/{course_id}/quiz-results` | Any | Get all quiz results |
| GET | `/courses/my-activities` | Learner | Get recent activities |

### AI Features (`/ai`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ai/chat` | Any | RAG chatbot (send course_id + question) |
| GET | `/ai/tts/stream?module_id=...&lang=en` | Any | Stream TTS audio |
| GET | `/ai/module/{module_id}` | Any | Get summary + quiz data |

---

## 🔐 Authentication

All endpoints (except health check) require a valid Firebase ID token:

```
Authorization: Bearer <firebase_id_token>
```

The `security.py` module:
- Verifies the token using Firebase Admin SDK.
- Extracts `uid`, `email`, `name`, and `role` from the decoded token.
- Returns a 401 for expired or invalid tokens.

---

## 📧 Email & Certificates

`email_service.py` handles:

- **Enrollment confirmation** — Sent when a learner enrolls in a course.
- **Completion email** — Sent when all modules are completed; includes a PNG certificate attachment.
- **Trainer updates** — Notifications for trainers about course activity.

Certificates are generated as PNG images using Pillow with the learner's name, course title, completion date, instructor name, and a unique certificate ID.

---

## 🗄️ Firestore Collections

| Collection | Fields |
|-----------|--------|
| `users/{uid}` | email, displayName, role, enrollments |
| `courses/{course_id}` | title, description, category, instructor_id, is_published |
| `courses/.../modules/{module_id}` | title, video_blob_url, order_index, status, created_at |
| `ai_assets/{module_id}` | transcript_text, summary_markdown, questions, status, is_vectorized |
| `quiz_results/{doc_id}` | student_id, course_id, module_id, score, total, passed, attempted_at |
| `activities/{doc_id}` | student_id, type, course_id, module_id, detail, created_at |
| `community_posts/{post_id}` | course_id, subject, message, creator_id |

---

## 📦 Dependencies

```
fastapi              # Web framework
uvicorn              # ASGI server
python-dotenv        # Environment variable loading
firebase-admin       # Firebase Auth + Firestore
azure-identity       # Azure credential management
azure-storage-blob   # Blob Storage SDK
azure-cognitiveservices-speech  # Speech Services SDK
openai               # Azure OpenAI client
pinecone             # Vector database
langchain-text-splitters  # Text chunking for embeddings
python-multipart     # File upload handling
requests             # HTTP client
Pillow               # Image generation (certificates)
```
