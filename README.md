# Kiru 

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

Kiru is a modern web application aimed at image segmentation, vectorization, and building custom typographic fonts. It is built with a robust backend in Python and an interactive, fast, and modern frontend developed with React and Vite.

---

## Main Features

### Backend Processing (Python)
* **Segmentation (`segmentation.py`):** Specialized algorithms to process and segment input strokes or characters.
* **Vectorization (`vectorizer.py`):** Precise transformation of rasterized strokes into scalable vector graphics (SVG).
* **Font Generator (`font_builder.py`):** Final assembly and export of the customized typography.

### Modern Interface (Frontend - React/Vite)
* **Uploader:** Intuitive interface for quick and user-friendly uploading of images and resources.
* **Template Generator (TemplateGenerator):** Interactive area for template configuration via `TemplateConfigs.js`.
* **Interactive Sandbox:** Dynamic playground to visualize results in real-time.
* **State Management:** Global application state handling using `useAppStore.js`.

---

## Execution and Development Guide

Kiru features a decoupled architecture. To run the project locally, you need to start the Backend server and the Frontend development server in two separate terminals.

### 1. Backend Setup and Execution

Open a new terminal at the root of the project and follow these steps sequentially:

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create the virtual environment (`venv`):**
   *(This step isolates the necessary libraries to avoid conflicts with other Python applications on your system)*
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   * **On Windows (CMD / PowerShell):**
     ```powershell
     .\venv\Scripts\activate
     ```
   * **On macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install required dependencies:**
   Make sure the virtual environment is activated (you should see `(venv)` at the beginning of your command line) and run:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Backend server:**
   Start the API server (assuming it is mounted on FastAPI/Uvicorn).
   ```bash
   uvicorn app.main:app --reload
   ```
   *The server should now be running (usually at `http://localhost:8000` or `http://127.0.0.1:8000`).*

---

### 2. Frontend Setup and Execution

Open a **completely new terminal window** (so the backend continues running in the background) and do the following:

1. **Navigate to the frontend folder:**
   From the root of the project, run:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   *(Requires Node.js to be installed on your computer)*
   ```bash
   npm install
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   *This will start the web application, commonly at `http://localhost:5173`. Open this link directly in your web browser to use **Kiru**.*

---

## Project Structure

```text
kiru/
│
├── backend/                       ← Python Server (Algorithmic Processing)
│   ├── requirements.txt           ← List of Python dependencies
│   └── app/
│       ├── main.py                ← Main API execution file
│       ├── api/                   ← Controllers and endpoints definition
│       └── services/              ← Core logic modules
│           ├── font_builder.py    ← Font creator service
│           ├── segmentation.py    ← Image segmentation algorithms
│           └── vectorizer.py      ← Vector conversion (SVGs)
│
└── frontend/                      ← Web UI Application (React + Vite)
    ├── package.json               ← Node.js dependencies and scripts
    ├── vite.config.js             ← Vite bundler configuration
    ├── index.html                 ← Main HTML template
    ├── public/
    │   └── kiru-logo.png          ← Generic static assets
    └── src/
        ├── App.jsx / main.jsx     ← Main React entry points
        ├── components/            ← Visual components organized by context
        │   ├── Sandbox/           ← Preview component
        │   ├── TemplateGenerator/ ← Template generator
        │   └── Uploader/          ← File upload component
        ├── store/                 ← Global state management (Zustand, etc.)
        │   └── useAppStore.js
        └── utils/                 ← Isolated utilities and configurations
            └── TemplateConfigs.js
```
