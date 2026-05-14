import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Ruler, BookOpen, Pencil, RefreshCcw, Download, ArrowLeft, Type, FileText, Cloud } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { TEMPLATE_CONFIGS } from '../../utils/TemplateConfigs';
import './Sandbox.css';

export default function Sandbox() {
  const { fontBytes, fontName, setFontName, templateType, setStep, reset } = useAppStore();
  const [text, setText] = useState('El veloz murciélago hindú comía feliz cardillo y kiwi.\nLa cigüeña tocaba el saxofón detrás del palenque de paja.');
  const [fontSize, setFontSize] = useState(32);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
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

      {/* Font Name Input */}
      <div className="font-name-input" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="fontNameInput" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Nombre de tu fuente</label>
        <input
          id="fontNameInput"
          type="text"
          value={fontName}
          onChange={(e) => setFontName(e.target.value)}
          placeholder="Ej: Mi Letra Bonita"
          maxLength={30}
          style={{ padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '1rem', outline: 'none' }}
        />
      </div>

      {/* Sample Texts */}
      <div className="sample-texts">
        <span className="sample-label">Textos de prueba:</span>
        <button className="sample-btn" onClick={() => setText('A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z\na b c d e f g h i j k l m n ñ o p q r s t u v w x y z\n0 1 2 3 4 5 6 7 8 9')}>
          Alfabeto y Números
        </button>
        <button className="sample-btn" onClick={() => setText('El veloz murciélago hindú comía feliz cardillo y kiwi.\nLa cigüeña tocaba el saxofón detrás del palenque de paja.')}>
          Pangrama
        </button>
        <button className="sample-btn" onClick={() => setText(TEMPLATE_CONFIGS[templateType]?.chars?.join(' ') || 'A B C')}>
          Todos los caracteres
        </button>
      </div>

      {/* Installation Guide */}
      <div className="install-guide" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div 
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          style={{ padding: '16px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', color: isGuideOpen ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s', userSelect: 'none' }}
        >
          <BookOpen size={18} /> ¿Cómo instalar y usar mi fuente?
        </div>
        
        <motion.div
          initial={false}
          animate={{ height: isGuideOpen ? 'auto' : 0, opacity: isGuideOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <div className="install-content-wrapper">
            <div className="install-content" style={{ display: 'grid', gap: '16px', padding: '0 20px 20px' }}>
              <div className="install-os card-inner" style={{ borderLeft: '4px solid var(--accent-primary)', paddingLeft: '16px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 88 88">
                  <path fill="var(--accent-primary)" d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L0 75.44v-31.84zm4.326-39.02L87.314 0v41.26l-47.318.376zm47.318 39.897v41.21l-47.329-6.678v-34.9z"/>
                </svg>
                Windows (Word, PowerPoint, etc.)
              </h4>
              <ol style={{ paddingLeft: '24px', margin: 0, fontSize: '0.85rem', lineHeight: '1.6' }}>
                <li>Haz clic en el botón <strong>Descargar</strong> abajo para guardar el archivo <code>.ttf</code>.</li>
                <li>Abre la carpeta donde se descargó.</li>
                <li>Haz <strong>doble clic</strong> en el archivo <code>.ttf</code>.</li>
                <li>Se abrirá una ventana; haz clic en el botón <strong>Instalar</strong> en la parte superior.</li>
                <li>Abre Word o PowerPoint y busca tu fuente ("{fontName || 'MiLetra'}") en la lista de tipos de letra.</li>
              </ol>
            </div>

            <div className="install-os card-inner" style={{ borderLeft: '4px solid var(--accent-primary)', paddingLeft: '16px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 384 512">
                  <path fill="var(--accent-primary)" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                macOS (Pages, Word para Mac)
              </h4>
              <ol style={{ paddingLeft: '24px', margin: 0, fontSize: '0.85rem', lineHeight: '1.6' }}>
                <li>Descarga el archivo <code>.ttf</code>.</li>
                <li>Haz <strong>doble clic</strong> en él.</li>
                <li>Se abrirá la aplicación "Catálogo Tipográfico" (Font Book).</li>
                <li>Haz clic en <strong>Instalar fuente</strong>.</li>
              </ol>
            </div>

            <div className="install-os card-inner" style={{ borderLeft: '4px solid var(--accent-primary)', paddingLeft: '16px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                <Cloud size={16} color="var(--accent-primary)" /> Google Docs / Google Workspace
              </h4>
              <div style={{ fontSize: '0.85rem', lineHeight: '1.6', padding: '12px 16px', backgroundColor: 'var(--accent-primary-glow)', borderRadius: '8px', border: '1px solid var(--border-accent)' }}>
                <strong>Nota importante:</strong> Google Docs no permite subir fuentes personalizadas directamente por restricciones de seguridad. Si quieres usar tu letra en un documento en la nube, te recomendamos usar <strong>Word Online</strong> o exportar tu texto como imagen.
              </div>
            </div>

            <div className="install-os card-inner" style={{ borderLeft: '4px solid var(--accent-primary)', paddingLeft: '16px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                <Pencil size={16} color="var(--accent-primary)" /> Procreate / GoodNotes (iPad)
              </h4>
              <ol style={{ paddingLeft: '24px', margin: 0, fontSize: '0.85rem', lineHeight: '1.6' }}>
                <li>Guarda el <code>.ttf</code> en la app <strong>Archivos</strong> de tu iPad.</li>
                <li><strong>Procreate:</strong> Ve a Acciones (icono de llave inglesa) → Añadir → Añadir texto. Toca el nombre de la fuente actual e importa tu archivo.</li>
                <li><strong>GoodNotes:</strong> Usa una app gratuita como iFont para instalar el perfil de la fuente y luego úsala.</li>
              </ol>
            </div>
          </div>
        </div>
        </motion.div>
      </div>

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
