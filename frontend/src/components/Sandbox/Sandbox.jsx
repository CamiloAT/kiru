import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Ruler, BookOpen, Pencil, RefreshCcw, Download, ArrowLeft, Bold, Italic, Underline, Palette, Sun, Moon } from 'lucide-react';
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
  const [fontSize, setFontSize] = useState(40);
  const [fontSizeInput, setFontSizeInput] = useState('40');
  const [paddingRatio, setPaddingRatio] = useState(25);
  const [paddingInput, setPaddingInput] = useState('25');
  const [fontLoaded, setFontLoaded] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [formatState, setFormatState] = useState({ bold: false, italic: false, underline: false });
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const generationRef = useRef(0);
  const abortRef = useRef(null);
  const paddingRatioRef = useRef(paddingRatio);
  const previewRef = useRef(null);

  useEffect(() => { paddingRatioRef.current = paddingRatio; }, [paddingRatio]);
  useEffect(() => { setFontSizeInput(String(fontSize)); }, [fontSize]);
  useEffect(() => { setPaddingInput(String(paddingRatio)); }, [paddingRatio]);

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

  const handleDownload = async () => {
    if (!extractedGlyphs) return;
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
          padding_ratio: paddingRatio / 100,
        }),
      });
      if (!res.ok) throw new Error('Error al generar fuente');
      const buf = await res.arrayBuffer();
      setFontBytes(buf);
      const blob = new Blob([buf], { type: 'font/ttf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fontName || 'MiLetra'}.ttf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading:', err);
    } finally {
      setRegenerating(false);
    }
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

          {/* Font Size */}
          <Ruler size={14} />
          <button
            className="sbx-pad-btn"
            onClick={() => setFontSize(Math.max(14, fontSize - 1))}
            disabled={fontSize <= 14}
          >−</button>
          <input
            type="number"
            min="14"
            max="80"
            step="1"
            value={fontSizeInput}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') { setFontSizeInput(''); return; }
              setFontSizeInput(v);
            }}
            onBlur={() => {
              const v = Number(fontSizeInput);
              const clamped = isNaN(v) ? 14 : Math.max(14, Math.min(80, v));
              setFontSize(clamped);
              setFontSizeInput(String(clamped));
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            className="sbx-pad-input"
          />
          <button
            className="sbx-pad-btn"
            onClick={() => setFontSize(Math.min(80, fontSize + 1))}
            disabled={fontSize >= 80}
          >+</button>

          <div className="sbx-toolbar-sep" />

          {/* Padding */}
          <span className="sbx-size-label">Espaciado</span>
          <button
            className="sbx-pad-btn"
            onClick={() => {
              const prev = Math.floor(paddingRatio / 2.5) * 2.5;
              handlePaddingChange(Math.max(0, prev < paddingRatio ? prev : prev - 2.5));
            }}
            disabled={paddingRatio <= 0}
          >−</button>
          <input
            type="number"
            min="0"
            max="80"
            step="2.5"
            value={paddingInput}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') { setPaddingInput(''); return; }
              setPaddingInput(v);
            }}
            onBlur={() => {
              const v = Number(paddingInput);
              const clamped = isNaN(v) ? 0 : Math.max(0, Math.min(80, v));
              setPaddingRatio(clamped);
              setPaddingInput(String(clamped));
              handlePaddingChange(clamped);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            className="sbx-pad-input"
          />
          <button
            className="sbx-pad-btn"
            onClick={() => {
              const next = Math.ceil(paddingRatio / 2.5) * 2.5;
              handlePaddingChange(Math.min(80, next > paddingRatio ? next : next + 2.5));
            }}
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
                    <img src="/windows.svg" width="16" height="16" alt="Windows" />
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
                    <img src="/apple.svg" width="16" height="16" alt="macOS" />
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
                    <img src="/procreate.svg" width="16" height="16" alt="iPad" />
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
                    <img src="/docs.svg" width="16" height="16" alt="Google Docs" />
                    <span>Google Docs</span>
                  </div>
                  <div className="sbx-guide-note">
                    Google Docs no permite subir fuentes personalizadas. Usá <strong>Word Online</strong> o exportá tu texto como imagen.
                  </div>
                </div>

                {/* Canva */}
                <div className="sbx-guide-card">
                  <div className="sbx-guide-card-head sbx-guide-card-head--canva">
                    <img src="/canva.svg" width="16" height="16" alt="Canva" />
                    <span>Canva</span>
                  </div>
                  <div className="sbx-guide-note">
                    Se requiere suscripción <strong>Canva Pro</strong> para subir fuentes personalizadas.
                  </div>
                  <ol className="sbx-guide-steps">
                    <li>Descargá el archivo <code>.ttf</code> y descomprimilo en tu computadora</li>
                    <li>En Canva, ve al menú lateral izquierdo y hacé clic en <strong>Marca</strong> (o "Más" y luego "Marca")</li>
                    <li>Desplazate hasta la sección <strong>Fuentes</strong> y hacé clic en el ícono <strong>Añadir (+)</strong></li>
                    <li>Hacé clic en <strong>Subir una fuente</strong>, elegí el archivo <code>.ttf</code> y pulsá <strong>Abrir</strong></li>
                    <li>Confirmá los derechos de uso y esperá a que termine de cargarse</li>
                    <li>Seleccioná tu fuente en cualquier diseño de Canva</li>
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
