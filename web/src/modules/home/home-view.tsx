import React from 'react';
import { Link } from 'react-router-dom';
import { WhatsAppIcon } from '../../ui/components/common/WhatsAppIcon';
import { defaultWhatsAppMessage, homeFeatures, homeNavLinks, whatsappPhone } from './data';
import { getWhatsAppUrl } from './lib';

export const HomeView: React.FC = () => {
  const whatsappUrl = getWhatsAppUrl(whatsappPhone, defaultWhatsAppMessage);

  return (
    <main className="home">
      <nav className="home-nav" aria-label="Navegacion principal">
        <Link className="home-nav__brand" to="/">
          <span>SOL</span>
          <strong>FIN</strong>
          <em>PERU</em>
        </Link>
        <div className="home-nav__links">
          {homeNavLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <Link className="button button--outline" to="/login">
            Login
          </Link>
        </div>
      </nav>

      <section className="home-hero">
        <div className="home-hero__content">
          <span className="home-hero__eyebrow">SOLFIN PERU</span>
          <h1>Creditos simples con atencion directa por WhatsApp</h1>
          <p>
            Solicita informacion, consulta requisitos y coordina tu evaluacion con nuestro equipo.
          </p>
          <div className="home-hero__actions">
            <a className="button button--default home-hero__whatsapp" href={whatsappUrl} rel="noopener noreferrer" target="_blank">
              <WhatsAppIcon color="#ffffff" size={22} />
              Escribir al 986 366 302
            </a>
            <a className="button button--secondary" href="#servicios">
              Ver servicios
            </a>
          </div>
        </div>

        <aside className="home-hero__panel" aria-label="Contacto rapido">
          <span>Atencion por WhatsApp</span>
          <strong>986 366 302</strong>
          <p>Horario de oficina. Respuesta segun disponibilidad del equipo.</p>
          <a className="button button--default" href={whatsappUrl} rel="noopener noreferrer" target="_blank">
            Contactar ahora
          </a>
        </aside>
      </section>

      <section className="home-section" id="servicios">
        <div className="home-section__header">
          <span>Servicios</span>
          <h2>Soluciones para clientes que buscan credito</h2>
        </div>
        <div className="home-feature-grid">
          {homeFeatures.map((feature) => (
            <article className="home-feature" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-contact" id="contacto">
        <div>
          <span>Contacto</span>
          <h2>Conversemos por WhatsApp</h2>
          <p>Un asesor puede indicarte documentos, plazos y pasos para iniciar tu solicitud.</p>
        </div>
        <a className="button button--default home-hero__whatsapp" href={whatsappUrl} rel="noopener noreferrer" target="_blank">
          <WhatsAppIcon color="#ffffff" size={22} />
          Abrir WhatsApp
        </a>
      </section>
    </main>
  );
};
