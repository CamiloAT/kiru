import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sun, Contrast, RotateCw, RefreshCcw, AlertCircle, Wand2, ArrowLeft, RotateCcw, ChevronDown } from 'lucide-react'; 
import useAppStore from '../../store/useAppStore';
import { TEMPLATE_CONFIGS } from '../../utils/TemplateConfigs';
import './Uploader.css';

const API_URL = '';

export default function Uploader() {
  const {
    uploadedImage,
    imagePreview,
    setUploadedImage,
    fontName,
    templateType,
    setTemplateType,
    setProcessing,
    setProcessingError,
    setFontBytes,
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
    maxSize: 20 * 1024 * 1024, // 20MB
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
      className="upload-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="template-header">
        <span className="step-badge">Paso 2</span>
        <h2>Sube tu Plantilla</h2>
        <p>Tómale una foto o escanea la plantilla que llenaste.</p>
      </div>

      {/* Drop Zone */}
      {!imagePreview ? (
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <span className="dropzone-icon"><Camera size={48} className="text-accent" /></span>
            <p className="dropzone-text">
              {isDragActive ? 'Suelta la imagen aquí...' : 'Arrastra tu imagen o haz clic para seleccionar'}
            </p>
            <span className="dropzone-hint">JPG, PNG o WebP — Máx. 20MB</span>
          </div>
        </div>
      ) : (
        <div className="image-editor">
          {/* Image Preview */}
          <div className="image-preview-container">
            <img
              src={imagePreview}
              alt="Plantilla escaneada"
              className="image-preview"
              style={imageStyle}
            />
          </div>

          {/* Adjustment Controls */}
          <div className="image-controls">
            <div className="control-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sun size={16} /> Brillo</label>
              <input
                type="range" min="50" max="200" value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
              />
              <span className="control-value">{brightness}%</span>
            </div>
            <div className="control-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Contrast size={16} /> Contraste</label>
              <input
                type="range" min="50" max="200" value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
              />
              <span className="control-value">{contrast}%</span>
            </div>
            <div className="control-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RotateCw size={16} /> Rotación</label>
              <input
                type="range" min="-180" max="180" value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
              />
              <span className="control-value">{rotation}°</span>
            </div>
          </div>

          {/* Buttons container */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px', marginTop: '16px' }}>
            <button
              className="btn-secondary change-image-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}        
              onClick={() => { setUploadedImage(null); }}
            >
              <RefreshCcw size={16} /> Cambiar imagen
            </button>
            <button
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}        
              onClick={() => { setBrightness(100); setContrast(100); setRotation(0); }}
            >
              <RotateCcw size={16} /> Predeterminados
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {processingError && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} /> {processingError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification Select */}
      <AnimatePresence>
        {uploadedImage && !isProcessing && (
          <motion.div 
            className="template-verification"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            style={{ 
              marginTop: '1.5rem', 
              background: 'var(--bg-secondary)', 
              padding: '16px', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            <label style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              ¿Estás subiendo la plantilla correcta?
            </label>
            <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{ 
                  padding: '12px 16px', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem'
                }}
              >
                <span>{TEMPLATE_CONFIGS[templateType].label} ({TEMPLATE_CONFIGS[templateType].chars.length} caracteres)</span>
                <ChevronDown size={18} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-secondary)' }} />
              </div>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }} 
                    transition={{ duration: 0.15 }}
                    style={{ 
                      position: 'absolute', 
                      bottom: '100%', left: 0, right: 0, 
                      marginBottom: '4px', 
                      background: 'var(--bg-primary)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: 'var(--radius-sm)', 
                      overflow: 'hidden', 
                      zIndex: 10, 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)' 
                    }}
                  >
                    {Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => (
                      <div 
                        key={key} 
                        onClick={() => { setTemplateType(key); setIsDropdownOpen(false); }}
                        style={{ 
                          padding: '10px 16px', 
                          cursor: 'pointer', 
                          background: templateType === key ? 'var(--bg-secondary)' : 'transparent',
                          color: templateType === key ? 'var(--text-primary)' : 'var(--text-secondary)',
                          transition: 'background 0.2s',
                          borderBottom: '1px solid var(--border-subtle)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = templateType === key ? 'var(--bg-secondary)' : 'transparent'}
                      >
                        {config.label} <span style={{ opacity: 0.6, fontSize: '0.9em', marginLeft: '4px' }}>({config.chars.length} caracteres)</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="template-actions">
        <motion.button
          className="btn-secondary"
          onClick={() => setStep('template')}
          whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={18} /> Volver
        </motion.button>

        <motion.button
          className="btn-primary"
          onClick={handleGenerateClick}
          disabled={!uploadedImage || isProcessing}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isProcessing ? (
            <><span className="spinner" /> Procesando...</>
          ) : (
            <><Wand2 size={18} /> Generar Fuente</>
          )}
        </motion.button>
      </div>
    </motion.div>

    {/* Confirmation Modal (Moved outside the animated container) */}
    <AnimatePresence>
      {showConfirmModal && (
        <>
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirmModal(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 1000,
              backdropFilter: 'blur(2px)'
            }}
          />
          <motion.div 
            className="modal-content"
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-40%" }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              background: 'var(--bg-primary)', padding: '2rem', borderRadius: 'var(--radius-lg)',
              zIndex: 1001, width: '90%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              textAlign: 'center'
            }}
          >
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Confirmar Plantilla</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Estás a punto de extraer <strong>{TEMPLATE_CONFIGS[templateType].chars.length} caracteres</strong> correspondientes a la plantilla <strong>"{TEMPLATE_CONFIGS[templateType].label}"</strong>.<br/><br/>
              ¿Estás seguro de que la imagen corresponde a este tipo?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setShowConfirmModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleGenerate}>
                Sí, Generar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
