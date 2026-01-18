# UI Guide - University of Ibadan AI Assistant

An intelligent chatbot powered by RAG (Retrieval-Augmented Generation) technology to help students, staff, and prospective students navigate University of Ibadan policies, procedures, and information.

![UI Guide](https://img.shields.io/badge/University-of%20Ibadan-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![LangChain](https://img.shields.io/badge/LangChain-121212?logo=chainlink&logoColor=white)

## 🌟 Features

- **Intelligent Q&A**: Ask questions about University of Ibadan policies, admissions, courses, and more
- **Document Retrieval**: Powered by ChromaDB vector database with semantic search
- **Source Citations**: Every response includes references to source documents
- **Chat History**: Save and manage multiple conversation threads
- **Markdown Support**: Properly formatted responses with lists, bold text, and code blocks
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **University Branding**: Designed with UI's official colors and identity

## 🚀 Live Demo

- **Frontend**: [https://ui-guide-ai.vercel.app](https://ui-guide-ai.vercel.app)
- **API**: [https://ui-guide-api-production.up.railway.app](https://ui-guide-api-production.up.railway.app)

## 📁 Project Structure

```
UI-Guide-AI/
├── backend/                    # FastAPI backend
│   ├── main.py                # FastAPI application
│   ├── agent.py               # LangGraph RAG agent
│   ├── build_index.py         # Script to build vector database
│   ├── download_db.py         # Script to download vector DB on deployment
│   ├── package_db.py          # Script to package vector DB for upload
│   ├── requirements.txt       # Python dependencies
│   └── chroma_db/            # Vector database (not in git)
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main chat component
│   │   ├── index.css         # Global styles
│   │   └── services/
│   │       └── api.js        # API client
│   ├── package.json
│   └── vite.config.js
├── requirements.txt           # Root requirements for Railway
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern web framework for building APIs
- **LangChain**: Framework for LLM applications
- **LangGraph**: Agent orchestration and workflow
- **OpenAI GPT-4**: Language model for responses
- **ChromaDB**: Vector database for document embeddings
- **PyMuPDF**: PDF document processing

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Markdown**: Markdown rendering
- **Axios**: HTTP client
- **Lucide React**: Icon library

## 📦 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Olasquare043/UI-Guide-AI.git
   cd UI-Guide-AI/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `backend` folder:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DOCS_DIR=./docs
   ```

5. **Add your PDF documents**
   
   Place University of Ibadan policy documents in `backend/docs/` folder

6. **Build the vector database**
   ```bash
   python build_index.py
   ```

7. **Run the server**
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend folder**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## 🌐 Deployment

### Backend Deployment (Railway)

1. **Package vector database**
   ```bash
   cd backend
   python package_db.py
   ```

2. **Upload to GitHub Releases**
   - Create a new release on GitHub
   - Upload the generated `chroma_db.tar.gz` file
   - Copy the download URL

3. **Deploy to Railway**
   - Connect your GitHub repository
   - Set environment variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `CHROMA_DB_URL`: URL to your uploaded `chroma_db.tar.gz`
   - Railway will auto-deploy

### Frontend Deployment (Vercel)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push
   ```

2. **Deploy on Vercel**
   - Import your GitHub repository
   - Set Root Directory to `frontend`
   - Add environment variable:
     - `VITE_API_URL`: Your Railway API URL
   - Deploy

## 📖 API Documentation

### Endpoints

#### `GET /`
Health check endpoint
```json
{
  "status": "healthy",
  "message": "UI Guide API is running",
  "app": "UI Guide - Your intelligent guide to University of Ibadan",
  "version": "1.0.0"
}
```

#### `POST /chat`
Send a message to the chatbot

**Request:**
```json
{
  "message": "What are the admission requirements?",
  "thread_id": "optional-session-id"
}
```

**Response:**
```json
{
  "answer": "The admission requirements for University of Ibadan...",
  "used_retriever": true,
  "thread_id": "session-id"
}
```

#### `GET /health`
Simple health check
```json
{
  "status": "healthy"
}
```

## 🎯 Usage Examples

### Ask about Admissions
```
User: What are the admission requirements for undergraduate programs?
AI Guide: [Provides detailed admission requirements with source citations]
```

### Ask about Policies
```
User: What is the university's policy on sexual harassment?
AI Guide: [Provides policy details with citations from official documents]
```

### Ask about Courses
```
User: What science courses can I study at UI?
AI Guide: [Lists available science programs]
```

## 🔧 Configuration

### Adding New Documents

1. Add PDF files to `backend/docs/` folder
2. Run the build script:
   ```bash
   python build_index.py
   ```
3. The vector database will be updated automatically

### Customizing the Agent

Edit `backend/agent.py` to modify:
- System prompt
- Retrieval parameters (`k`, `fetch_k`, `lambda_mult`)
- LLM model and temperature

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Olasquare** - *Initial work* - [Olasquare043](https://github.com/Olasquare043)

## 🙏 Acknowledgments

- University of Ibadan for providing the policy documents
- OpenAI for GPT-4 API
- LangChain team for the amazing framework
- The open-source community

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**University of Ibadan** - *First and the Best* 🎓# UI Guide - University of Ibadan AI Assistant

An intelligent chatbot powered by RAG (Retrieval-Augmented Generation) technology to help students, staff, and prospective students navigate University of Ibadan policies, procedures, and information.

![UI Guide](https://img.shields.io/badge/University-of%20Ibadan-orange)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![LangChain](https://img.shields.io/badge/LangChain-121212?logo=chainlink&logoColor=white)

## 🌟 Features

- **Intelligent Q&A**: Ask questions about University of Ibadan policies, admissions, courses, and more
- **Document Retrieval**: Powered by ChromaDB vector database with semantic search
- **Source Citations**: Every response includes references to source documents
- **Chat History**: Save and manage multiple conversation threads
- **Markdown Support**: Properly formatted responses with lists, bold text, and code blocks
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **University Branding**: Designed with UI's official colors and identity

## 🚀 Live Demo

- **Frontend**: [https://ui-guide-ai.vercel.app](https://ui-guide-ai.vercel.app)
- **API**: [https://ui-guide-api-production.up.railway.app](https://ui-guide-api-production.up.railway.app)

## 📁 Project Structure

```
UI-Guide-AI/
├── backend/                    # FastAPI backend
│   ├── main.py                # FastAPI application
│   ├── agent.py               # LangGraph RAG agent
│   ├── build_index.py         # Script to build vector database
│   ├── download_db.py         # Script to download vector DB on deployment
│   ├── package_db.py          # Script to package vector DB for upload
│   ├── requirements.txt       # Python dependencies
│   └── chroma_db/            # Vector database (not in git)
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main chat component
│   │   ├── index.css         # Global styles
│   │   └── services/
│   │       └── api.js        # API client
│   ├── package.json
│   └── vite.config.js
├── requirements.txt           # Root requirements for Railway
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern web framework for building APIs
- **LangChain**: Framework for LLM applications
- **LangGraph**: Agent orchestration and workflow
- **OpenAI GPT-4**: Language model for responses
- **ChromaDB**: Vector database for document embeddings
- **PyMuPDF**: PDF document processing

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Markdown**: Markdown rendering
- **Axios**: HTTP client
- **Lucide React**: Icon library

## 📦 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Olasquare043/UI-Guide-AI.git
   cd UI-Guide-AI/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `backend` folder:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   DOCS_DIR=./docs
   ```

5. **Add your PDF documents**
   
   Place University of Ibadan policy documents in `backend/docs/` folder

6. **Build the vector database**
   ```bash
   python build_index.py
   ```

7. **Run the server**
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend folder**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## 🌐 Deployment

### Backend Deployment (Railway)

1. **Package vector database**
   ```bash
   cd backend
   python package_db.py
   ```

2. **Upload to GitHub Releases**
   - Create a new release on GitHub
   - Upload the generated `chroma_db.tar.gz` file
   - Copy the download URL

3. **Deploy to Railway**
   - Connect your GitHub repository
   - Set environment variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `CHROMA_DB_URL`: URL to your uploaded `chroma_db.tar.gz`
   - Railway will auto-deploy

### Frontend Deployment (Vercel)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push
   ```

2. **Deploy on Vercel**
   - Import your GitHub repository
   - Set Root Directory to `frontend`
   - Add environment variable:
     - `VITE_API_URL`: Your Railway API URL
   - Deploy

## 📖 API Documentation

### Endpoints

#### `GET /`
Health check endpoint
```json
{
  "status": "healthy",
  "message": "UI Guide API is running",
  "app": "UI Guide - Your intelligent guide to University of Ibadan",
  "version": "1.0.0"
}
```

#### `POST /chat`
Send a message to the chatbot

**Request:**
```json
{
  "message": "What are the admission requirements?",
  "thread_id": "optional-session-id"
}
```

**Response:**
```json
{
  "answer": "The admission requirements for University of Ibadan...",
  "used_retriever": true,
  "thread_id": "session-id"
}
```

#### `GET /health`
Simple health check
```json
{
  "status": "healthy"
}
```

## 🎯 Usage Examples

### Ask about Admissions
```
User: What are the admission requirements for undergraduate programs?
AI Guide: [Provides detailed admission requirements with source citations]
```

### Ask about Policies
```
User: What is the university's policy on sexual harassment?
AI Guide: [Provides policy details with citations from official documents]
```

### Ask about Courses
```
User: What science courses can I study at UI?
AI Guide: [Lists available science programs]
```

## 🔧 Configuration

### Adding New Documents

1. Add PDF files to `backend/docs/` folder
2. Run the build script:
   ```bash
   python build_index.py
   ```
3. The vector database will be updated automatically

### Customizing the Agent

Edit `backend/agent.py` to modify:
- System prompt
- Retrieval parameters (`k`, `fetch_k`, `lambda_mult`)
- LLM model and temperature

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Olasquare** - *Initial work* - [Olasquare043](https://github.com/Olasquare043)

## 🙏 Acknowledgments

- University of Ibadan for providing the policy documents
- OpenAI for GPT-4 API
- LangChain team for the amazing framework
- The open-source community

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**University of Ibadan** - *First and the Best* 🎓