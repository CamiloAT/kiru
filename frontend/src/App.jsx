import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAppStore from './store/useAppStore';
import TemplateGenerator from './components/TemplateGenerator';
import Uploader from './components/Uploader';
import Sandbox from './components/Sandbox';
import './App.css';

const STEPS = ['template', 'upload', 'sandbox'];
const STEP_LABELS = {
  template: 'Plantilla',
  upload: 'Subir Foto',
  sandbox: 'Tu Fuente',
};

function App() {
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

  return (
    <>
      <div className="bg-gradient-animated" />

      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <motion.div
            className="logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="logo-icon">🖋️</span>
            <span className="logo-text">Kiru</span>
          </motion.div>
          <p className="tagline">Convierte tu escritura en una fuente tipográfica</p>
        </header>

        {/* Progress Steps */}
        <nav className="steps-nav">
          {STEPS.map((s, i) => (
            <div 
              key={s} 
              className={`step-item ${step === s ? 'active' : ''} ${STEPS.indexOf(step) > i ? 'completed' : ''}`}
              onClick={() => setStep(s)}
              style={{ cursor: 'pointer' }}
            >
              <div className="step-dot">
                {STEPS.indexOf(step) > i ? '✓' : i + 1}
              </div>
              <span className="step-label">{STEP_LABELS[s]}</span>
              {i < STEPS.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </nav>

        {/* Main Content */}
        <main className="main-content card">
          <AnimatePresence mode="wait">
            {step === 'template' && (
              <motion.div key="template" exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <TemplateGenerator />
              </motion.div>
            )}
            {step === 'upload' && (
              <motion.div key="upload" exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <Uploader />
              </motion.div>
            )}
            {step === 'sandbox' && (
              <motion.div key="sandbox" exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                <Sandbox />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>Hecho con ❤️ — Kiru v1.0</p>
        </footer>
      </div>
    </>
  );
}

export default App;
