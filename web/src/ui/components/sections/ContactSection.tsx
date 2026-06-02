// src/ui/components/sections/ContactSection.tsx
import React from 'react';
import { ContactInfo } from '../../../domain/entities/ContactInfo';
import { SectionHeader } from '../common/SectionHeader';
import { AnimatedSection } from '../common/AnimatedSection';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { theme } from '../../styles/theme';

interface Props {
  contactInfo: ContactInfo;
  whatsappUrl: string;
}

export const ContactSection: React.FC<Props> = ({ contactInfo, whatsappUrl }) => (
  <section id="contacto" style={{ padding: '88px 6% 100px', background: '#fff' }}>
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <AnimatedSection>
        <SectionHeader eyebrow="Estamos aquí para ti" title="" highlight="Contáctanos" />
      </AnimatedSection>

      <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
        {/* Info column */}
        <AnimatedSection>
          <div>
            <h3 style={{ fontFamily: theme.fonts.display, fontSize: '1.7rem', color: theme.colors.dark, marginBottom: 24 }}>
              Información de Contacto
            </h3>

            {/* WhatsApp */}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px', background: 'linear-gradient(135deg, #25D366, #1ebe5d)', borderRadius: 12, marginBottom: 18, cursor: 'pointer', boxShadow: '0 4px 20px rgba(37,211,102,0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(37,211,102,0.5)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(37,211,102,0.3)'; }}
              >
                <div style={{ background: '#fff', borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WhatsAppIcon size={28} color="#25D366" />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontFamily: theme.fonts.display, fontSize: '1.25rem' }}>
                    {contactInfo.phone}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.88rem' }}>Escríbenos por WhatsApp ahora</div>
                </div>
              </div>
            </a>

            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, padding: '22px', border: `2px solid ${theme.colors.light}`, borderRadius: 12, marginBottom: 18 }}>
              <div style={{ background: theme.colors.blue, borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>📍</div>
              <div>
                <div style={{ color: theme.colors.dark, fontWeight: 700, fontFamily: theme.fonts.display, fontSize: '1.05rem' }}>Nuestra Oficina</div>
                <div style={{ color: '#555', fontSize: '0.92rem', lineHeight: 1.65, marginTop: 4 }}>
                  {contactInfo.address}<br />
                  {contactInfo.addressDetail}<br />
                  {contactInfo.city}, {contactInfo.country}
                </div>
              </div>
            </div>

            {/* Hours */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, padding: '22px', border: `2px solid ${theme.colors.light}`, borderRadius: 12 }}>
              <div style={{ background: theme.colors.red, borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>🕐</div>
              <div>
                <div style={{ color: theme.colors.dark, fontWeight: 700, fontFamily: theme.fonts.display, fontSize: '1.05rem' }}>Horario de Atención</div>
                <div style={{ color: '#555', fontSize: '0.92rem', lineHeight: 1.65, marginTop: 4 }}>
                  {contactInfo.businessHours.map(bh => (
                    <div key={bh.days}><strong>{bh.days}:</strong> {bh.hours}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Map */}
        <AnimatedSection delay={0.2}>
          <div
            style={{
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              border: `3px solid ${theme.colors.blue}`,
              position: 'relative',
              minHeight: 260,
            }}
          >
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d686.8129870973916!2d-74.2314651819763!3d-13.149720054525428!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91127de51ee7d343%3A0x78ab7a330c2c5e9c!2sVQ29%2B3C5%2C%20Ayacucho%2005003!5e0!3m2!1sen!2spe!4v1771964434423!5m2!1sen!2spe" 
              width="100%" 
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </AnimatedSection>
      </div>
    </div>
  </section>
);
