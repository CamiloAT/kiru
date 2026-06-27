# Kiru

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-B73BFE?style=flat&logo=vite&logoColor=FFD62E)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

Turn your handwriting into a downloadable digital typeface. Kiru processes an image of your writing, segments each character, vectorizes it, and generates a `.ttf` font file ready to use in any application.

---

## Main Features

- **Image Segmentation:** Automatically detects and extracts each character from a handwritten template using image processing algorithms.
- **Glyph Editor:** Interactive editor with draw, erase, move, and scale tools to refine each character before generating the font.
- **Vectorization Engine:** Converts bitmaps into smoothed vector contours ready for professional typography.
- **Font Builder:** Assembles vectorized glyphs into a valid TrueType (`.ttf`) file with dynamic advance width metrics.
- **Real-time Sandbox:** Interactive playground to preview the generated font with sample texts, formats, and customizable colors.
- **Adjustable Padding:** Control character spacing with real-time preview before downloading.
- **Dark Theme UI:** Modern dark interface with purple/pink gradient accents for a comfortable visual experience.

---

## Pages & Views

| View | Description |
|---|---|
| **Landing** | Home page with interactive hero, sample font showcase, and step-by-step guide |
| **Template Generator** | Generates and downloads an empty template with a character grid for writing |
| **Uploader** | Uploads the completed template image and configures the character set type |
| **Editor** | Glyph editor with draw/erase/move tools and font generation |
| **Sandbox** | Font preview with text editor, size and padding controls, installation guide, and download |

---

## Execution and Development Guide

Kiru has a decoupled architecture. To run the project locally, you need to start the Backend server and the Frontend development server in separate terminals.

### 1. Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CamiloAT/kiru.git
   cd kiru
   ```

2. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

3. **Create the virtual environment:**
   ```bash
   python -m venv venv
   ```

4. **Activate the virtual environment:**
   * **Windows (CMD / PowerShell):**
     ```powershell
     .\venv\Scripts\activate
     ```
   * **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

5. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Start the server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   > **Note:** The server runs at `http://localhost:8000`.

### 2. Frontend Setup

1. **Open a new terminal** (keep the backend running) and navigate to the frontend:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   > **Note:** The app opens at `http://localhost:5173`.

### 3. Usage

1. In **Template Generator**, choose the character set type and download the template.
2. Write the characters by hand on the printed template.
3. In **Uploader**, upload a photo of the completed template.
4. In **Editor**, refine each glyph with the draw/erase/move tools.
5. Generate the font and download the `.ttf` file from **Sandbox**.
6. Install the font on your operating system and use it in any application.

---

## Project Structure

```text
kiru/
│
├── backend/                        ← Python server (image processing)
│   ├── requirements.txt            ← Python dependencies
│   └── app/
│       ├── main.py                 ← API endpoints and models
│       └── services/
│           ├── segmentation.py     ← Template segmentation and glyph extraction
│           ├── vectorizer.py       ← Bitmap to contour vectorization
│           └── font_builder.py     ← TTF file assembly
│
└── frontend/                       ← Web UI (React + Vite)
    ├── package.json                ← Node.js dependencies
    ├── vite.config.js              ← Vite configuration
    ├── index.html                  ← Main HTML template
    └── src/
        ├── App.jsx                 ← Routes and navigation
        ├── App.css                 ← Global shared styles
        ├── main.css                ← CSS variables and Google Fonts
        ├── components/
        │   ├── Landing/            ← Home page
        │   ├── TemplateGenerator/  ← Template generator
        │   ├── Uploader/           ← Image upload
        │   ├── Editor/             ← Glyph editor
        │   └── Sandbox/            ← Preview and download
        ├── store/
        │   └── useAppStore.js      ← Global state (Zustand)
        └── utils/
            └── TemplateConfigs.js  ← Character set configs per template
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | FastAPI 0.115, Uvicorn 0.30, Pydantic 2.13 |
| **Image Processing** | OpenCV 4.13, NumPy 2.4, Pillow 12.2 |
| **Font Generation** | fontTools 4.62 (TrueType builder) |
| **Frontend** | React 19, Vite 8, React Router 7 |
| **State Management** | Zustand 5 |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React 1.14 |
| **Language** | JavaScript (ES Modules) |

---

## Authors

| Name | GitHub |
|---|---|
| **Camilo Andres Arias Tenjo** | [@CamiloAT](https://github.com/CamiloAT) |

*Fullstack web application focused on image processing and digital typography.*
