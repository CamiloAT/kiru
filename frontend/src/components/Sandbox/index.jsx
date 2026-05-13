import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Ruler, BookOpen, Monitor, Apple, Pencil, RefreshCcw, Download, ArrowLeft, Type, FileText, Cloud } from 'lucide-react';
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
        <button className="btn-primary flex items-center gap-2" onClick={() => setStep('upload')}>
          <ArrowLeft size={18} /> Ir a subir plantilla
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
        <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          ¡Tu Fuente está Lista! <Sparkles size={24} className="text-accent" />
        </h2>
        <p>Escribe cualquier texto para probarlo con tu letra.</p>
      </div>

      {/* Font Size Control */}
      <div className="sandbox-controls">
        <div className="control-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Ruler size={16} /> Tamaño: {fontSize}px
          </label>
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
        <summary style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} /> ¿Cómo instalar y usar mi fuente?
        </summary>
        <div className="install-content" style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
          
          <div className="install-os card-inner">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Monitor size={18} /> Windows (Word, PowerPoint, etc.)
            </h4>
            <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem' }}>
              <li>Haz clic en el botón <strong>Descargar</strong> abajo para guardar el archivo <code>.ttf</code>.</li>
              <li>Abre la carpeta donde se descargó.</li>
              <li>Haz <strong>doble clic</strong> en el archivo <code>.ttf</code>.</li>
              <li>Se abrirá una ventana; haz clic en el botón <strong>Instalar</strong> en la parte superior.</li>
              <li>Abre Word o PowerPoint y busca tu fuente ("{fontName || 'MiLetra'}") en la lista de tipos de letra.</li>
            </ol>
          </div>

          <div className="install-os card-inner">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Apple size={18} /> macOS (Pages, Word para Mac)
            </h4>
            <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem' }}>
              <li>Descarga el archivo <code>.ttf</code>.</li>
              <li>Haz <strong>doble clic</strong> en él.</li>
              <li>Se abrirá la aplicación "Catálogo Tipográfico" (Font Book).</li>
              <li>Haz clic en <strong>Instalar fuente</strong>.</li>
            </ol>
          </div>

          <div className="install-os card-inner">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Cloud size={18} /> Google Docs / Google Workspace
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
              <strong>Nota importante:</strong> Google Docs no permite subir fuentes personalizadas directamente por restricciones de seguridad. Si quieres usar tu letra en un documento en la nube, te recomendamos usar <strong>Word Online</strong> (que a veces lo permite si está instalada en tu sistema) o exportar tu texto como imagen desde programas de diseño.
            </p>
          </div>

          <div className="install-os card-inner">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Pencil size={18} /> Procreate / GoodNotes (iPad)
            </h4>
            <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem' }}>
              <li>Guarda el <code>.ttf</code> en la app <strong>Archivos</strong> de tu iPad.</li>
              <li><strong>Procreate:</strong> Ve a Acciones (icono de llave inglesa) → Añadir → Añadir texto. Toca el nombre de la fuente actual e importa tu archivo.</li>
              <li><strong>GoodNotes:</strong> Usa una app gratuita como iFont para instalar el perfil de la fuente en iOS, y luego úsala en GoodNotes.</li>
            </ol>
          </div>

        </div>
      </details>

      {/* Actions */}
      <div className="template-actions">
        <motion.button
          className="btn-secondary"
          onClick={handleNewFont}
          whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCcw size={18} /> Crear otra fuente
        </motion.button>

        <motion.button
          className="btn-primary download-btn"
          onClick={handleDownload}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={18} /> Descargar {fontName || 'MiLetra'}.ttf
        </motion.button>
      </div>
    </motion.div>
  );
}
