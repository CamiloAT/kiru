import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Move, Eraser, Pencil, ZoomIn, RotateCcw, Save, X, Undo2, Redo2 } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { TEMPLATE_CONFIGS } from '../../utils/TemplateConfigs';
import './Editor.css';

const TOOLS = [
  { id: 'move', label: 'Mover', icon: Move },
  { id: 'erase', label: 'Borrar', icon: Eraser },
  { id: 'draw', label: 'Dibujar', icon: Pencil },
  { id: 'scale', label: 'Escalar', icon: ZoomIn },
];

const CANVAS_SIZE = 240;

export default function Editor() {
  const { templateType, extractedGlyphs, updateExtractedGlyph, setStep, fontName, setFontBytes, isGenerating, setGenerating } = useAppStore();
  const [selectedChar, setSelectedChar] = useState(null);
  const [activeTool, setActiveTool] = useState('move');
  const [brushSize, setBrushSize] = useState(20);
  const brushSizeRef = useRef(20);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  const canvasRef = useRef(null);
  const glyphImageRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const canvasScaleRef = useRef(1);
  const moveSnapshotRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const chars = TEMPLATE_CONFIGS[templateType]?.chars || [];
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(data);
    if (historyRef.current.length > 50) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const restoreFromHistory = useCallback((index) => {
    const canvas = canvasRef.current;
    if (!canvas || index < 0 || index >= historyRef.current.length) return;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(historyRef.current[index], 0, 0);
    historyIndexRef.current = index;
    setCanUndo(index > 0);
    setCanRedo(index < historyRef.current.length - 1);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) restoreFromHistory(historyIndexRef.current - 1);
  }, [restoreFromHistory]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) restoreFromHistory(historyIndexRef.current + 1);
  }, [restoreFromHistory]);

  // Load glyph image when selected char changes
  useEffect(() => {
    if (!selectedChar || !extractedGlyphs?.[selectedChar]) {
      glyphImageRef.current = null;
      return;
    }

    const img = new Image();
    img.onload = () => {
      glyphImageRef.current = img;
      setOffset({ x: 0, y: 0 });
      setScale(1);
      scaleRef.current = 1;
      dragOffsetRef.current = { x: 0, y: 0 };
      moveSnapshotRef.current = null;
      renderCanvas(img, { x: 0, y: 0 }, 1);
      historyRef.current = [];
      historyIndexRef.current = -1;
      saveToHistory();
    };
    img.src = extractedGlyphs[selectedChar];
  }, [selectedChar, extractedGlyphs]);

  // Track canvas display size to scale cursor correctly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateScale = () => {
      const rect = canvas.getBoundingClientRect();
      const s = rect.width / CANVAS_SIZE;
      canvasScaleRef.current = s;
      setCanvasScale(s);
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [selectedChar]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedChar) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedChar, undo, redo]);

  const renderCanvas = useCallback((img, off, sc) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const drawW = img.width * sc;
    const drawH = img.height * sc;
    const x = (CANVAS_SIZE - drawW) / 2 + off.x;
    const baselineTarget = CANVAS_SIZE * 0.75;
    const baselineInImage = img.height * 0.775;
    const y = baselineTarget - baselineInImage * sc + off.y;
    ctx.drawImage(img, x, y, drawW, drawH);
  }, []);

  const openModal = (char) => {
    setSelectedChar(char);
    setActiveTool('move');
    setShowConfirm(false);
  };

  // ===== MOUSE HANDLERS =====
  const handleMouseDown = useCallback((e) => {
    if (!selectedChar) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (activeTool === 'move') {
      e.preventDefault();
      const canvas = canvasRef.current;
      const snap = document.createElement('canvas');
      snap.width = CANVAS_SIZE;
      snap.height = CANVAS_SIZE;
      snap.getContext('2d').drawImage(canvas, 0, 0);
      moveSnapshotRef.current = snap;
      setIsDragging(true);
      setDragStart({
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      });
    }

    if (activeTool === 'erase' || activeTool === 'draw') {
      e.preventDefault();
      setIsDrawing(true);
      const x = ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE;
      const y = ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE;
      paintAt(x, y);
    }
  }, [activeTool, selectedChar]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (activeTool === 'erase' || activeTool === 'draw') {
      setCursorPos({ x: e.clientX, y: e.clientY });
    }

    if (isDragging && activeTool === 'move' && moveSnapshotRef.current) {
      const newOff = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.drawImage(moveSnapshotRef.current, newOff.x, newOff.y);
      dragOffsetRef.current = newOff;
      setOffset(newOff);
    }

    if (isDrawing && (activeTool === 'erase' || activeTool === 'draw')) {
      const x = ((e.clientX - rect.left) / rect.width) * CANVAS_SIZE;
      const y = ((e.clientY - rect.top) / rect.height) * CANVAS_SIZE;
      paintAt(x, y);
    }
  }, [isDragging, isDrawing, activeTool, dragStart]);

  const handleMouseUp = useCallback(() => {
    const wasDrawing = isDrawing;
    const wasDragging = isDragging;
    setIsDragging(false);
    setIsDrawing(false);
    moveSnapshotRef.current = null;
    if (wasDrawing || wasDragging) saveToHistory();
  }, [isDrawing, isDragging, saveToHistory]);

  const paintAt = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = brushSizeRef.current;
    ctx.save();
    if (activeTool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000000';
    }
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // ===== SCALE =====
  const handleScaleChange = (newScale) => {
    setScale(newScale);
    scaleRef.current = newScale;
    if (glyphImageRef.current) {
      renderCanvas(glyphImageRef.current, offset, newScale);
      saveToHistory();
    }
  };

  // ===== RESET =====
  const resetCanvas = () => {
    if (glyphImageRef.current) {
      setOffset({ x: 0, y: 0 });
      setScale(1);
      scaleRef.current = 1;
      dragOffsetRef.current = { x: 0, y: 0 };
      renderCanvas(glyphImageRef.current, { x: 0, y: 0 }, 1);
      saveToHistory();
    }
  };

  // ===== SAVE =====
  const requestSave = () => {
    setShowConfirm(true);
  };

  const confirmSave = () => {
    const canvas = canvasRef.current;
    if (canvas && selectedChar) {
      const dataUrl = canvas.toDataURL('image/png');
      updateExtractedGlyph(selectedChar, dataUrl);
    }
    setShowConfirm(false);
    setSelectedChar(null);
  };

  const cancelSave = () => {
    setShowConfirm(false);
  };

  const closeModal = () => {
    setShowConfirm(false);
    setSelectedChar(null);
  };

  // ===== GENERATE FONT =====
  const handleGenerateFont = async () => {
    if (!extractedGlyphs || Object.keys(extractedGlyphs).length === 0) return;
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-from-glyphs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glyphs: extractedGlyphs,
          font_name: fontName || 'MiLetra',
          template_type: templateType,
          smooth: true,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Error al generar la fuente' }));
        throw new Error(err.detail || 'Error al generar la fuente');
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      setFontBytes(arrayBuffer);
      setStep('sandbox');
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getCanvasClassName = () => {
    const classes = ['canvas-container'];
    if (activeTool === 'move') classes.push('tool-move');
    if (activeTool === 'erase') classes.push('tool-erase');
    if (activeTool === 'draw') classes.push('tool-draw');
    if (activeTool === 'scale') classes.push('tool-scale');
    if (isDragging) classes.push('is-dragging');
    return classes.join(' ');
  };

  const needsBrush = activeTool === 'erase' || activeTool === 'draw';

  return (
    <motion.div
      className="editor-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="template-header">
        <span className="step-badge">Paso 3</span>
        <h2 style={{ background: 'none', WebkitTextFillColor: 'var(--text-primary)' }}>Afinar Letras</h2>
        <p>Revisa cada carácter. Ajusta la posición, borra imperfecciones, dibuja detalles o escala si es necesario.</p>
      </div>

      {/* Char Grid */}
      <div className="editor-grid-container">
        <div className="char-grid">
          {chars.map((char, idx) => (
            <div key={idx} className="char-cell-wrapper" onClick={() => openModal(char)}>
              <div className="char-cell">
                {extractedGlyphs?.[char] ? (
                  <img src={extractedGlyphs[char]} alt={char} className="char-image" />
                ) : (
                  <span className="char-placeholder">{char}</span>
                )}
              </div>
              <span className="char-label">{char}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {selectedChar && (
          <motion.div
            className="char-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="char-modal-content"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header">
                <div className="modal-title">
                  <span className="modal-char-name">{selectedChar}</span>
                </div>
                <button className="modal-close-btn" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              {/* Tool Tabs */}
              <div className="modal-tool-tabs">
                {TOOLS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    className={`modal-tool-tab ${activeTool === id ? 'active' : ''}`}
                    onClick={() => setActiveTool(id)}
                  >
                    <Icon size={13} />
                    <span>{label}</span>
                  </button>
                ))}
                <div className="modal-history-divider" />
                <button className="modal-history-btn" onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)">
                  <Undo2 size={14} />
                </button>
                <button className="modal-history-btn" onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)">
                  <Redo2 size={14} />
                </button>
                <button className="modal-reset-tab" onClick={resetCanvas} title="Restablecer original">
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Tool Options */}
              {(activeTool === 'erase' || activeTool === 'draw') && (
                <div className="modal-tool-options">
                  <div className="option-group">
                    <label>Tamaño: {brushSize}px</label>
                    <input
                      type="range"
                      min="4"
                      max="80"
                      value={brushSize}
                      onChange={(e) => { const v = Number(e.target.value); setBrushSize(v); brushSizeRef.current = v; }}
                    />
                  </div>
                </div>
              )}

              {activeTool === 'scale' && (
                <div className="modal-tool-options">
                  <div className="option-group">
                    <label>Escala: {Math.round(scale * 100)}%</label>
                    <input
                      type="range"
                      min="30"
                      max="250"
                      value={scale * 100}
                      onChange={(e) => handleScaleChange(Number(e.target.value) / 100)}
                    />
                  </div>
                </div>
              )}

              {activeTool === 'move' && (
                <div className="modal-tool-hint">
                  Arrastra para reposicionar el carácter
                </div>
              )}

              {/* Canvas */}
              <div
                className={getCanvasClassName()}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { handleMouseUp(); setShowCursor(false); }}
                onMouseEnter={() => needsBrush && setShowCursor(true)}
              >
                <div className="canvas-guidelines">
                  <span className="guideline top" />
                  <span className="guideline middle" />
                  <span className="guideline baseline" />
                  <span className="guideline descender" />
                </div>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                />
              </div>

              {/* Brush cursor */}
              {needsBrush && showCursor && (
                <div
                  className="brush-cursor"
                  style={{
                    left: cursorPos.x,
                    top: cursorPos.y,
                    width: brushSize * canvasScale,
                    height: brushSize * canvasScale,
                  }}
                />
              )}

              {/* Actions */}
              <div className="modal-actions">
                <button className="modal-btn-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="modal-btn-save" onClick={requestSave}>
                  <Check size={16} /> Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="confirm-dialog"
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <h4>Confirmar guardado</h4>
              <p>Se guardará el cambio en <b>{selectedChar}</b>. Deseas continuar?</p>
              <div className="confirm-actions">
                <button className="modal-btn-cancel" onClick={cancelSave}>
                  Seguir editando
                </button>
                <button className="modal-btn-save" onClick={confirmSave}>
                  <Check size={14} /> Sí, guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="template-actions">
        <button className="btn-secondary flex items-center gap-2" onClick={() => setStep('upload')}>
          <ArrowLeft size={18} /> Volver
        </button>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={handleGenerateFont}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <><span className="spinner" /> Generando...</>
          ) : (
            <>Generar Fuente Final <Save size={18} /></>
          )}
        </button>
      </div>
    </motion.div>
  );
}
