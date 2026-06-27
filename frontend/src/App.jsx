import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PenTool, Heart, ArrowLeft } from 'lucide-react';
import useAppStore from './store/useAppStore';
import Landing from './components/Landing/Landing';
import TemplateGenerator from './components/TemplateGenerator/TemplateGenerator';
import Uploader from './components/Uploader/Uploader';
import Editor from './components/Editor/Editor';
import Sandbox from './components/Sandbox/Sandbox';
import './App.css';

const STEPS = ['template', 'upload', 'editor', 'sandbox'];
const STEP_LABELS = {
  template: 'Plantilla',
  upload: 'Subir Foto',
  editor: 'Afinar Letras',
  sandbox: 'Tu Fuente',
};

function AppWizard() {
  const { step, setStep } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync URL to store
  useEffect(() => {
    const path = location.pathname.replace('/', '');
    if (STEPS.includes(path)) {
      if (path !== step) {
        setStep(path);
      }
    } else {
      navigate('/template', { replace: true });
    }
  }, [location.pathname]);

  // Sync store to URL
  useEffect(() => {
    const expectedPath = `/${step}`;
    if (location.pathname !== expectedPath) {
      navigate(expectedPath);
    }
  }, [step, navigate]);

  const currentStepIndex = STEPS.indexOf(step);

  return (
    <>
      <div className="bg-gradient-animated" />

      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <motion.div
            className="logo"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <img src="/kiru-logo.png" alt="K" className="logo-icon" />
            <h1 className="logo-text">iru</h1>
          </motion.div>

          {step === 'template' && (
            <motion.button
              className="back-btn"
              onClick={() => navigate('/')}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={18} />
            </motion.button>
          )}

          <motion.nav
            className="step-indicator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {STEPS.map((s, index) => {
              const isActive = step === s;
              const isCompleted = currentStepIndex > index;
              const isClickable = index <= currentStepIndex;

              return (
                <div
                  key={s}
                  className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isClickable ? 'clickable' : ''}`}
                  onClick={() => isClickable && setStep(s)}
                  role="button"
                  tabIndex={isClickable ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isClickable) setStep(s);
                    }
                  }}
                >
                  <div className="step-circle">
                    {isCompleted ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="step-label">{STEP_LABELS[s]}</span>
                  {index < STEPS.length - 1 && (
                    <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />
                  )}
                </div>
              );
            })}
          </motion.nav>
        </header>

        {/* Main Content Area */}
        <main className="app-content">
          <AnimatePresence mode="wait">
            {step === 'template' && <TemplateGenerator key="template" />}
            {step === 'upload' && <Uploader key="upload" />}
            {step === 'editor' && <Editor key="editor" />}
            {step === 'sandbox' && <Sandbox key="sandbox" />}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>&copy; 2026 Kiru. Todos los derechos reservados.</p>
        </footer>
      </div>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/template" element={<AppWizard />} />
      <Route path="/upload" element={<AppWizard />} />
      <Route path="/editor" element={<AppWizard />} />
      <Route path="/sandbox" element={<AppWizard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
