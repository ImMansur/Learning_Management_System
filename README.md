
# 🎓 AI-Powered Learning Management System (LMS)

> A full-stack educational platform that leverages Azure AI services to automatically transcribe lecture videos, generate summaries, create quizzes, and provide an intelligent RAG-based chatbot for course content.

![Project Status](https://img.shields.io/badge/Status-Active_Development-green)
![Tech Stack](https://img.shields.io/badge/Stack-FastAPI_React_Firebase_Azure-blue)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-React_18-blue)

## 📖 Overview

This LMS bridges the gap between video hosting and active learning. When a trainer uploads a lecture video, the system automatically:

1. **Stores** the video securely in Azure Blob Storage.
2. **Transcribes** the audio using Azure Speech Services (REST API v3.1).
3. **Summarizes** the transcript into structured study notes using Azure OpenAI (GPT-4o).
4. **Generates** 7 multiple-choice quiz questions from the content.
5. **Vectorizes** the transcript into Pinecone for RAG-powered Q&A.
6. **Updates** the learner dashboard in real-time via Firebase Firestore.

## 🚀 Key Features

### AI-Powered Learning
- **Automated AI Pipeline** — Video upload triggers a 5-step background pipeline: transcription → summarization → quiz generation → vectorization → Firestore update.
- **RAG Chatbot** — Learners can ask questions about course content and receive factual, context-aware answers powered by Pinecone vector search + Azure OpenAI.
- **Auto-Generated Quizzes** — 7 multiple-choice questions per module with explanations, auto-graded on submission.
- **Text-to-Speech** — AI summaries can be streamed as audio in 8 languages (English, Hindi, Spanish, French, German, Japanese, Arabic, Chinese).

### Platform Features
- **Role-Based Access** — Three distinct portals: **Learner**, **Trainer**, and **Admin**, each with dedicated dashboards, sidebars, and protected routes.
- **Secure Video Streaming** — Time-limited SAS tokens (24h) ensure videos cannot be downloaded or shared publicly.
- **Course Management** — Trainers create courses with multiple video modules; learners enroll, track progress, and earn certificates.
- **Email Notifications** — Enrollment confirmations, course completion emails, and auto-generated PNG certificates.
- **Community Posts** — Course-scoped discussion boards for learners and trainers.
- **Analytics Dashboards** — Trainer and admin analytics with charts (Recharts).
- **Modern Auth** — Email/password and Google Sign-In via Firebase Authentication.

---

## 🛠️ Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | FastAPI (Python) |
| Database | Cloud Firestore (NoSQL) |
| AI Services | Azure Speech, Azure OpenAI (GPT-4o), Azure Translator |
| Vector DB | Pinecone |
| Storage | Azure Blob Storage |
| Auth | Firebase Admin SDK (ID token verification) |
| Email | Gmail SMTP with HTML templates |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 18 + TypeScript (Vite + SWC) |
| UI Library | shadcn/ui (30+ Radix UI components) |
| Styling | Tailwind CSS |
| State | React Context + TanStack React Query |
| Auth | Firebase SDK (Auth + Firestore) |
| Charts | Recharts |
| Validation | Zod |

---

## 📂 Project Structure

```
📦 Learning_Management_System
├── 📂 backend/
│   ├── 📂 ai_features/          # AI pipeline & endpoints
│   │   ├── router.py            # /ai routes (chat, TTS, modules)
│   │   ├── services.py          # 5-step AI pipeline, RAG chat
│   │   ├── schemas.py           # Request/response models
│   │   ├── 📂 ai_quiz/
│   │   │   ├── quiz_generator.py  # Quiz generation via OpenAI
│   │   │   └── prompts.py        # System prompts for quiz format
│   │   └── 📂 tts/
│   │       └── tts.py           # Text-to-speech (8 languages)
│   ├── 📂 core/                 # Shared infrastructure
│   │   ├── config.py            # Environment variable loading
│   │   ├── database.py          # Firestore initialization
│   │   ├── security.py          # Firebase token authentication
│   │   └── email_service.py     # SMTP emails & certificate generation
│   ├── 📂 courses/              # Course management endpoints
│   │   ├── router.py            # /courses routes (CRUD, enroll, progress)
│   │   ├── services.py          # Blob upload, SAS URL generation
│   │   └── schemas.py           # Course/module data models
│   ├── main.py                  # FastAPI app entry point
│   └── requirements.txt
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── App.tsx              # Route definitions (33 pages)
│   │   ├── 📂 components/       # Layouts, sidebars, shared components
│   │   │   └── 📂 ui/           # 30+ shadcn/ui components
│   │   ├── 📂 context/          # UserContext (auth state)
│   │   ├── 📂 pages/            # All page components
│   │   ├── 📂 services/         # API service layer
│   │   └── 📂 hooks/            # Custom React hooks
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** v18+ and npm (or Bun)
- **Python** 3.9+
- **Azure** account with: Speech Services, OpenAI, Blob Storage, Translator
- **Firebase** project with Authentication & Firestore enabled
- **Pinecone** account with an index created

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configuration:**

1. Create a `.env` file in `backend/` with the following keys:

    ```env
    # Azure Speech
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

    # Pinecone
    PINECONE_API_KEY=your_pinecone_api_key
    PINECONE_INDEX_NAME=your_index_name

    # Email (Gmail SMTP)
    SMTP_EMAIL=your_email@gmail.com
    SMTP_PASSWORD=your_app_password
    ```

2. Place your **Firebase Admin SDK** JSON file at `backend/core/firebase_config.json`.

> ⚠️ **Never commit `.env` or `firebase_config.json` to Git.** These are listed in `.gitignore`.

**Run the Server:**

```bash
uvicorn main:app --reload
```

Server starts at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

**Configuration:**

Update `src/firebase.ts` with your Firebase client config (API Key, Auth Domain, Project ID, etc.).

**Run the Client:**

```bash
npm run dev
```

Client starts at `http://localhost:8080`

---

## 🎮 Usage Guide

### Learner Flow
1. **Sign up / Log in** with email or Google account.
2. **Browse** the course catalog and enroll in a course.
3. **Watch** video lectures with AI-generated summaries alongside.
4. **Take quizzes** — auto-generated from lecture content, 7 questions per module.
5. **Ask the AI chatbot** questions about the course material (RAG-powered).
6. **Listen** to summaries in 8 languages via text-to-speech.
7. **Track progress** and earn a certificate upon course completion.

### Trainer Flow
1. **Create** a new course with title, category, and description.
2. **Upload** video modules — the AI pipeline processes them automatically.
3. **Monitor** student progress and quiz results.
4. **Engage** with learners through community posts.

### Admin Flow
1. **Manage** users, courses, and trainers.
2. **View** platform-wide analytics.
3. **Monitor** AI service usage.

---

## 🗄️ Firestore Schema

| Collection | Description |
|-----------|-------------|
| `users/{uid}` | User profiles (email, name, role, enrollments) |
| `courses/{course_id}` | Course metadata (title, description, category, instructor) |
| `courses/{course_id}/modules/{module_id}` | Video modules (title, video URL, order, status) |
| `ai_assets/{module_id}` | AI-generated content (transcript, summary, quiz questions) |
| `quiz_results/{doc_id}` | Quiz attempts (student, course, score, pass/fail) |
| `activities/{doc_id}` | Activity log (enrollments, completions, quiz attempts) |
| `community_posts/{post_id}` | Discussion posts per course |

---

## 🔌 API Endpoints

### Courses (`/courses`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/courses/` | Create a new course |
| GET | `/courses/my-courses` | Get trainer's courses |
| GET | `/courses/catalog` | Browse all published courses |
| POST | `/{course_id}/modules` | Upload a video module |
| POST | `/{course_id}/enroll` | Enroll in a course |
| GET | `/{course_id}/modules` | Get course modules |
| POST | `/{course_id}/modules/{module_id}/complete` | Mark module complete |
| POST | `/{course_id}/modules/{module_id}/quiz-result` | Submit quiz result |
| GET | `/{course_id}/quiz-results` | Get quiz results |
| GET | `/courses/my-activities` | Get student activities |

### AI Features (`/ai`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/chat` | RAG chatbot (course_id + question) |
| GET | `/ai/tts/stream` | Text-to-speech audio stream |
| GET | `/ai/module/{module_id}` | Get AI summary & quiz data |

---

## 🛡️ Security

- **Authentication:** Firebase ID tokens validated via `Authorization: Bearer` header on every request.
- **Video Access:** Private blob storage with time-limited SAS URLs (24h expiry).
- **Role Enforcement:** Protected routes on both frontend and backend ensure Learner/Trainer/Admin boundaries.
- **Sensitive Files:** `.env`, `firebase_config.json`, and Firebase client config are excluded from version control via `.gitignore`.

---

## 📝 License

This project is open-source and available under the MIT License.