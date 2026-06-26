import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';
import { Loader2, Download, ArrowRight, Globe, Type, CaseUpper, CaseLower, Hash } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { TEMPLATE_CONFIGS } from '../../utils/TemplateConfigs';
import './TemplateGenerator.css';

const ICONS = {
  extended: <Globe size={20} />,
  full: <Type size={20} />,
  uppercase: <CaseUpper size={20} />,
  lowercase: <CaseLower size={20} />,
  digits: <Hash size={20} />,
};

const templateKeys = Object.keys(TEMPLATE_CONFIGS);

export default function TemplateGenerator() {
  const { templateType, setTemplateType, setStep } = useAppStore();
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
    const marginX = 25;
    const marginY = 35;
    const gridW = pageW - marginX * 2;
    const cellSize = Math.min(gridW / cols, (pageH - marginY * 2) / (rows + 1));
    const gridStartX = (pageW - cellSize * cols) / 2;
    const gridStartY = marginY + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Kiru — Plantilla de Escritura', pageW / 2, 15, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Escribe cada carácter dentro de su celda con un marcador oscuro.', pageW / 2, 22, { align: 'center' });
    doc.setTextColor(0);

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

      doc.rect(boxX, boxY, boxSize, boxSize);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(chars[i], boxX, boxY - 0.8);
    }

    const markSize = 5;
    doc.setFillColor(0);
    doc.rect(5, 5, markSize, markSize, 'F');
    doc.rect(pageW - 5 - markSize, 5, markSize, markSize, 'F');
    doc.rect(5, pageH - 5 - markSize, markSize, markSize, 'F');
    doc.rect(pageW - 5 - markSize, pageH - 5 - markSize, markSize, markSize, 'F');

    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Tipo: ${config.label} | kiru.app`, pageW / 2, pageH - 8, { align: 'center' });

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
      const width = 2480;
      const height = 3508;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const scale = 11.811;
      const mmToPx = (mm) => mm * scale;

      const pageW = mmToPx(210);
      const pageH = mmToPx(297);
      const marginX = mmToPx(25);
      const marginY = mmToPx(35);
      const gridW = pageW - marginX * 2;
      const cellSize = Math.min(gridW / cols, (pageH - marginY * 2) / (rows + 1));
      const gridStartX = (pageW - cellSize * cols) / 2;
      const gridStartY = marginY + mmToPx(10);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 64px Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Kiru — Plantilla de Escritura', pageW / 2, mmToPx(15));

      ctx.font = 'normal 32px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#787878';
      ctx.fillText('Escribe cada carácter dentro de su celda con un marcador oscuro.', pageW / 2, mmToPx(22));

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

        ctx.strokeRect(boxX, boxY, boxSize, boxSize);
        ctx.font = '24px Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#646464';
        ctx.textAlign = 'left';
        ctx.fillText(chars[i], boxX, boxY - mmToPx(0.8));
      }

      const markSize = mmToPx(5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(mmToPx(5), mmToPx(5), markSize, markSize);
      ctx.fillRect(pageW - mmToPx(5) - markSize, mmToPx(5), markSize, markSize);
      ctx.fillRect(mmToPx(5), pageH - mmToPx(5) - markSize, markSize, markSize);
      ctx.fillRect(pageW - mmToPx(5) - markSize, pageH - mmToPx(5) - markSize, markSize, markSize);

      ctx.font = '24px Helvetica, Arial, sans-serif';
      ctx.fillStyle = '#969696';
      ctx.textAlign = 'center';
      ctx.fillText(`Tipo: ${config.label} | kiru.app`, pageW / 2, pageH - mmToPx(8));

      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, 1.0);
      const link = document.createElement('a');
      link.download = `kiru-plantilla-${templateType}.${format}`;
      link.href = dataUrl;
      link.click();

      setGenerating(false);
    }, 100);
  };

  const config = TEMPLATE_CONFIGS[templateType];
  const charSections = [
    { label: 'Mayúsculas', chars: config.chars.filter(c => c >= 'A' && c <= 'Z') },
    { label: 'Minúsculas', chars: config.chars.filter(c => c >= 'a' && c <= 'z') },
    { label: 'Números', chars: config.chars.filter(c => c >= '0' && c <= '9') },
    { label: 'Símbolos', chars: config.chars.filter(c => !/[A-Za-z0-9]/.test(c)) },
  ].filter(s => s.chars.length > 0);

  return (
    <motion.div
      className="tpl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="tpl-top">
        <span className="step-badge">Paso 1</span>
        <h2 className="tpl-title">Descargá tu plantilla</h2>
        <p className="tpl-subtitle">Seleccioná el tipo, imprímelo y escriba cada letra con marcador oscuro.</p>
      </div>

      {/* Template Type Selector */}
      <div className="tpl-types">
        {templateKeys.map((key) => {
          const c = TEMPLATE_CONFIGS[key];
          const active = templateType === key;
          return (
            <motion.button
              key={key}
              className={`tpl-type ${active ? 'tpl-type--active' : ''}`}
              onClick={() => setTemplateType(key)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className={`tpl-type-icon ${active ? 'tpl-type-icon--active' : ''}`}>
                {ICONS[key]}
              </div>
              <div className="tpl-type-info">
                <span className="tpl-type-name">{c.label}</span>
                <span className="tpl-type-desc">{c.description}</span>
              </div>
              <span className={`tpl-type-count ${active ? 'tpl-type-count--active' : ''}`}>
                {c.chars.length}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Character Preview */}
      <div className="tpl-chars">
        <div className="tpl-chars-header">
          <span className="tpl-chars-title">Caracteres incluidos</span>
          <span className="tpl-chars-total">{config.chars.length} en total</span>
        </div>
        {charSections.map((section) => (
          <div key={section.label} className="tpl-chars-section">
            <span className="tpl-chars-label">{section.label}</span>
            <div className="tpl-chars-grid">
              {section.chars.map((c, i) => (
                <span key={i} className="tpl-char">{c === ' ' ? '·' : c}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Download */}
      <div className="tpl-bottom">
        <div className="tpl-format">
          {['pdf', 'png', 'jpg'].map((fmt) => (
            <button
              key={fmt}
              className={`tpl-format-btn ${downloadFormat === fmt ? 'tpl-format-btn--active' : ''}`}
              onClick={() => setDownloadFormat(fmt)}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="tpl-actions">
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
            {generating ? (
              <><Loader2 className="spinner" size={18} /> Generando…</>
            ) : (
              <><Download size={18} /> Descargar {downloadFormat.toUpperCase()}</>
            )}
          </motion.button>
          <motion.button
            className="btn-secondary"
            onClick={() => setStep('upload')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Ya tengo mi plantilla <ArrowRight size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
