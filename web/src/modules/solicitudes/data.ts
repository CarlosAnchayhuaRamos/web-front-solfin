import type { CreditStatusInfo } from './types';

export const approvalStatusMap: Record<string, CreditStatusInfo> = {
  APPROVED: { color: 'blue', label: 'Aprobado' },
  CANCELED: { color: 'gray', label: 'Cancelado' },
  PENDING: { color: 'yellow', label: 'Pendiente' },
  REJECTED: { color: 'red', label: 'Rechazado' },
};

export const initialApprovalFilters = {
  dateFrom: '',
  dateTo: '',
  status: 'PENDING',
} as const;

export const approvalStatusOptions = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Pendientes', value: 'PENDING' },
  { label: 'Aprobadas', value: 'APPROVED' },
  { label: 'Rechazadas', value: 'REJECTED' },
  { label: 'Canceladas', value: 'CANCELED' },
] as const;

export const contractCompany = {
  address: 'Nery García Zárate Mz Ñ Lte 02, distrito de Ayacucho',
  legalRepresentative: 'RAMOS CORDERO ISABEL',
  legalRepresentativeDni: '28274834',
  name: 'EMPRESA SOLFIN PERU SAC',
  ruc: '20574672237',
} as const;

export const contractClauses = [
  ['CUARTO', 'EL CLIENTE podrá ser ejecutado en caso de incumplimiento de una o más cuotas consecutivas o alternadas, para lo cual se dará por vencido el plazo del crédito y resuelto el presente contrato, pudiendo LA EMPRESA requerir el pago total del saldo de la obligación, sus intereses, gastos y tributos, de corresponder, o ejecutar las garantías otorgadas. Para tal efecto, EL CLIENTE y su cónyuge o conviviente, de ser el caso, suscriben el Pagaré debidamente garantizado, el cual es emitido sin fecha de vencimiento ni importe deudor, autorizando expresamente a LA EMPRESA para que, en caso de incurrir en la causal señalada en el presente artículo, lo complete consignando el saldo de la deuda y sus intereses, así como la fecha de vencimiento hasta la cual se calculan los intereses aplicados, sin perjuicio de los que se generen a partir del vencimiento hasta la total cancelación de la obligación.'],
  ['QUINTO', 'Queda expresamente convenido que, además de la causal de resolución señalada en la cláusula cuarta del presente contrato, LA EMPRESA podrá dar por vencido el plazo y requerirá el pago total de la obligación, sus intereses y gastos, cuando a su criterio se hayan desmejorado o perjudicado las garantías otorgadas a su favor, sin perjuicio de las acciones penales a las que se reserva el derecho cuando haya mediado dolo en ello. LA EMPRESA, para hacer valer el vencimiento de los plazos a los que se refiere el primer párrafo de la presente cláusula, mediante comunicación simple a EL CLIENTE, manifestará su voluntad en ese sentido, exigiéndole a este que cancele de inmediato sus obligaciones bajo apercibimiento, en caso de que no lo hiciese, de iniciar el Proceso Judicial al que se refiere el Código Civil.'],
  ['SEXTO', 'Las partes convienen que los pagos se efectuarán, como fecha máxima, en los días señalados en el cronograma respectivo, en las oficinas de LA EMPRESA, mediante descuento por planilla o cargo en su cuenta maestra de LA EMPRESA, según fuera el caso.'],
  ['SÉPTIMO', 'LA EMPRESA está facultada para aplicar en cancelación o amortización de la deuda las aportaciones, depósitos de ahorro y cualquier otra imposición o derecho que mantenga en LA EMPRESA tanto EL CLIENTE como su cónyuge, conviviente y/o sus garantes, cuando el préstamo se encuentre en situación de morosidad. Es de responsabilidad de EL CLIENTE, su cónyuge o conviviente y/o sus garantes todos los gastos derivados de la cobranza administrativa o judicial de la obligación, costos que de igual manera podrán ser cargados a sus cuentas.'],
  ['OCTAVO', 'De acuerdo a lo establecido en el artículo 1249 del Código Civil, se pacta la capitalización de los intereses vencidos.'],
  ['NOVENO', 'La tasa de interés fijada podrá ser reajustada dentro de los límites máximos fijados por el Banco Central de Reserva del Perú, para lo cual EL CLIENTE, su cónyuge o conviviente y el garante no requieren la suscripción de un nuevo pagaré.'],
  ['DÉCIMO', 'Las partes renuncian al fuero de sus domicilios y se someten expresamente a la jurisdicción y competencia de los jueces y tribunales del Distrito Judicial de Lima, debiendo en su oportunidad y a criterio y/o requerimiento de LA EMPRESA, señalar domicilio dentro del radio urbano de la ciudad, sin perjuicio de la validez, para todos los fines judiciales o extrajudiciales, a los que pudiera dar lugar el presente contrato.'],
  ['DÉCIMO PRIMERO', 'Todos los gastos e impuestos que pudiera devengar este contrato, inclusive las nuevas valorizaciones que se efectúen de las garantías, los derechos notariales y registrales, y los de su cancelación, llegado el momento, serán por cuenta única y exclusiva de EL CLIENTE. Del mismo modo, queda expresamente entendido que cualquier gasto o costo derivado del presente contrato que LA EMPRESA se vea obligada a efectuar o asumir por cuenta de EL CLIENTE devengará, a partir de la fecha en la que LA EMPRESA efectúe los desembolsos correspondientes, los intereses compensatorios y moratorios a la tasa pactada en el presente contrato.'],
  ['DÉCIMO SEGUNDO', 'De acuerdo a lo dispuesto en la Ley Nº 26702 (Ley General del Sistema Financiero y del Sistema de Seguros y Orgánica de la Superintendencia de Banca y Seguros) y la Ley Nº 27489 (Ley que regula las Centrales Privadas de Información de Riesgos y Protección al Titular de la Información), LA EMPRESA tiene la facultad de informar su situación contractual a las Centrales de Riesgo.'],
] as const;
