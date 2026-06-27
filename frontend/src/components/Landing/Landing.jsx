import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown, Sparkles, PenTool, Pen, Pencil, Feather, Scan, Download, Globe, AtSign, Mail } from 'lucide-react';
import './Landing.css';

const STEPS = [
  {
    num: '01',
    label: 'Paso 1',
    title: 'Escribe cada letra',
    desc: 'Descarga la plantilla, imprimila y escribe cada caracter con un marcador oscuro dentro de las celdas.',
    img: '/step-1.png',
  },
  {
    num: '02',
    label: 'Paso 2',
    title: 'Escanea y sube',
    desc: 'Toma una foto o escanea la plantilla. Subila a la plataforma y ajusta brillo, contraste y rotacion.',
    img: '/step-2.png',
  },
  {
    num: '03',
    label: 'Paso 3',
    title: 'Afinar tus letras',
    desc: 'Revisa los caracteres extraidos, mueve, borra o dibuja para que cada glyph quede perfecto.',
    img: '/step-3.png',
  },
  {
    num: '04',
    label: 'Paso 4',
    title: 'Descarga tu fuente',
    desc: 'Previsualiza tu fuente en la sandbox y descarga el archivo .TTF listo para usar.',
    img: '/step-4.png',
  },
];

const SHOWCASE = [
  { name: 'Maria手写', preview: 'Hola, como estas? Todo bien por aca.', chars: '83 caracteres' },
  { name: 'Luca Script', preview: 'The quick brown fox jumps over the lazy dog.', chars: '67 caracteres' },
  { name: ' notas de ana', preview: 'Querido diario, hoy fue un dia increible.', chars: '72 caracteres' },
  { name: 'Brush stroke', preview: 'Creatividad sin limites es lo que nos define.', chars: '91 caracteres' },
  { name: 'Cursive Flow', preview: 'Amor, paz y buena vibra para todos.', chars: '58 caracteres' },
  { name: 'Sketch Pen', preview: 'Los sueños se hacen realidad con accion.', chars: '76 caracteres' },
];

const USECASES = [
  {
    icon: <Sparkles size={22} />,
    title: 'Redes sociales',
    desc: 'Destaca en Instagram, TikTok o Twitter con una tipografia unica que nadie mas tiene.',
  },
  {
    icon: <PenTool size={22} />,
    title: 'Branding personal',
    desc: 'Crea tu marca personal con una fuente que cuente tu historia de forma autentica.',
  },
  {
    icon: <Mail size={22} />,
    title: 'Manuscritas para eventos',
    desc: 'Invitaciones de casamiento, tarjetas de agradecimiento, certificados con tu toque personal.',
  },
  {
    icon: <Sparkles size={22} />,
    title: 'Notas creativas',
    desc: 'Cuadernos de bullet journal, stickers, scrapbooking y proyectos artesanales.',
  },
];

const TESTIMONIALS = [
  {
    text: 'Use mi letra para crear la fuente de mi marca de reposteria. Mis clientes no pueden creer que sea escrita a mano.',
    name: 'Camila Rodriguez',
    role: 'Diseñadora grafica',
    initials: 'CR',
  },
  {
    text: 'Increible como mis notas de clase se ven ahora con mi propia fuente. Es como tener un estilo propio digital.',
    name: 'Lucas Fernandez',
    role: 'Estudiante de diseño',
    initials: 'LF',
  },
  {
    text: 'Hice las invitaciones de casamiento con la fuente de mi novia. Fue un detalle unico y muy emotivo.',
    name: 'Sofia Martinez',
    role: 'Organizadora de eventos',
    initials: 'SM',
  },
];

function useScrollReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function Landing() {
  const navigate = useNavigate();
  const containerRef = useScrollReveal();

  const goToApp = () => navigate('/template');

  return (
    <div className="landing" ref={containerRef}>
      {/* Ambient flares */}
      <div className="flares">
        <div className="flare flare--1" />
        <div className="flare flare--2" />
        <div className="flare flare--3" />
        <div className="flare flare--4" />
        <div className="flare flare--5" />
        <div className="flare flare--6" />
        <div className="flare flare--7" />
        <div className="flare flare--8" />
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="hero-title">
            <span className="hero-title-gradient">Tu letra, tu fuente.</span>
          </h1>
          <p className="hero-subtitle">
            Convierte tu letra manuscrita en una fuente digital descargable. Un proceso simple en cuatro pasos.
          </p>
          <div className="hero-cta">
            <motion.button
              className="btn-primary"
              onClick={goToApp}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Crear mi fuente
            </motion.button>
          </div>
        </motion.div>

        <div className="hero-scroll">
          <span>Scroll</span>
          <ArrowDown size={16} />
        </div>
      </section>

      {/* How it Works */}
      <div className="how-wrapper">
      <section className="how">
        <div className="how-floats">
          <span className="how-flt how-flt--1">Aa</span>
          <span className="how-flt how-flt--2">Bb</span>
          <span className="how-flt how-flt--icon how-flt--3"><Pen size={40} strokeWidth={1.5} /></span>
          <span className="how-flt how-flt--4">Gg</span>
          <span className="how-flt how-flt--icon how-flt--5"><Feather size={34} strokeWidth={1.5} /></span>
          <span className="how-flt how-flt--6">Kk</span>
          <span className="how-flt how-flt--icon how-flt--7"><Pencil size={36} strokeWidth={1.5} /></span>
          <span className="how-flt how-flt--8">Qq</span>
          <span className="how-flt how-flt--icon how-flt--9"><PenTool size={32} strokeWidth={1.5} /></span>
          <span className="how-flt how-flt--10">Zz</span>
        </div>

        <div className="section-header reveal">
          <span className="section-badge">Como funciona</span>
          <h2 className="section-title">Cuatro pasos simples</h2>
          <p className="section-subtitle">Desde tu letra manuscrita hasta una fuente digital en minutos.</p>
        </div>

        <div className="how-steps">
          {STEPS.map((step, i) => (
            <div className="how-step" key={i}>
              <div className="how-step-num reveal-left">{step.num}</div>
              <div className="how-step-content reveal">
                <span className="how-step-label">{step.label}</span>
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-desc">{step.desc}</p>
              </div>
              <div className="how-step-visual reveal-right">
                <img src={step.img} alt={step.title} className="how-step-img" />
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* Showcase */}
      <section className="showcase">
        <div className="showcase-inner">
          <div className="section-header reveal">
            <span className="section-badge">Galeria</span>
            <h2 className="section-title">Fuentes creadas por usuarios</h2>
            <p className="section-subtitle">Cada fuente es unica, reflejando la personalidad de quien la escribio.</p>
          </div>

          <div className="showcase-scroll">
            {SHOWCASE.map((item, i) => (
              <div className="showcase-card" key={i}>
                <span className="showcase-card-name">{item.name}</span>
                <div className="showcase-card-preview">{item.preview}</div>
                <span className="showcase-card-meta">{item.chars}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="usecases">
        <div className="section-header reveal">
          <span className="section-badge">Usos</span>
          <h2 className="section-title">¿Para que sirve?</h2>
          <p className="section-subtitle">Posibilidades infinitas con tu propia tipografia.</p>
        </div>

        <div className="usecases-grid">
          {USECASES.map((uc, i) => (
            <div className="usecase-card reveal" key={i}>
              <div className="usecase-icon">{uc.icon}</div>
              <h3 className="usecase-title">{uc.title}</h3>
              <p className="usecase-desc">{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="testimonials-inner">
          <div className="section-header reveal">
            <span className="section-badge">Testimonios</span>
            <h2 className="section-title">Lo que dicen nuestros usuarios</h2>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="testimonial-card reveal" key={i}>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-final">
        <div className="cta-final-bg" />
        <span className="cta-float cta-float--1">Aa</span>
        <span className="cta-float cta-float--2">Kk</span>

        <div className="cta-final-content reveal">
          <h2 className="cta-final-title">
            <span className="hero-title-gradient">Crea tu fuente ahora</span>
          </h2>
          <p className="cta-final-subtitle">Tu letra merece convertirse en una fuente. Empeza hoy.</p>
          <motion.button
            className="btn-primary"
            onClick={goToApp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Empezar
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <img src="/kiru-logo.png" alt="Kiru" className="footer-logo" />
        <div className="footer-links">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-link">
            <Globe size={16} /> GitHub
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-link">
            <AtSign size={16} /> Instagram
          </a>
          <a href="mailto:hola@kiru.app" className="footer-link">
            <Mail size={16} /> Contacto
          </a>
        </div>
        <span className="footer-copy">&copy; 2025 Kiru</span>
      </footer>
    </div>
  );
}
