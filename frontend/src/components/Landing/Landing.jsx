import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown, Sparkles, PenTool, Pen, Pencil, Feather, Scan, Download, Mail } from 'lucide-react';
import './Landing.css';

const STEPS = [
  {
    num: '01',
    label: 'Paso 1',
    title: 'Escribe cada letra',
    desc: 'Descarga la plantilla, imprimela y escribe cada caracter con un marcador oscuro dentro de las celdas.',
    img: '/step-1.png',
  },
  {
    num: '02',
    label: 'Paso 2',
    title: 'Escanea y sube',
    desc: 'Toma una foto o escanea la plantilla. Subela a la plataforma y ajusta brillo, contraste y rotacion.',
    img: '/step-2.png',
  },
  {
    num: '03',
    label: 'Paso 3',
    title: 'Afina tus letras',
    desc: 'Revisa los caracteres extraidos, mueve, borra o dibuja para que cada letra quede perfecta.',
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
  { name: 'Camilo Arias', role: 'Ingeniero en Sistemas', initials: 'CA', preview: 'Kiru, el mejor sitio para hacer fuentes propias.', chars: '83 caracteres', file: '/fonts/Camilo.ttf', family: 'Camilo', size: '2.5rem' },
  { name: 'Brenda Aviles', role: 'Psicologa', initials: 'BA', preview: 'Conocerse a uno mismo es el principio de toda sabiduría.', chars: '67 caracteres', file: '/fonts/Brenda.ttf', family: 'Brenda', size: '1.8rem' },
  { name: 'Andres Tenjo', role: 'Analista', initials: 'AT', preview: '"La ciencia de hoy es la tecnología del mañana"', chars: '72 caracteres', file: '/fonts/Andres.ttf', family: 'Andres', size: '1.8rem' },
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
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Promise.all(
      SHOWCASE.map(async (item) => {
        const font = new FontFace(item.family, `url(${item.file})`);
        await font.load();
        document.fonts.add(font);
      })
    ).then(() => setFontsLoaded(true));
  }, []);

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
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="hero-title-gradient">Kiru</span>
          </motion.h1>
          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Convierte tu letra manuscrita en una fuente digital descargable. Un proceso simple en cuatro pasos.
          </motion.p>
          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.button
              className="btn-primary"
              onClick={goToApp}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Crear mi fuente
            </motion.button>
          </motion.div>
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
                <div className="showcase-card-header">
                  <div className="showcase-card-avatar">{item.initials}</div>
                  <div className="showcase-card-author">
                    <span className="showcase-card-name">{item.name}</span>
                    <span className="showcase-card-role">{item.role}</span>
                  </div>
                </div>
                <div className="showcase-card-divider" />
                <div
                  className="showcase-card-preview"
                  style={fontsLoaded ? { fontFamily: `'${item.family}', serif`, fontSize: item.size } : { fontSize: item.size }}
                >
                  {item.preview}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <div className="usecases-wrapper">
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
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <span className="footer-copy">&copy; 2026 Kiru. Todos los derechos reservados.</span>
      </footer>
    </div>
  );
}
