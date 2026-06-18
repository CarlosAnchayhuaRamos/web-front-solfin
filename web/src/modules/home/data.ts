import { HomeFeature, HomeNavLink } from './types';

export const whatsappPhone = '51986366302';

export const homeNavLinks: HomeNavLink[] = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#contacto', label: 'Contacto' },
];

export const homeFeatures: HomeFeature[] = [
  {
    title: 'Creditos personales',
    description: 'Atencion directa para clientes que necesitan liquidez con evaluacion simple.',
  },
  {
    title: 'Respuesta por WhatsApp',
    description: 'Coordina requisitos, horarios y seguimiento desde el canal principal de atencion.',
  },
  {
    title: 'Atencion local',
    description: 'Equipo en Ayacucho para guiar cada solicitud y resolver dudas del proceso.',
  },
];

export const defaultWhatsAppMessage = 'Hola, quiero informacion sobre un credito en SOLFIN PERU.';
