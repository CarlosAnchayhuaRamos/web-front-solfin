import React from 'react';

const DataDeletionInstructions: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.mainTitle}>Instrucciones para la Eliminación de Datos</h1>
        <p style={styles.lastUpdated}>Última actualización: {new Date().toLocaleDateString('es-PE')}</p>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>1. Su Derecho a la Eliminación de Datos</h2>
          <p>
            Conforme a la Ley N° 29733 - Ley de Protección de Datos Personales del Perú, usted tiene 
            el derecho de solicitar la <strong>cancelación (eliminación) de sus datos personales</strong> 
            que tenemos registrados.
          </p>
          <p>
            Este derecho le permite solicitar que dejemos de tratar su información personal en nuestras 
            bases de datos, con ciertas excepciones establecidas por la ley.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>2. Excepciones a la Eliminación</h2>
          <p>
            Existen circunstancias donde no podemos eliminar completamente su información, de conformidad 
            con la ley peruana:
          </p>
          <ul style={styles.list}>
            <li>
              <strong>Obligaciones Crediticias Vigentes:</strong> Si tiene un crédito activo con SOLFIN Perú, 
              conservaremos sus datos mientras la obligación crediticia no haya sido cancelada.
            </li>
            <li>
              <strong>Incumplimientos de Pago:</strong> Si ha incumplido en el pago de un crédito, 
              la información será mantenida en registros de INFOCORP conforme a lo establecido en la ley.
            </li>
            <li>
              <strong>Obligaciones Legales:</strong> Cierta información debe ser retenida para cumplir 
              con requisitos regulatorios del sistema financiero peruano.
            </li>
            <li>
              <strong>Plazos de Prescripción:</strong> Conservaremos información relevante durante los plazos 
              de prescripción legal de posibles acciones judiciales.
            </li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>3. Cómo Solicitar la Eliminación de Sus Datos</h2>
          <p>
            Para solicitar la eliminación de sus datos personales, siga estos pasos:
          </p>

          <div style={styles.stepBox}>
            <h3 style={styles.stepNumber}>Paso 1: Prepare su Solicitud</h3>
            <p>
              Envíe un correo electrónico a <strong>solfinpe@hotmail.com</strong> con el asunto:
            </p>
            <p style={styles.highlightedText}>
              "SOLICITUD DE ELIMINACIÓN DE DATOS PERSONALES"
            </p>
          </div>

          <div style={styles.stepBox}>
            <h3 style={styles.stepNumber}>Paso 2: Información Requerida</h3>
            <p>
              Su solicitud debe incluir la siguiente información:
            </p>
            <ul style={styles.list}>
              <li><strong>Nombre Completo</strong> tal como aparece en nuestros registros</li>
              <li><strong>Número de DNI</strong> (Documento Nacional de Identidad)</li>
              <li><strong>Correo Electrónico</strong> registrado con nosotros</li>
              <li><strong>Teléfono de Contacto</strong></li>
              <li><strong>Copia escaneada de su DNI</strong> para verificación de identidad</li>
              <li>
                <strong>Descripción clara</strong> de qué datos desea que eliminemos 
                (puede especificar datos particulares o solicitar la eliminación total)
              </li>
              <li>
                <strong>Motivo</strong> de su solicitud (opcional pero recomendado)
              </li>
            </ul>
          </div>

          <div style={styles.stepBox}>
            <h3 style={styles.stepNumber}>Paso 3: Envíe su Solicitud</h3>
            <p>
              Envíe el correo con toda la información anterior a:
            </p>
            <p style={styles.highlightedText}>
              <strong>solfinpe@hotmail.com</strong>
            </p>
            <p>
              Asegúrese de incluir todos los documentos requeridos como archivos adjuntos.
            </p>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>4. Plazo de Respuesta</h2>
          <p>
            SOLFIN Perú procesará su solicitud de eliminación de datos conforme a lo establecido en la 
            Ley N° 29733 de Protección de Datos Personales del Perú y su Reglamento.
          </p>
          <p style={styles.importantBox}>
            <strong>⏱️ Plazo Legal:</strong> El plazo de respuesta será determinado conforme a la 
            normativa vigente en materia de protección de datos personales. Generalmente, se realiza 
            el procesamiento dentro de los plazos razonables establecidos por la ley.
          </p>
          <p>
            Le notificaremos por correo electrónico sobre el estado de su solicitud.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>5. Verificación de Identidad</h2>
          <p>
            Para proteger su privacidad y seguridad, verificaremos su identidad antes de procesar 
            la solicitud. Por este motivo, es <strong>obligatorio</strong> adjuntar:
          </p>
          <ul style={styles.list}>
            <li>Copia clara del DNI (ambos lados si es posible)</li>
            <li>La solicitud debe ser firmada (puede ser digital o física escaneada)</li>
          </ul>
          <p>
            Esto nos asegura que está usted realmente solicitando la eliminación de sus datos.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>6. Ámbito de la Eliminación</h2>
          <p>
            Una vez aprobada su solicitud, los datos serán eliminados de:
          </p>
          <ul style={styles.list}>
            <li>Nuestras bases de datos operativas</li>
            <li>Nuestros sistemas de almacenamiento</li>
            <li>Nuestros servidores y backups (en la medida permitida por la ley)</li>
          </ul>
          <p>
            <strong>Nota importante:</strong> Si los datos fueron compartidos con INFOCORP debido a 
            un incumplimiento crediticio, la eliminación requiere gestiones adicionales conforme a la 
            ley, y el plazo puede ser mayor.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>7. Información que No Podemos Eliminar</h2>
          <p>
            Aunque solicite la eliminación, ciertos datos podrían ser retenidos legalmente:
          </p>
          <ul style={styles.list}>
            <li>Información requerida por organismos reguladores financieros</li>
            <li>Registros necesarios para prevención de lavado de dinero (según UIAF)</li>
            <li>Datos de transacciones completadas (necesarios para auditoría financiera)</li>
            <li>Información sobre deudas o incumplimientos (mientras no prescriba la acción)</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>8. Confirmación de Eliminación</h2>
          <p>
            Una vez procesada la eliminación, recibirá un correo de confirmación que incluirá:
          </p>
          <ul style={styles.list}>
            <li>Confirmación de que su solicitud fue aprobada</li>
            <li>Fecha de eliminación de los datos</li>
            <li>Datos específicos que fueron eliminados</li>
            <li>Datos que fueron retenidos (si aplica) y motivo de retención</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>9. Alternativas a la Eliminación Total</h2>
          <p>
            Si tiene una deuda activa o no cumple los requisitos para la eliminación total, puede solicitar:
          </p>
          <ul style={styles.list}>
            <li><strong>Rectificación:</strong> Corregir datos incorrectos o incompletos</li>
            <li><strong>Actualización:</strong> Actualizar información desactualizada</li>
            <li><strong>Limitación de Uso:</strong> Restringir cómo usamos su información</li>
          </ul>
          <p>
            Contáctenos para solicitar estas alternativas.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>10. Marco Legal de las Solicitudes</h2>
          <p>
            Todas las solicitudes de eliminación de datos son procesadas conforme a:
          </p>
          <ul style={styles.list}>
            <li><strong>Ley N° 29733:</strong> Ley de Protección de Datos Personales del Perú</li>
            <li><strong>Decreto Supremo N° 003-2013-JUS:</strong> Reglamento de la Ley</li>
            <li><strong>Normativa del Banco Central del Perú (BCR)</strong> sobre sistemas de información</li>
            <li><strong>Regulaciones de INFOCORP</strong> para información crediticia</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>11. Contacto y Soporte</h2>
          <p>
            Para cualquier duda respecto a la eliminación de sus datos o cómo procesar su solicitud:
          </p>
          <p style={styles.highlightedText}>
            <strong>Correo: solfinpe@hotmail.com</strong>
          </p>
          <p>
            Nos comprometemos a responder sus consultas de forma clara y oportuna.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>12. Recurso ante Incumplimiento</h2>
          <p>
            Si considera que SOLFIN Perú no ha cumplido adecuadamente con su derecho de eliminación de datos, 
            tiene derecho a:
          </p>
          <ul style={styles.list}>
            <li>Presentar una reclamación ante la Autoridad Nacional de Protección de Datos Personales (APDP)</li>
            <li>Solicitar protección ante el Poder Judicial del Perú</li>
          </ul>
          <p>
            La APDP es el organismo competente para conocer disputas sobre protección de datos personales 
            en Perú.
          </p>
        </section>

        <section style={styles.section}>
          <p style={styles.footerText}>
            Esta sección cumple con lo establecido en la Ley N° 29733 de Protección de Datos Personales 
            del Perú y sus regulaciones complementarias. El plazo para responder solicitudes de eliminación 
            se rige por lo que establece la normativa vigente.
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
  stepBox: {
    backgroundColor: '#f5f9ff',
    padding: '20px',
    borderLeft: '4px solid #0066cc',
    marginBottom: '20px',
    borderRadius: '4px',
  } as React.CSSProperties,
  stepNumber: {
    fontSize: '1.1rem',
    color: '#0066cc',
    marginTop: '0',
    marginBottom: '10px',
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
  importantBox: {
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderLeft: '4px solid #ffc107',
    borderRadius: '4px',
    marginTop: '15px',
    marginBottom: '15px',
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

export default DataDeletionInstructions;
