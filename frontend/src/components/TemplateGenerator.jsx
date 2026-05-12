import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';
import useAppStore from '../store/useAppStore';
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

      // Cell border
      doc.rect(x, y, cellSize, cellSize);

      // Character label (small, top-left of cell)
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(chars[i], x + 1.5, y + 4);
      doc.setTextColor(0);

      // Baseline guide (dotted line at 75% of cell height)
      const baseY = y + cellSize * 0.75;
      doc.setDrawColor(220);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(x + 2, baseY, x + cellSize - 2, baseY);
      doc.setLineDashPattern([], 0);
      doc.setDrawColor(180);
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

      {/* Actions */}
      <div className="template-actions">
        <motion.button
          className="btn-primary"
          onClick={generatePDF}
          disabled={generating}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {generating ? '⏳ Generando...' : '📄 Descargar Plantilla PDF'}
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
