
# DSA Interview Prep Dashboard

A high-performance, full-stack application designed to track Data Structures and Algorithms (DSA) preparation. It features curated problem sheets, interactive physics-based analytics, and an AI-powered assistant for targeted, company-specific interview preparation.

## 🚀 Live Demo
* **Frontend:** [Deployed on Vercel] *(https://dsa-tracker-sage.vercel.app/)*
* **Backend:** [Deployed on Render] *(https://interview-prep-dashboard.onrender.com)*

## 📸 Screenshots

### The Dashboard & Progress Tracking
![Dashboard View](./docs/Screenshot%202026-05-10%20173051.png)

### Curated Practice Sheets (Blind 75, NeetCode 150)
![Practice Sheets](./docs/Screenshot%202026-05-10%20145533.png)

### Interactive D3.js Topic Visualization & Problem Table
![Interactive Bubble Chart](./docs/Screenshot%202026-05-10%20145603.png)
![Problem Filters](./docs/Screenshot%202026-05-10%20145550.png)

## ✨ Core Features

* **Curated Problem Sheets:** Integrated tracking for industry-standard lists including Blind 75, NeetCode 150, and Striver's SDE Sheet.
* **Interactive Data Visualization:** Custom D3.js physics engine rendering a reactive, collision-detecting bubble chart for topic distribution.
* **AI Interview Assistant:** Powered by **Google Gemini 2.5 Flash**, generating dynamic, structured LeetCode suggestions based on specific companies and engineering roles.
* **Smart Problem Filtering:** Auto-tagging classification engine that groups problems by topic (Arrays, DP, Graphs) into a LeetCode-style accordion interface.
* **Robust Authentication:** Secure JWT-based user sessions with automatic token expiration handling and route protection.
* **Production-Grade CI/CD:** GitHub Actions pipeline configured with dependency caching and live PostgreSQL service testing.
* **Automated LeetCode Synchronization:** Custom GraphQL extraction engine that bypasses the lack of an official API to silently pull, normalize, and sync a user's recent accepted submissions directly into the PostgreSQL database.

## 🛠️ Tech Stack

**Frontend (Client)**
* **Framework:** React 19 + Vite
* **Styling:** Tailwind CSS 4 (Glassmorphism & Dark Mode UI)
* **Routing:** React Router v7
* **Data Visualization:** D3.js (Physics simulations), Recharts

**Backend (API & AI)**
* **Framework:** FastAPI (Python)
* **Database:** PostgreSQL (Hosted on Neon)
* **ORM & Migrations:** SQLAlchemy + Alembic
* **Authentication:** Passlib (Bcrypt) + PyJWT
* **AI Integration:** Google Generative AI (`gemini-2.5-flash`)
* **Data Extraction:** Direct GraphQL API Querying & Regex-based Title Normalization

## 💻 Local Development Setup

### Prerequisites
* Node.js (v20+)
* Python (3.12+)
* PostgreSQL installed locally (or a Neon cloud database URL)

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend

```

Create a virtual environment and install dependencies:

```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt

```

Set up your environment variables by creating a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GEMINI_API_KEY=your_google_gemini_api_key

```

Run database migrations to build the schema:

```bash
alembic upgrade head

```

Seed the database with the standard problem sheets:

```bash
python seed.py

```

Start the FastAPI server:

```bash
uvicorn main:app --reload

```

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory (project root):

```bash
npm install

```

Start the Vite development server:

```bash
npm run dev

```

## 🧪 Testing

The backend features a fully integrated test suite verifying authentication, core business logic, and API route protection.

```bash
cd backend
python -m pytest

```

## 🚢 Deployment Architecture

* **Frontend:** Deployed via Vercel. CI/CD automatically triggers builds on pushes to the `main` branch.
* **Backend:** Deployed via Render as a Web Service.
* **Database:** Neon Serverless Postgres.

## 📄 License

This project is open-source and available under the [MIT License](https://www.google.com/search?q=LICENSE).

