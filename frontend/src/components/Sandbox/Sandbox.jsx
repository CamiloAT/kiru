import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Ruler, BookOpen, Pencil, RefreshCcw, Download, ArrowLeft, Bold, Italic, Underline, Palette, Monitor, Cloud, PenTool, Sun, Moon } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { TEMPLATE_CONFIGS } from '../../utils/TemplateConfigs';
import './Sandbox.css';

const SAMPLE_TEXTS = {
  pangram: 'El veloz murciélago hindú comía feliz cardillo y kiwi.\nLa cigüeña tocaba el saxofón detrás del palenque de paja.',
  pangram2: 'Jovencillo emponzoñado de whisky, qué figurota exhibe.\nBeethoven toca el piano de noche en la azotea con luz de luna.',
  alphabet: 'A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z\na b c d e f g h i j k l m n ñ o p q r s t u v w x y z\n0 1 2 3 4 5 6 7 8 9',
  numbers: '0123456789\n10 25 42 100 2025',
  symbols: '.,:;!¡?¿\'"()-_+=*/\\|@#$%&<>[]{}~^`',
};

export default function Sandbox() {
  const { fontBytes, fontName, setFontName, templateType, extractedGlyphs, setFontBytes, setStep, reset } = useAppStore();
  const [text, setText] = useState(SAMPLE_TEXTS.pangram);
  const [fontSize, setFontSize] = useState(32);
  const [paddingRatio, setPaddingRatio] = useState(25);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [formatState, setFormatState] = useState({ bold: false, italic: false, underline: false });
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const generationRef = useRef(0);
  const abortRef = useRef(null);
  const previewRef = useRef(null);

  const updateFormatState = useCallback(() => {
    setFormatState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  }, []);

  useEffect(() => {
    if (!fontBytes) return;
    const loadFont = async () => {
      try {
        const fontFace = new FontFace('KiruUserFont', fontBytes);
        await fontFace.load();
        document.fonts.add(fontFace);
        setFontLoaded(true);
        setRegenerating(false);
      } catch (err) {
        console.error('Error loading font:', err);
        setRegenerating(false);
      }
    };
    loadFont();
    return () => {
      document.fonts.forEach((font) => {
        if (font.family === 'KiruUserFont') document.fonts.delete(font);
      });
    };
  }, [fontBytes]);

  // Regenerate font on every padding change (backend caches vectorization)
  const regenerateFont = useCallback(async (newPadding) => {
    if (!extractedGlyphs) return;
    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const gen = ++generationRef.current;
    setRegenerating(true);
    try {
      const res = await fetch('/api/generate-from-glyphs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glyphs: extractedGlyphs,
          font_name: fontName || 'MiLetra',
          template_type: templateType || 'full',
          smooth: true,
          padding_ratio: newPadding / 100,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Error regenerating font');
      if (gen !== generationRef.current) return; // stale, ignore
      const buf = await res.arrayBuffer();
      setFontBytes(buf);
    } catch (err) {
      if (err.name === 'AbortError') {
        if (gen === generationRef.current) setRegenerating(false);
        return;
      }
      console.error('Error regenerating font:', err);
      setRegenerating(false);
    }
  }, [extractedGlyphs, fontName, templateType, setFontBytes]);

  const handlePaddingChange = useCallback((newPadding) => {
    setPaddingRatio(newPadding);
    regenerateFont(newPadding);
  }, [regenerateFont]);

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    updateFormatState();
    previewRef.current?.focus();
  };

  // Initialize editor content once
  useEffect(() => {
    if (previewRef.current && fontLoaded) {
      previewRef.current.innerHTML = SAMPLE_TEXTS.pangram.replace(/\n/g, '<br/>');
    }
  }, [fontLoaded]);

  const handleSampleText = (key) => {
    if (previewRef.current) {
      previewRef.current.innerHTML = SAMPLE_TEXTS[key].replace(/\n/g, '<br/>');
      previewRef.current.focus();
    }
  };

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

  if (!fontBytes) {
    return (
      <div className="sandbox-empty">
        <p>No hay fuente generada aún.</p>
        <button className="btn-primary" onClick={() => setStep('upload')}>
          <ArrowLeft size={18} /> Ir a subir plantilla
        </button>
      </div>
    );
  }

  const hasExtended = templateType === 'extended' || templateType === 'full';

  return (
    <motion.div
      className="sbx"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="sbx-top">
        <span className="step-badge">Paso 4</span>
        <h2 className="sbx-title">¡Tu fuente está lista! <Sparkles size={22} /></h2>
        <p className="sbx-subtitle">Escribe cualquier texto para probarla con tu letra.</p>
      </div>

      {/* Font Name */}
      <div className="sbx-name">
        <label className="sbx-name-label">Nombre de tu fuente</label>
        <input
          type="text"
          value={fontName}
          onChange={(e) => setFontName(e.target.value)}
          placeholder="Ej: Mi Letra Bonita"
          maxLength={30}
          className="sbx-name-input"
        />
      </div>

      {/* Toolbar */}
      <div className="sbx-toolbar">
        <div className="sbx-toolbar-left">
          <button className={`sbx-fmt ${formatState.bold ? 'sbx-fmt--active' : ''}`} onClick={() => formatText('bold')} title="Negrita">
            <Bold size={16} />
          </button>
          <button className={`sbx-fmt ${formatState.italic ? 'sbx-fmt--active' : ''}`} onClick={() => formatText('italic')} title="Cursiva">
            <Italic size={16} />
          </button>
          <button className={`sbx-fmt ${formatState.underline ? 'sbx-fmt--active' : ''}`} onClick={() => formatText('underline')} title="Subrayado">
            <Underline size={16} />
          </button>
          <div className="sbx-toolbar-sep" />
          <div className="sbx-color-wrap">
            <button className="sbx-fmt" onClick={() => setIsColorPickerOpen(!isColorPickerOpen)} title="Color">
              <Palette size={16} />
            </button>
            <AnimatePresence>
              {isColorPickerOpen && (
                <motion.div
                  className="sbx-color-pop"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <span className="sbx-color-title">Color</span>
                  <div className="sbx-color-grid">
                    {['#ffffff', '#9898b0', '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#32ade6', '#007aff', '#af52de', '#ff2d55', '#ff69b4', '#000000'].map(c => (
                      <button
                        key={c}
                        className="sbx-color-swatch"
                        style={{ background: c, border: selectedColor === c ? '2px solid var(--accent-primary)' : '2px solid transparent' }}
                        onClick={() => { setSelectedColor(c); formatText('foreColor', c); setIsColorPickerOpen(false); }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="sbx-toolbar-right">
          <button
            className={`sbx-fmt ${darkCanvas ? 'sbx-fmt--active' : ''}`}
            onClick={() => setDarkCanvas(!darkCanvas)}
            title={darkCanvas ? 'Fondo claro' : 'Fondo oscuro'}
          >
            {darkCanvas ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="sbx-toolbar-sep" />
          <Ruler size={14} />
          <span className="sbx-size-val">{fontSize}px</span>
          <input type="range" min="14" max="80" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="sbx-size-slider" />
          <div className="sbx-toolbar-sep" />
          <span className="sbx-size-label">Espaciado</span>
          <button
            className="sbx-pad-btn"
            onClick={() => handlePaddingChange(Math.max(0, paddingRatio - 2.5))}
            disabled={paddingRatio <= 0}
          >−</button>
          <span className="sbx-size-val">{paddingRatio}%</span>
          <button
            className="sbx-pad-btn"
            onClick={() => handlePaddingChange(Math.min(80, paddingRatio + 2.5))}
            disabled={paddingRatio >= 80}
          >+</button>
        </div>
      </div>

      {/* Editor */}
      <div className={`sbx-editor-wrap ${darkCanvas ? 'sbx-editor-wrap--dark' : ''}`}>
        <div
          ref={previewRef}
          contentEditable
          suppressContentEditableWarning
          onKeyUp={updateFormatState}
          onMouseUp={updateFormatState}
          className="sbx-editor"
          style={{
            fontFamily: fontLoaded ? "'KiruUserFont', serif" : 'serif',
            fontSize: `${fontSize}px`,
          }}
        />
      </div>

      {/* Sample Texts */}
      <div className="sbx-samples">
        <span className="sbx-samples-label">Textos de prueba:</span>
        <button className="sbx-sample" onClick={() => handleSampleText('alphabet')}>Alfabeto y Números</button>
        <button className="sbx-sample" onClick={() => handleSampleText('pangram')}>Pangrama</button>
        <button className="sbx-sample" onClick={() => handleSampleText('pangram2')}>Pangrama 2</button>
        {hasExtended && (
          <>
            <button className="sbx-sample" onClick={() => handleSampleText('symbols')}>Símbolos</button>
            <button className="sbx-sample" onClick={() => handleSampleText('numbers')}>Números</button>
          </>
        )}
      </div>

      {/* Install Guide */}
      <div className="sbx-guide">
        <button className="sbx-guide-header" onClick={() => setIsGuideOpen(!isGuideOpen)}>
          <BookOpen size={18} />
          <span>¿Cómo instalo y uso mi fuente?</span>
          <svg className={`sbx-guide-chevron ${isGuideOpen ? 'sbx-guide-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <AnimatePresence>
          {isGuideOpen && (
            <motion.div
              className="sbx-guide-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="sbx-guide-grid">
                {/* Windows */}
                <div className="sbx-guide-card">
                  <div className="sbx-guide-card-head sbx-guide-card-head--win">
                    <Monitor size={16} />
                    <span>Windows</span>
                  </div>
                  <ol className="sbx-guide-steps">
                    <li>Hacé clic en <strong>Descargar</strong> para guardar el <code>.ttf</code></li>
                    <li>Abre la carpeta de descargas</li>
                    <li>Haz <strong>doble clic</strong> en el archivo</li>
                    <li>Clic en <strong>Instalar</strong> arriba</li>
                    <li>Buscá "{fontName || 'MiLetra'}" en Word, PowerPoint, etc.</li>
                  </ol>
                </div>

                {/* macOS */}
                <div className="sbx-guide-card">
                  <div className="sbx-guide-card-head sbx-guide-card-head--mac">
                    <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                    <span>macOS</span>
                  </div>
                  <ol className="sbx-guide-steps">
                    <li>Descargá el archivo <code>.ttf</code></li>
                    <li>Haz <strong>doble clic</strong> en él</li>
                    <li>Se abre "Catálogo Tipográfico"</li>
                    <li>Clic en <strong>Instalar fuente</strong></li>
                  </ol>
                </div>

                {/* iPad */}
                <div className="sbx-guide-card">
                  <div className="sbx-guide-card-head sbx-guide-card-head--pad">
                    <PenTool size={16} />
                    <span>iPad (Procreate / GoodNotes)</span>
                  </div>
                  <ol className="sbx-guide-steps">
                    <li>Guardá el <code>.ttf</code> en Archivos del iPad</li>
                    <li><strong>Procreate:</strong> Acciones → Añadir → Añadir texto → tocá el nombre de la fuente e importá</li>
                    <li><strong>GoodNotes:</strong> Usá iFont para instalar el perfil y luego úsala</li>
                  </ol>
                </div>

                {/* Google Docs */}
                <div className="sbx-guide-card">
                  <div className="sbx-guide-card-head sbx-guide-card-head--gdoc">
                    <Cloud size={16} />
                    <span>Google Docs</span>
                  </div>
                  <div className="sbx-guide-note">
                    Google Docs no permite subir fuentes personalizadas. Usá <strong>Word Online</strong> o exportá tu texto como imagen.
                  </div>
                </div>

                {/* Canva */}
                <div className="sbx-guide-card">
                  <div className="sbx-guide-card-head sbx-guide-card-head--canva">
                    <svg width="16" height="16" viewBox="0 0 48 48"><defs><linearGradient id="canvaGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00c4cc"/><stop offset="100%" stopColor="#7b2ff7"/></linearGradient></defs><circle cx="24" cy="24" r="24" fill="url(#canvaGrad)"/><text x="24" y="24" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="30" fontWeight="700" fontFamily="Arial,sans-serif">C</text></svg>
                    <span>Canva</span>
                  </div>
                  <ol className="sbx-guide-steps">
                    <li>Descargá el archivo <code>.ttf</code> en tu computadora</li>
                    <li>Abrí Canva y creá un diseño nuevo</li>
                    <li>Agregá un elemento de <strong>Texto</strong></li>
                    <li>En el selector de fuentes, escribí el nombre de tu fuente</li>
                    <li>Si no aparece, subila desde <strong>Subir fuentes</strong> en la pestaña de fuentes</li>
                    <li>Seleccioná tu fuente y ¡escribí!</li>
                  </ol>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="sbx-actions">
        <motion.button className="btn-secondary" onClick={() => setStep('editor')} whileTap={{ scale: 0.97 }}>
          <Pencil size={18} /> Editar caracteres
        </motion.button>
        <motion.button className="btn-secondary" onClick={() => reset()} whileTap={{ scale: 0.97 }}>
          <RefreshCcw size={18} /> Crear otra fuente
        </motion.button>
        <motion.button className="btn-primary sbx-download" onClick={handleDownload} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Download size={18} /> Descargar {fontName || 'MiLetra'}.ttf
        </motion.button>
      </div>
    </motion.div>
  );
}
