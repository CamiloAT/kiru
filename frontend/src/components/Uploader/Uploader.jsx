import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sun, Contrast, RotateCw, RotateCcw, RefreshCcw, AlertCircle, Wand2, ArrowLeft, ChevronDown } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { TEMPLATE_CONFIGS } from '../../utils/TemplateConfigs';
import './Uploader.css';

const API_URL = '';

export default function Uploader() {
  const {
    uploadedImage,
    imagePreview,
    setUploadedImage,
    templateType,
    setTemplateType,
    setProcessing,
    setProcessingError,
    setExtractedGlyphs,
    isProcessing,
    processingError,
    setStep,
  } = useAppStore();

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setUploadedImage(acceptedFiles[0]);
      setProcessingError(null);
    }
  }, [setUploadedImage, setProcessingError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const handleGenerateClick = () => {
    if (!uploadedImage) return;
    setShowConfirmModal(true);
  };

  const handleGenerate = async () => {
    setShowConfirmModal(false);
    setProcessing(true);
    setProcessingError(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('template_type', templateType);

      const response = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Error al procesar la imagen');
      }

      const data = await response.json();
      setExtractedGlyphs(data.glyphs);
      setStep('editor');
    } catch (err) {
      setProcessingError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const imageStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
    transform: `rotate(${rotation}deg)`,
  };

  return (
    <>
      <motion.div
        className="upl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="upl-top">
          <span className="step-badge">Paso 2</span>
          <h2 className="upl-title">Sube tu Plantilla</h2>
          <p className="upl-subtitle">Tomale una foto o escaneá la plantilla que llenaste.</p>
        </div>

        {!imagePreview ? (
          <div {...getRootProps()} className={`upl-drop ${isDragActive ? 'upl-drop--active' : ''}`}>
            <input {...getInputProps()} />
            <Camera size={40} className="upl-drop-icon" />
            <p className="upl-drop-text">
              {isDragActive ? 'Suelta la imagen aquí...' : 'Arrastrá tu imagen o hacé clic para seleccionar'}
            </p>
            <span className="upl-drop-hint">JPG, PNG o WebP — Máx. 20MB</span>
          </div>
        ) : (
          <div className="upl-editor">
            <div className="upl-editor-main">
              <div className="upl-preview">
                <img
                  src={imagePreview}
                  alt="Plantilla escaneada"
                  className="upl-preview-img"
                  style={imageStyle}
                />
              </div>

              <div className="upl-controls">
                <div className="upl-ctrl">
                  <div className="upl-ctrl-header">
                    <Sun size={14} />
                    <span>Brillo</span>
                    <span className="upl-ctrl-val">{brightness}%</span>
                  </div>
                  <input
                    type="range" min="50" max="200" value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                  />
                </div>
                <div className="upl-ctrl">
                  <div className="upl-ctrl-header">
                    <Contrast size={14} />
                    <span>Contraste</span>
                    <span className="upl-ctrl-val">{contrast}%</span>
                  </div>
                  <input
                    type="range" min="50" max="200" value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                  />
                </div>
                <div className="upl-ctrl">
                  <div className="upl-ctrl-header">
                    <RotateCw size={14} />
                    <span>Rotación</span>
                    <span className="upl-ctrl-val">{rotation}°</span>
                  </div>
                  <input
                    type="range" min="-180" max="180" value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                  />
                </div>
                <div className="upl-ctrl-actions">
                  <button className="upl-ctrl-btn" onClick={() => { setUploadedImage(null); }}>
                    <RefreshCcw size={14} /> Cambiar
                  </button>
                  <button className="upl-ctrl-btn" onClick={() => { setBrightness(100); setContrast(100); setRotation(0); }}>
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="upl-verify">
              <label className="upl-verify-label">¿Es la plantilla correcta?</label>
              <div className="upl-dropdown-wrap">
                <div className="upl-dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <span>{TEMPLATE_CONFIGS[templateType].label} — {TEMPLATE_CONFIGS[templateType].chars.length} caracteres</span>
                  <ChevronDown size={16} className={isDropdownOpen ? 'upl-chevron--open' : ''} />
                </div>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      className="upl-dropdown-menu"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      {Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => (
                        <div
                          key={key}
                          className={`upl-dropdown-item ${templateType === key ? 'upl-dropdown-item--active' : ''}`}
                          onClick={() => { setTemplateType(key); setIsDropdownOpen(false); }}
                        >
                          {config.label} <span>({config.chars.length})</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {processingError && (
            <motion.div
              className="upl-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle size={18} /> {processingError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="upl-actions">
          <motion.button
            className="btn-secondary"
            onClick={() => setStep('template')}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft size={18} /> Volver
          </motion.button>
          <motion.button
            className="btn-primary"
            onClick={handleGenerateClick}
            disabled={!uploadedImage || isProcessing}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isProcessing ? (
              <><span className="spinner" /> Procesando…</>
            ) : (
              <><Wand2 size={18} /> Extraer Glyphs</>
            )}
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showConfirmModal && (
          <>
            <motion.div
              className="upl-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div
              className="upl-modal"
              initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-40%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-40%' }}
            >
              <h3>Confirmar Plantilla</h3>
              <p>
                Se extraerán <strong>{TEMPLATE_CONFIGS[templateType].chars.length} caracteres</strong> de la plantilla
                <strong> "{TEMPLATE_CONFIGS[templateType].label}"</strong>.<br />
                ¿La imagen corresponde a este tipo?
              </p>
              <div className="upl-modal-actions">
                <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancelar</button>
                <button className="btn-primary" onClick={handleGenerate}>Sí, Extraer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
