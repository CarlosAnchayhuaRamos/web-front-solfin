import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.mainTitle}>Términos y Condiciones del Servicio</h1>
        <p style={styles.lastUpdated}>Última actualización: {new Date().toLocaleDateString('es-PE')}</p>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Aceptación de Términos</h2>
          <p>
            Al acceder y utilizar este sitio web de SOLFIN Perú, usted acepta estar vinculado por estos Términos y Condiciones. 
            Si no está de acuerdo con alguno de estos términos, le recomendamos no utilizar este sitio web.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Información sobre SOLFIN Perú</h2>
          <ul style={styles.list}>
            <li><strong>Empresa:</strong> SOLFIN Perú</li>
            <li><strong>RUC:</strong> 20574672237</li>
            <li><strong>Correo Electrónico:</strong> solfinpe@hotmail.com</li>
            <li><strong>Ámbito de Operación:</strong> República del Perú</li>
            <li><strong>Actividad Principal:</strong> Intermediación de servicios de crédito</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Descripción del Servicio</h2>
          <p>
            Este sitio web es de naturaleza <strong>informativa y de contacto</strong>. Desde aquí:
          </p>
          <ul style={styles.list}>
            <li>Puede obtener información general sobre nuestros servicios de crédito</li>
            <li>Puede contactarnos para consultar sobre condiciones y requisitos</li>
            <li>Puede iniciar un proceso de solicitud de crédito</li>
          </ul>
          <p>
            <strong>Nota Importante:</strong> Este sitio web no realiza operaciones de crédito en línea. 
            Las solicitudes requieren procesamiento y aprobación manual conforme a nuestras políticas internas.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Requisitos para Solicitar Crédito</h2>
          <p>
            Para procesar una solicitud de crédito, se requiere que proporcione la siguiente información:
          </p>
          <ul style={styles.list}>
            <li>Nombre Completo</li>
            <li>DNI (Documento Nacional de Identidad)</li>
            <li>Correo Electrónico</li>
            <li>Número de Teléfono</li>
            <li>Dirección</li>
            <li>Ingresos Económicos</li>
          </ul>
          <p>
            Adicionalmente, podemos solicitar:
          </p>
          <ul style={styles.list}>
            <li>Historial Crediticio</li>
            <li>Escaneos del DNI para validación de identidad</li>
            <li>Comprobantes de ingresos</li>
            <li>Otra documentación necesaria para evaluación crediticia</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Evaluación de Solicitudes</h2>
          <p>
            SOLFIN Perú evaluará su solicitud de crédito considerando:
          </p>
          <ul style={styles.list}>
            <li>Su historial crediticio y registro en sistemas de información crediticia</li>
            <li>Su capacidad financiera y estabilidad económica</li>
            <li>El análisis de riesgo correspondiente</li>
            <li>Criterios internos de elegibilidad</li>
          </ul>
          <p>
            La aprobación o rechazo de su solicitud es determinado exclusivamente por SOLFIN Perú 
            y se comunicará dentro del plazo establecido.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Intercambio de Información Crediticia</h2>
          <p>
            Al solicitar un servicio de crédito con SOLFIN Perú, usted autoriza:
          </p>
          <ul style={styles.list}>
            <li>
              Que consultemos su información en sistemas de información crediticia, incluyendo INFOCORP 
              (Empresa Peruana de Información Crediticia)
            </li>
            <li>
              Que compartamos información sobre mora o incumplimientos de pago con INFOCORP, conforme a 
              lo establecido en la normativa peruana
            </li>
          </ul>
          <p>
            Esta práctica es estándar en la industria financiera peruana y es realizada conforme a 
            la Ley del Sistema Financiero Peruano.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Responsabilidades del Usuario</h2>
          <p>
            Al utilizar este sitio web, usted se compromete a:
          </p>
          <ul style={styles.list}>
            <li>Proporcionar información veraz, exacta y completa</li>
            <li>Mantener la confidencialidad de cualquier código de acceso o credencial</li>
            <li>No utilizar el sitio para actividades ilícitas o fraudulentas</li>
            <li>Cumplir con todas las leyes aplicables de la República del Perú</li>
            <li>No interferir con la seguridad o funcionamiento del sitio web</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Exclusión de Responsabilidad</h2>
          <p>
            SOLFIN Perú no se responsabiliza por:
          </p>
          <ul style={styles.list}>
            <li>Información incorrecta o incompleta que usted proporcione</li>
            <li>Daños o pérdidas resultantes de su acceso o uso de este sitio web</li>
            <li>Interrupciones o errores técnicos en el sitio web</li>
            <li>Pérdida de datos o acceso no autorizado a su cuenta</li>
            <li>Decisiones de aprobación o rechazo de solicitudes de crédito</li>
          </ul>
          <p>
            El sitio web se proporciona "tal como está" sin garantías implícitas.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Limitación de Responsabilidad</h2>
          <p>
            Bajo ninguna circunstancia SOLFIN Perú será responsable por daños indirectos, incidentales, 
            especiales, o consecuentes derivados del uso de este sitio web o de nuestros servicios.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>10. Propiedad Intelectual</h2>
          <p>
            Todo el contenido del sitio web (textos, imágenes, logos, diseños) es propiedad intelectual 
            de SOLFIN Perú o de sus proveedores. No se permite la reproducción, distribución o uso sin 
            autorización expresa.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>11. Enlaces Externos</h2>
          <p>
            Este sitio web puede contener enlaces a sitios web externos. SOLFIN Perú no se responsabiliza 
            por el contenido, exactitud o prácticas de privacidad de sitios web terceros.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>12. Modificación de Términos</h2>
          <p>
            SOLFIN Perú se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. 
            Los cambios entrarán en vigor inmediatamente al ser publicados. Su uso continuado del sitio 
            implica aceptación de los cambios.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>13. Cancelación y Suspensión</h2>
          <p>
            SOLFIN Perú se reserva el derecho de cancelar o suspender el acceso a su cuenta si:
          </p>
          <ul style={styles.list}>
            <li>Viola estos Términos y Condiciones</li>
            <li>Proporciona información falsa o fraudulenta</li>
            <li>Realiza actividades ilícitas</li>
            <li>Incumple de manera grave con sus obligaciones</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>14. Ley Aplicable y Jurisdicción</h2>
          <p>
            Estos Términos y Condiciones se rigen por las leyes de la República del Perú. 
            Ante cualquier controversia, se someterán a la jurisdicción de los tribunales competentes 
            del Perú.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>15. Contacto para Dudas o Reclamos</h2>
          <p>
            Para consultas sobre estos Términos y Condiciones, o para presentar reclamos, contáctenos:
          </p>
          <p style={styles.highlightedText}>
            <strong>solfinpe@hotmail.com</strong>
          </p>
          <p>
            Nos comprometemos a responder sus consultas dentro de un plazo razonable.
          </p>
        </section>

        <section style={styles.section}>
          <p style={styles.footerText}>
            Al utilizar este sitio web, usted reconoce haber leído y aceptado estos Términos y Condiciones, 
            así como nuestra Política de Privacidad.
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

export default TermsOfService;
