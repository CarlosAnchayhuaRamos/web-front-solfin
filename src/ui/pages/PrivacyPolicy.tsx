import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.mainTitle}>Política de Privacidad</h1>
        <p style={styles.lastUpdated}>Última actualización: {new Date().toLocaleDateString('es-PE')}</p>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Titular del Tratamiento de Datos</h2>
          <p>
            <strong>SOLFIN Perú</strong>
          </p>
          <ul style={styles.list}>
            <li>RUC: 20574672237</li>
            <li>Correo: solfinpe@hotmail.com</li>
            <li>Ámbito de operación: República del Perú</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Descripción de Nuestro Servicio</h2>
          <p>
            SOLFIN Perú es una empresa de intermediación financiera que se dedica a la intermediación de servicios de crédito. 
            Este sitio web es de naturaleza informativa y de contacto, donde los usuarios pueden obtener información sobre nuestros 
            servicios de préstamo y establecer comunicación con nosotros.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Información que Recopilamos</h2>
          <p>A través de nuestro sitio web recopilamos la siguiente información personal:</p>
          <ul style={styles.list}>
            <li><strong>Nombre Completo:</strong> Para identificarlo como cliente o potencial cliente</li>
            <li><strong>DNI (Documento Nacional de Identidad):</strong> Para verificar su identidad</li>
            <li><strong>Correo Electrónico:</strong> Para comunicación y correspondencia</li>
            <li><strong>Número de Teléfono:</strong> Para contacto y confirmación de solicitudes</li>
            <li><strong>Dirección:</strong> Para propósitos de ubicación y documentación</li>
            <li><strong>Ingresos Económicos:</strong> Para evaluar su capacidad de pago</li>
            <li><strong>Historial Crediticio:</strong> Para análisis de riesgo crediticio</li>
            <li><strong>Escaneos del DNI:</strong> Para verificación de identidad y validación de datos</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Finalidades del Tratamiento de Datos</h2>
          <p>Utilizamos la información proporcionada con los siguientes propósitos:</p>
          <ul style={styles.list}>
            <li>Procesar solicitudes de acceso a servicios de crédito</li>
            <li>Evaluar su eligibilidad y capacidad crediticia</li>
            <li>Mantener contacto mediante correo electrónico o teléfono</li>
            <li>Cumplir con obligaciones legales y normativas</li>
            <li>Prevenir fraude y actividades ilícitas</li>
            <li>Mejorar la calidad de nuestros servicios</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Compartición de Información</h2>
          <p>
            Su información personal puede ser compartida con terceros en los siguientes casos:
          </p>
          <ul style={styles.list}>
            <li>
              <strong>INFOCORP (Empresa Peruana de Información Crediticia):</strong> Compartimos información 
              sobre mora o incumplimientos de pago con INFOCORP para mantener registros crediticios actualizados, 
              conforme lo autoriza la normativa peruana sobre reportes de cartera morosa.
            </li>
            <li>
              <strong>Organismos Reguladores:</strong> Cuando sea requerido por ley o autoridades competentes.
            </li>
          </ul>
          <p>
            No compartimos su información con fines comerciales, de marketing, o cualquier otro propósito 
            no autorizado por usted o requerido por ley.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Uso de Cookies</h2>
          <p>
            Este sitio web <strong>no utiliza cookies</strong> ni tecnologías similares de seguimiento. 
            No recopilamos información de navegación ni perfiles de comportamiento de los usuarios.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Seguridad de la Información</h2>
          <p>
            Implementamos medidas técnicas, administrativas y organizacionales apropiadas para proteger 
            su información personal contra acceso no autorizado, alteración, divulgación o destrucción. 
            Sin embargo, ningún método de transmisión por Internet es 100% seguro.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Retención de Datos</h2>
          <p>
            Conservaremos su información personal durante el tiempo necesario para cumplir con las finalidades 
            descritas en esta política y conforme a lo establecido por la normativa peruana vigente, incluyendo 
            la Ley de Protección de Datos Personales (Ley N° 29733) y su Reglamento.
          </p>
          <p>
            En particular, los datos relacionados con transacciones crediticias serán retenidos conforme a lo 
            que establecen las regulaciones del sistema financiero peruano.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Derechos del Titular</h2>
          <p>
            Conforme a la Ley de Protección de Datos Personales, usted tiene derecho a:
          </p>
          <ul style={styles.list}>
            <li><strong>Acceso:</strong> Conocer la información personal que tratamos sobre usted</li>
            <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
            <li><strong>Cancelación:</strong> Solicitar la eliminación de sus datos (sujeto a excepciones legales)</li>
            <li><strong>Oposición:</strong> Objetar el tratamiento de sus datos en ciertos casos</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>10. Cómo Ejercer sus Derechos</h2>
          <p>
            Para ejercer cualquiera de los derechos mencionados anteriormente, contáctenos enviando 
            una solicitud mediante correo electrónico a:
          </p>
          <p style={styles.highlightedText}>
            <strong>solfinpe@hotmail.com</strong>
          </p>
          <p>
            Su solicitud debe incluir: nombre completo, DNI, descripción clara del derecho que desea ejercer, 
            y copia de su documento de identidad.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>11. Cambios en esta Política</h2>
          <p>
            Nos reservamos el derecho de modificar esta Política de Privacidad en cualquier momento. 
            Los cambios entrarán en vigor al ser publicados en este sitio web. Le recomendamos revisar 
            nuestra Política de Privacidad regularmente.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>12. Contacto</h2>
          <p>
            Para consultas, dudas, o para ejercer sus derechos de protección de datos, contáctenos:
          </p>
          <ul style={styles.list}>
            <li>Correo: solfinpe@hotmail.com</li>
            <li>Ámbito: República del Perú</li>
          </ul>
        </section>

        <section style={styles.section}>
          <p style={styles.footerText}>
            Esta Política de Privacidad cumple con lo establecido en la Ley N° 29733 - Ley de Protección 
            de Datos Personales del Perú y su Reglamento.
          </p>
        </section>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9f9f9',
    paddingTop: '80px',
    paddingBottom: '60px',
  } as React.CSSProperties,
  content: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  mainTitle: {
    fontSize: '2.5rem',
    color: '#1a1a1a',
    marginBottom: '10px',
    textAlign: 'center',
  } as React.CSSProperties,
  lastUpdated: {
    textAlign: 'center',
    color: '#666',
    marginBottom: '40px',
    fontStyle: 'italic',
  } as React.CSSProperties,
  section: {
    marginBottom: '30px',
    lineHeight: '1.8',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.3rem',
    color: '#0066cc',
    marginBottom: '15px',
    marginTop: '25px',
  } as React.CSSProperties,
  list: {
    paddingLeft: '25px',
    marginTop: '10px',
    marginBottom: '10px',
  } as React.CSSProperties,
  highlightedText: {
    backgroundColor: '#f3f3f3',
    padding: '10px 15px',
    borderRadius: '5px',
    display: 'inline-block',
    marginTop: '10px',
    marginBottom: '10px',
  } as React.CSSProperties,
  footerText: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    color: '#666',
    fontStyle: 'italic',
    fontSize: '0.9rem',
  } as React.CSSProperties,
};

export default PrivacyPolicy;
