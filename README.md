# Notes App

A full-stack note-taking application with version history tracking.

## Quick Start with Docker

The easiest way to run the application is using Docker:
```bash
# Build and start all services
docker-compose up --build
```
The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000 (Swagger UI: http://localhost:8000/docs)

To stop the application:
```bash
docker-compose down
```

## Manual Setup

### Prerequisites
- Node.js (v20+)
- Python (v3.10+)
- pip (Python package manager)

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```
2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
```
3. Install dependencies:
```bash
pip install -r requirements.txt
```
4. Start the server (make sure you have a DB running with hostname `db`)
```bash
uvicorn app.main:app --reload
```

The backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```
2. Install dependencies:
```bash
npm install
```
3. Start the application:
```bash
npm start
```

The application will be available at http://localhost:3000

## Technical Choices

### Frontend
- **React with TypeScript**: For type safety and better developer experience
- **Ant Design**: Provides a comprehensive set of UI components and consistent design
- **TanStack Query**: For efficient server state management and caching
  - Infinite stale time for version history to prevent unnecessary refetches
  - Automatic cache invalidation when creating new note versions

### Backend
- **FastAPI**: Modern Python framework with automatic OpenAPI documentation (Swagger UI)
- **SQLAlchemy**: Robust ORM for database operations
- **Database schema**:
   - Notes and note versions are stored in separate tables, in order to avoid performance issues when querying large amounts of data. If versions were stored in the same table, each note would have multiple rows, making queries more complex and slower
   - Each note maintains a reference to its current version
   - Diff visualization for comparing changes between note versions done in frontend, as it might cause performance issues in large scale scenarios

## Areas for Improvement

### 1. Performance
- Implement pagination for notes and version history
- Indexes on note_versions table

### 2. Features
- Rich text editing (Markdown)
- Auto-save functionality
- Collaborative editing
- Tags and categories
- Search functionality
- Add input sanitization

### 3. Security
- Add authentication
- Implement rate limiting
