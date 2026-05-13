import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import useAppStore from '../../store/useAppStore';
import './Sandbox.css';

export default function Sandbox() {
  const { fontBytes, fontName, setStep, reset } = useAppStore();
  const [text, setText] = useState('El veloz murciélago hindú comía feliz cardillo y kiwi.\nLa cigüeña tocaba el saxofón detrás del palenque de paja.');
  const [fontSize, setFontSize] = useState(32);
  const [fontLoaded, setFontLoaded] = useState(false);
  const previewRef = useRef(null);

  // Load the generated font into the document
  useEffect(() => {
    if (!fontBytes) return;

    const loadFont = async () => {
      try {
        const fontFace = new FontFace('KiruUserFont', fontBytes);
        await fontFace.load();
        document.fonts.add(fontFace);
        setFontLoaded(true);
      } catch (err) {
        console.error('Error loading font:', err);
      }
    };

    loadFont();

    // Cleanup
    return () => {
      document.fonts.forEach((font) => {
        if (font.family === 'KiruUserFont') {
          document.fonts.delete(font);
        }
      });
    };
  }, [fontBytes]);

  const handleDownload = () => {
    if (!fontBytes) return;

    const blob = new Blob([fontBytes], { type: 'font/ttf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fontName || 'MiLetra'}.ttf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleNewFont = () => {
    reset();
  };

  if (!fontBytes) {
    return (
      <div className="sandbox-empty">
        <p>No hay fuente generada aún.</p>
        <button className="btn-primary" onClick={() => setStep('upload')}>
          ← Ir a subir plantilla
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="sandbox-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="template-header">
        <span className="step-badge">Paso 3</span>
        <h2>¡Tu Fuente está Lista! ✨</h2>
        <p>Escribe cualquier texto para probarlo con tu letra.</p>
      </div>

      {/* Font Size Control */}
      <div className="sandbox-controls">
        <div className="control-group">
          <label>📐 Tamaño: {fontSize}px</label>
          <input
            type="range" min="14" max="80" value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Preview Area */}
      <div className="sandbox-preview-area">
        <div
          ref={previewRef}
          className="sandbox-preview"
          style={{
            fontFamily: fontLoaded ? "'KiruUserFont', serif" : 'serif',
            fontSize: `${fontSize}px`,
          }}
        >
          {text || 'Escribe algo arriba...'}
        </div>
      </div>

      {/* Text Input */}
      <textarea
        className="sandbox-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe aquí para probar tu fuente..."
        rows={4}
      />

      {/* Sample Texts */}
      <div className="sample-texts">
        <span className="sample-label">Textos de prueba:</span>
        <button className="sample-btn" onClick={() => setText('ABCDEFGHIJKLMNÑOPQRSTUVWXYZ\nabcdefghijklmnñopqrstuvwxyz\n0123456789')}>
          Alfabeto
        </button>
        <button className="sample-btn" onClick={() => setText('El veloz murciélago hindú comía feliz cardillo y kiwi.')}>
          Pangrama
        </button>
        <button className="sample-btn" onClick={() => setText('¡Hola Mundo!\n¿Cómo estás?\nÉsta es mi letra.')}>
          Saludos
        </button>
      </div>

      {/* Installation Guide */}
      <details className="install-guide">
        <summary>📖 ¿Cómo instalo la fuente?</summary>
        <div className="install-content">
          <div className="install-os">
            <h4>🪟 Windows</h4>
            <p>Haz doble clic en el archivo .ttf → Clic en "Instalar"</p>
          </div>
          <div className="install-os">
            <h4>🍎 macOS</h4>
            <p>Doble clic en el .ttf → Se abre "Catálogo Tipográfico" → "Instalar fuente"</p>
          </div>
          <div className="install-os">
            <h4>🎨 Procreate (iPad)</h4>
            <p>Importa el .ttf desde Archivos → En Procreate: Acciones → Añadir → Añadir texto → Selecciona tu fuente</p>
          </div>
        </div>
      </details>

      {/* Actions */}
      <div className="template-actions">
        <motion.button
          className="btn-secondary"
          onClick={handleNewFont}
          whileTap={{ scale: 0.97 }}
        >
          🔄 Crear otra fuente
        </motion.button>

        <motion.button
          className="btn-primary download-btn"
          onClick={handleDownload}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          ⬇️ Descargar {fontName || 'MiLetra'}.ttf
        </motion.button>
      </div>
    </motion.div>
  );
}
