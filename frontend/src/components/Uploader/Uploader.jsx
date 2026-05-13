import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Sun, Contrast, RotateCw, RefreshCcw, AlertCircle, Wand2, ArrowLeft, RotateCcw } from 'lucide-react'; 
import useAppStore from '../../store/useAppStore';
import './Uploader.css';

const API_URL = '';

export default function Uploader() {
  const {
    fontName, templateType,
    uploadedImage, imagePreview, setUploadedImage,
    isProcessing, setProcessing,
    processingError, setProcessingError,
    setFontBytes, setStep,
  } = useAppStore();

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);

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

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setProcessing(true);
    setProcessingError(null);

    try {
      const formData = new FormData();
      formData.append('image', uploadedImage);
      formData.append('font_name', fontName);
      formData.append('template_type', templateType);
      formData.append('smooth', 'true');

      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Error al procesar la imagen');
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      setFontBytes(arrayBuffer);
      setStep('sandbox');
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
          onClick={handleGenerate}
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
  );
}
