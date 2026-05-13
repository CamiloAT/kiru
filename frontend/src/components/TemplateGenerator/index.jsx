import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';
import useAppStore from '../../store/useAppStore';
import './TemplateGenerator.css';

const TEMPLATE_CONFIGS = {
  full: {
    label: 'Completa (Español)',
    description: 'A-Z, a-z, 0-9 y símbolos con ñ, tildes',
    chars: [
      ...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split(''),
      ...'abcdefghijklmnñopqrstuvwxyz'.split(''),
      ...'0123456789'.split(''),
      ...'.,:;!¡?¿\'"()-áéíóúü'.split(''),
    ],
    cols: 9,
  },
  uppercase: {
    label: 'Solo Mayúsculas',
    description: 'A-Z incluyendo la Ñ',
    chars: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split(''),
    cols: 9,
  },
  lowercase: {
    label: 'Solo Minúsculas',
    description: 'a-z incluyendo la ñ',
    chars: 'abcdefghijklmnñopqrstuvwxyz'.split(''),
    cols: 9,
  },
  digits: {
    label: 'Solo Números',
    description: '0-9',
    chars: '0123456789'.split(''),
    cols: 5,
  },
};

export default function TemplateGenerator() {
  const { templateType, setTemplateType, setStep, fontName, setFontName } = useAppStore();
  const [generating, setGenerating] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('pdf');

  const generatePDF = () => {
    setGenerating(true);

    const config = TEMPLATE_CONFIGS[templateType];
    const { chars, cols } = config;
    const rows = Math.ceil(chars.length / cols);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const marginX = 15;
    const marginY = 30;
    const gridW = pageW - marginX * 2;
    const cellSize = Math.min(gridW / cols, (pageH - marginY * 2) / (rows + 1));
    const gridStartX = (pageW - cellSize * cols) / 2;
    const gridStartY = marginY + 10;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Kiru — Plantilla de Escritura', pageW / 2, 15, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Escribe cada carácter dentro de su celda con un marcador oscuro.', pageW / 2, 22, { align: 'center' });
    doc.setTextColor(0);

    // Draw grid
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);

    for (let i = 0; i < chars.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridStartX + col * cellSize;
      const y = gridStartY + row * cellSize;
      const boxSize = cellSize * 0.8;
      const padding = cellSize * 0.2;
      const boxX = x + padding / 2;
      const boxY = y + padding;

      // Cell border
      doc.rect(boxX, boxY, boxSize, boxSize);

      // Character label (small, above cell)
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(chars[i], boxX, boxY - 0.8);
    }

    // Registration marks (corner squares for alignment)
    const markSize = 5;
    doc.setFillColor(0);
    doc.rect(5, 5, markSize, markSize, 'F');
    doc.rect(pageW - 5 - markSize, 5, markSize, markSize, 'F');
    doc.rect(5, pageH - 5 - markSize, markSize, markSize, 'F');
    doc.rect(pageW - 5 - markSize, pageH - 5 - markSize, markSize, markSize, 'F');

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Fuente: ${fontName} | Tipo: ${config.label} | kiru.app`, pageW / 2, pageH - 8, { align: 'center' });

    doc.save(`kiru-plantilla-${templateType}.pdf`);
    setGenerating(false);
  };

  const generateImage = (format) => {
    setGenerating(true);
    setTimeout(() => {
      const config = TEMPLATE_CONFIGS[templateType];
      const { chars, cols } = config;
      const rows = Math.ceil(chars.length / cols);

      const canvas = document.createElement('canvas');
      // A4 at 300 DPI
      const width = 2480;
      const height = 3508;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Scale mm to pixels (1 mm = 11.811 pixels at 300 DPI)
      const scale = 11.811;
      const mmToPx = (mm) => mm * scale;

      const pageW = mmToPx(210);
      const pageH = mmToPx(297);
      const marginX = mmToPx(15);
      const marginY = mmToPx(30);
      const gridW = pageW - marginX * 2;
      const cellSize = Math.min(gridW / cols, (pageH - marginY * 2) / (rows + 1));
      const gridStartX = (pageW - cellSize * cols) / 2;
      const gridStartY = marginY + mmToPx(10);

      // Title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 64px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Kiru — Plantilla de Escritura', pageW / 2, mmToPx(15));

      ctx.font = 'normal 32px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#787878';
      ctx.fillText('Escribe cada carácter dentro de su celda con un marcador oscuro.', pageW / 2, mmToPx(22));

      // Draw grid
      ctx.strokeStyle = '#b4b4b4';
      ctx.lineWidth = mmToPx(0.3);

      for (let i = 0; i < chars.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = gridStartX + col * cellSize;
        const y = gridStartY + row * cellSize;
        const boxSize = cellSize * 0.8;
        const padding = cellSize * 0.2;
        const boxX = x + padding / 2;
        const boxY = y + padding;

        // Cell border
        ctx.strokeRect(boxX, boxY, boxSize, boxSize);

        // Character label (above the box)
        ctx.font = '24px Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#646464';
        ctx.textAlign = 'left';
        ctx.fillText(chars[i], boxX, boxY - mmToPx(0.8));
      }

      // Registration marks
      const markSize = mmToPx(5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(mmToPx(5), mmToPx(5), markSize, markSize);
      ctx.fillRect(pageW - mmToPx(5) - markSize, mmToPx(5), markSize, markSize);
      ctx.fillRect(mmToPx(5), pageH - mmToPx(5) - markSize, markSize, markSize);
      ctx.fillRect(pageW - mmToPx(5) - markSize, pageH - mmToPx(5) - markSize, markSize, markSize);

      // Footer
      ctx.font = '24px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#969696';
      ctx.textAlign = 'center';
      ctx.fillText(`Fuente: ${fontName} | Tipo: ${config.label} | kiru.app`, pageW / 2, pageH - mmToPx(8));

      // Download
      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, 1.0);
      const link = document.createElement('a');
      link.download = `kiru-plantilla-${templateType}.${format}`;
      link.href = dataUrl;
      link.click();

      setGenerating(false);
    }, 100);
  };

  return (
    <motion.div
      className="template-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="template-header">
        <span className="step-badge">Paso 1</span>
        <h2>Descarga tu Plantilla</h2>
        <p>Elige el tipo de plantilla, imprímela, y escribe cada letra con un marcador oscuro.</p>
      </div>

      {/* Font Name Input */}
      <div className="font-name-input">
        <label htmlFor="fontNameInput">Nombre de tu fuente</label>
        <input
          id="fontNameInput"
          type="text"
          value={fontName}
          onChange={(e) => setFontName(e.target.value)}
          placeholder="Ej: Mi Letra Bonita"
          maxLength={30}
        />
      </div>

      {/* Template Type Cards */}
      <div className="template-options">
        {Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => (
          <motion.button
            key={key}
            className={`template-card ${templateType === key ? 'active' : ''}`}
            onClick={() => setTemplateType(key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="template-card-label">{config.label}</span>
            <span className="template-card-desc">{config.description}</span>
            <span className="template-card-count">{config.chars.length} caracteres</span>
          </motion.button>
        ))}
      </div>

      {/* Preview of characters */}
      <div className="template-preview">
        <h4>Caracteres incluidos:</h4>
        <div className="char-grid">
          {TEMPLATE_CONFIGS[templateType].chars.map((c, i) => (
            <span key={i} className="char-cell">{c}</span>
          ))}
        </div>
      </div>

      {/* Format Selector */}
      <div className="format-selector">
        <span className="format-label">Formato de descarga:</span>
        <div className="format-options">
          {['pdf', 'png', 'jpg'].map(fmt => (
            <label key={fmt} className={`format-radio ${downloadFormat === fmt ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="format" 
                value={fmt} 
                checked={downloadFormat === fmt} 
                onChange={() => setDownloadFormat(fmt)} 
                style={{ display: 'none' }}
              />
              {fmt.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="template-actions">
        <motion.button
          className="btn-primary"
          onClick={() => {
            if (downloadFormat === 'pdf') generatePDF();
            else generateImage(downloadFormat);
          }}
          disabled={generating}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {generating ? '⏳ Generando...' : `📄 Descargar Plantilla ${downloadFormat.toUpperCase()}`}
        </motion.button>

        <motion.button
          className="btn-secondary"
          onClick={() => setStep('upload')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Ya tengo mi plantilla lista →
        </motion.button>
      </div>
    </motion.div>
  );
}
