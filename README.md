# GoForDeutsch

An AI-powered German learning platform where users upload their study materials and receive personalized mind maps and quizzes. Designed for A1–A2 learners (especially middle school students).

---

## What is this?

GoForDeutsch lets you:
- Register with an auto-generated quirky German username (e.g. *KatzeSpringt*, *ApfelRollt*)
- Log in securely (bcrypt-hashed passwords, JWT tokens)
- Access a clean dashboard — ready for AI features in Phase 2

---


## Getting Started

### Prerequisites

- Python 3.10+ with `venv`
- Node.js 18+

---

### 1 — Start the Backend

```bash
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the FastAPI server
python app.py
```

The API will be available at **http://127.0.0.1:8000**
Interactive docs: **http://127.0.0.1:8000/docs**

---

### 2 — Start the Frontend

Open a **new terminal** (keep the backend running):

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
