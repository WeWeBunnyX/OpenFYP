# OpenFYP - Final Year Project Management & Evaluation System

![License](https://img.shields.io/badge/License-GPLv2-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0-brightgreen.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)

> A comprehensive web-based platform for managing Final Year Projects (FYP), from student registration through final viva evaluation. Built with modern technologies and containerized for easy deployment.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Docker Deployment](#docker-deployment)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [User Roles & Permissions](#user-roles--permissions)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

## ✨ Features

### Core Functionality
- **FYP Registration**: Students register projects with supervisor assignment
- **Registration Approval Workflow**: Multi-stage verification (Student → Supervisor → Coordinator)
- **Progress Tracking**: Students submit 12 progress logs throughout the academic year
- **Proposal Evaluation**: Supervisors evaluate and provide feedback on proposals
- **Interim Evaluations**: Two-stage interim evaluation (Stage 1 & 2) with independent committee member marks
- **Final Evaluation & Viva**: Complete committee assignment, rubric configuration, weighted average calculation, and results publication
- **Scheduling Management**: Defense and evaluation schedule creation and management
- **Role-Based Access Control**: 4 distinct user roles with specific permissions

### Technical Features
- ✅ **Light/Dark Theme**: Persistent theme preference with localStorage
- ✅ **Responsive Design**: Mobile and desktop friendly UI
- ✅ **Real-time Updates**: Instant feedback and data synchronization
- ✅ **JSON Data Flexibility**: Nested data storage (committees, rubrics, marks)
- ✅ **File Upload Support**: Progress log attachments and proposal documents
- ✅ **Automatic Calculation**: Weighted average calculation from committee marks
- ✅ **Docker Containerization**: Complete containerized stack ready for deployment

## 🏗️ Technology Stack

### Frontend
- **React** 19.2.0 - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality accessible components
- **Radix UI** - Headless component primitives
- **React Hook Form** - Efficient form management
- **Lucide Icons** - Beautiful icon library

### Backend
- **FastAPI** - Modern async Python web framework
- **SQLModel** - Type-safe ORM (SQLAlchemy + Pydantic)
- **Pydantic** - Data validation using Python type hints
- **PostgreSQL** - Relational database (production)
- **SQLite** - Lightweight database (development)
- **Uvicorn** - ASGI server

### DevOps & Infrastructure
- **Docker** - Container runtime
- **Docker Compose** - Multi-container orchestration
- **Git** - Version control

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│              Running on Port 5173                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Requests
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (FastAPI)                               │
│              Running on Port 8000                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes: Registration, Scheduling, Progress, etc.   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL Queries
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                           │
│              Running on Port 5432                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  11 Core Tables + JSON Columns                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**3-Tier Architecture:**
- **Presentation Tier**: React SPA with Tailwind & Shadcn/ui
- **Application Tier**: FastAPI RESTful API with async operations
- **Data Tier**: PostgreSQL with SQLModel ORM

## 📦 Prerequisites

### Option 1: Docker (Recommended - No Manual Setup)
- Docker Desktop / Docker Engine
- Docker Compose 2.0+

### Option 2: Local Development
- Node.js 20+ LTS
- Python 3.11+
- PostgreSQL 15+ (or use SQLite for dev)

## 🚀 Installation

### Quick Start with Docker (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/WeWeBunnyX/OpenFYP.git
cd OpenFYP
```

2. **Build and start all services**
```bash
docker-compose up --build
```

3. **Access the application**
```
Frontend: http://localhost:5173
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
Database: localhost:5433
```

**That's it!** ✅ No manual setup needed. Docker handles everything.

### Local Development Setup

#### Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev
# Accessible at http://localhost:5173
```

#### Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Navigate to backend
cd backend

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
# Accessible at http://localhost:8000
```

#### Database Setup (Development)
```bash
# PostgreSQL (if using Docker for DB only)
docker run -d \
  -e POSTGRES_USER=openfyp \
  -e POSTGRES_PASSWORD=example \
  -e POSTGRES_DB=fypdb \
  -p 5433:5432 \
  postgres:15

# Or use SQLite (included, no setup needed)
```

## ⚙️ Configuration

### Environment Variables

#### Backend (`.env` or environment setup)
```bash
DATABASE_URL=postgresql+psycopg2://openfyp:example@localhost:5433/fypdb
# Or for SQLite:
DATABASE_URL=sqlite:///./dev.db

PORT=8000
APP_TITLE=OpenFYP
DEBUG=True
```

#### Frontend (Vite)
```bash
VITE_API_URL=http://localhost:8000  # Local development
# Docker: http://backend:8000 (internal)
```

### Docker Compose Configuration

Edit `docker-compose.yml` to customize:
- Port mappings
- Database credentials
- Environment variables
- Volume mounts

## 📖 Usage

### Login Credentials (Test Account)

| Role | Email | Password |
|------|-------|----------|
| Student | student@example.com | password |
| Supervisor | supervisor@example.com | password |
| Coordinator | coordinator@example.com | password |
| Committee | committee@example.com | password |

### User Role Workflows

#### 👨‍🎓 Student
1. Register FYP project
2. Upload proposal document
3. Submit 12 progress logs
4. View evaluations and results

#### 👨‍🏫 Supervisor
1. Verify student registrations
2. Evaluate proposals
3. Review and grade progress
4. Submit interim and final marks

#### 📋 Coordinator
1. Approve/reject registrations
2. Create defense schedules
3. Assign committee members
4. Manage grading rubrics
5. Approve marks and publish results

#### 👥 Committee Member
1. View assigned evaluations
2. Submit interim marks (Stage 1 & 2)
3. Submit final viva marks with feedback

## 🐳 Docker Deployment

### What Docker Provides

✅ **Complete Isolation**: Each service in its own container
✅ **Auto-management**: All dependencies handled
✅ **Easy Scaling**: Add more backend instances if needed
✅ **Database Persistence**: Data survives container restarts
✅ **Hot Reload**: Code changes reflect instantly (dev mode)
✅ **No Local Setup**: Run production-like environment anywhere

### Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove everything including volumes
docker-compose down -v

# Restart services
docker-compose restart

# Rebuild specific service
docker-compose build --no-cache backend
```

### Production Deployment

For production, consider:

1. **Kubernetes**: Use Helm charts for complex deployments
2. **AWS ECS**: Elastic Container Service for managed containers
3. **Azure Container Instances**: Serverless container deployment
4. **DigitalOcean App Platform**: Simple container hosting
5. **Docker Swarm**: Simple orchestration on VMs

See `OpenFYP_Software_Design_Specification.docx` for detailed deployment scenarios.

## 📚 API Documentation

### Interactive API Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

#### Authentication
```
POST /login
  Request: { email, password }
  Response: { user: { email, name, role } }
```

#### Registration
```
POST /registrations - Create registration
GET /registrations - List registrations
PATCH /registrations/{id}/verify - Supervisor verify
PATCH /registrations/{id}/approve - Coordinator approve
```

#### Scheduling
```
POST /schedule - Create defense schedule
GET /schedules - List schedules
DELETE /schedules/{id} - Delete schedule
```

#### Progress
```
POST /api/progress/logs - Upload progress log
GET /api/progress/logs - List student progress
GET /api/progress/logs/{id}/download - Download file
```

#### Final Evaluation
```
POST /api/final-evaluation - Create evaluation
GET /api/final-evaluation/coordinator - List all
POST /api/final-evaluation/{id}/committee - Add committee
POST /api/final-evaluation/{id}/committee/{member_id}/marks - Submit marks
PATCH /api/final-evaluation/{id}/approve - Approve marks
POST /api/final-evaluation/{id}/publish - Publish results
```

For complete API specification, see the interactive docs at `/docs`

## 💾 Database Schema

### Core Tables (11 Total)

| Table | Purpose |
|-------|---------|
| **User** | Authentication & user profiles |
| **Registration** | FYP registration tracking |
| **Attachment** | File uploads for registrations |
| **Notification** | System notifications |
| **Scheduling** | Defense schedule management |
| **InterimScheduling** | Interim evaluation schedules |
| **ProposalEvaluation** | Proposal evaluation records |
| **ProgressLog** | Student progress submissions (12 per student) |
| **ProgressGrading** | Supervisor progress grading |
| **InterimEvaluationMarks** | Two-stage interim marks |
| **FinalEvaluationViva** | Final viva with committee marks |

### Key Features
- JSON columns for nested data (committees, rubrics, marks)
- Automatic timestamps (created_at, updated_at)
- Role-based data filtering
- Cascading operations (approval creates final eval)

## 🔐 User Roles & Permissions

### 👨‍🎓 Student
- ✓ Register FYP
- ✓ Submit 12 progress logs
- ✓ View evaluations (read-only)
- ✓ Access settings (theme, profile)

### 👨‍🏫 Supervisor
- ✓ Verify registrations
- ✓ Evaluate proposals
- ✓ Grade progress (12 submissions)
- ✓ Submit interim marks (Stage 1, 2)
- ✓ View supervised students' results

### 📋 Coordinator
- ✓ Approve/reject registrations
- ✓ Create schedules (defense, interim)
- ✓ Assign committee members
- ✓ Configure grading rubric
- ✓ Approve and publish marks
- ✓ View system statistics

### 👥 Committee Member
- ✓ Submit interim marks
- ✓ Submit final viva marks
- ✓ Write-once policy (can't modify)

## 📁 Project Structure

```
OpenFYP/
├── src/                                 # Frontend (React)
│   ├── components/                     # UI Components
│   │   ├── Sidebar.tsx                # Navigation
│   │   ├── DashboardHome.tsx           # Welcome page
│   │   └── ui/                         # Shadcn/ui components
│   ├── dashboards/                     # Role-based dashboards
│   │   ├── StudentDashboard.tsx
│   │   ├── CoordinatorDashboard.tsx
│   │   ├── SupervisorDashboard.tsx
│   │   └── CommitteeDashboard.tsx
│   ├── features/                       # Feature modules
│   │   ├── registration/
│   │   ├── Scheduling/
│   │   ├── ProgressTracking/
│   │   ├── FinalEvaluationandVivas/
│   │   ├── Interim_Evaluation/
│   │   └── ...
│   ├── contexts/                       # React Context (Auth)
│   ├── App.tsx                         # Main app component
│   └── main.tsx                        # Entry point
│
├── backend/                            # Backend (FastAPI)
│   ├── app/
│   │   ├── main.py                    # FastAPI app
│   │   ├── models.py                  # SQLModel definitions
│   │   ├── routes_registrations.py    # Auth & registration
│   │   ├── routes_scheduling_evaluation.py
│   │   ├── routes_progress.py
│   │   ├── routes_interim_marks.py
│   │   ├── routes_final_evaluations_viva.py
│   │   └── utils.py                   # Helpers
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml                 # Docker orchestration
├── Dockerfile.frontend                # Frontend container
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🛠️ Development

### Running Tests
```bash
# Frontend (if tests added)
npm run test

# Backend (if tests added)
pytest backend/
```

### Building for Production
```bash
# Frontend
npm run build
# Output: dist/

# Backend
# Dockerize and deploy
docker build -f backend/Dockerfile -t openfyp-backend .
```

### Code Quality
```bash
# Lint frontend
npm run lint

# Format code
npm run format
```

## 📖 Documentation

- **Software Design Specification**: `OpenFYP_Software_Design_Specification.docx`
- **Class Diagrams**: `OpenFYP_Complete_Diagram.puml`
- **API Documentation**: http://localhost:8000/docs (when running)

## 🐛 Troubleshooting

### Docker Issues

**Containers won't start**
```bash
# Check logs
docker-compose logs

# Restart everything
docker-compose down && docker-compose up --build
```

**Port already in use**
```bash
# Change ports in docker-compose.yml
ports:
  - "5174:5173"  # Frontend
  - "8001:8000"  # Backend
  - "5434:5432"  # Database
```

**Database connection errors**
```bash
# Ensure DB service is running
docker-compose up db

# Check database credentials in docker-compose.yml
```

### Frontend Issues

**API calls returning 404**
- Ensure `VITE_API_URL` is set correctly
- For Docker: `http://backend:8000`
- For local: `http://localhost:8000`

**Theme not persisting**
- Check browser localStorage (DevTools > Application)
- Clear cache and reload

### Backend Issues

**Import errors**
```bash
# Reinstall dependencies
pip install -r backend/requirements.txt
```

**Database migrations failed**
```bash
# Drop and recreate tables (dev only)
# Update models.py and restart
```

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the **GPLv2 License** - see the LICENSE file for details.

## 👥 Authors

- **Hashir Asad** ([@WeWeBunnyX](https://github.com/WeWeBunnyX))
- **Malik Daniyal Ahmed** ([@danisensei](https://github.com/danisensei))

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review API documentation at `/docs`

## 🎓 About OpenFYP

OpenFYP is designed to streamline the Final Year Project lifecycle in academic institutions. It provides a complete solution for managing student projects from registration through final evaluation, with role-based access control and comprehensive tracking capabilities.

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅

Made with ❤️ for academic excellence
