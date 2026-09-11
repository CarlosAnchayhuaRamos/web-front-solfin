import { useState } from 'react';
import { Button } from '../../../common/components/Button';
import { formatMoney } from '../../../common/lib/format';
import { printDocument } from '../../../common/lib/print';
import { getReversalVoucherHtml } from '../reversal-voucher';
import type { ClientCredit, CreditReversalRequest, OpenCashSession, ReversalVoucher } from '../types';

interface CreditReversalProps {
  credit: ClientCredit;
  sessions: OpenCashSession[] | null;
  busy: boolean;
  submit: (creditId: string, input: CreditReversalRequest) => Promise<boolean>;
  close: () => void;
}

export function CreditReversal({ credit, sessions, busy, submit, close }: CreditReversalProps) {
  const [kind, setKind] = useState<CreditReversalRequest['kind']>(credit.latestPaymentId ? 'REVERSE_PAYMENT' : 'CANCEL_CREDIT');
  const [reason, setReason] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [pending, setPending] = useState<CreditReversalRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancel = kind === 'CANCEL_CREDIT';
  const amount = cancel ? (credit.status === 'APPROVED' ? 0 : credit.principalAmount) : credit.latestPaymentAmount ?? 0;
  const confirm = async () => {
    try {
      const input = pending ?? { kind, reason, requestId: crypto.randomUUID(), cashSessionId: sessionId || undefined, latestPaymentId: credit.latestPaymentId ?? undefined };
      setPending(input);
      if (await submit(credit.id, input)) close();
    } catch { setError('No se pudo preparar la reversion'); }
  };
  return <section className="credit-reversal" aria-label={`Reversion de ${credit.code}`}>
    <strong>{credit.code}</strong>
    <div className="form-grid">
      <label>Operacion<select value={kind} disabled={busy || Boolean(pending)} onChange={(e) => setKind(e.target.value as CreditReversalRequest['kind'])}>
        <option value="CANCEL_CREDIT" disabled={Boolean(credit.latestPaymentId)}>Anular credito</option>
        <option value="REVERSE_PAYMENT" disabled={!credit.latestPaymentId}>Revertir ultimo pago completo</option>
      </select></label>
      <label>Caja<select value={sessionId} disabled={busy || Boolean(pending) || amount === 0} onChange={(e) => setSessionId(e.target.value)}>
        <option value="">Seleccionar caja</option>
        {sessions?.map((s) => <option key={s.id} value={s.id}>{s.cashBox} ({formatMoney(s.expectedAmount)})</option>)}
      </select></label>
      <label>Motivo<input maxLength={500} value={reason} disabled={busy || Boolean(pending)} onChange={(e) => setReason(e.target.value)} /></label>
    </div>
    <p>{cancel ? 'El credito quedara anulado.' : 'Se revertira el ultimo pago completo, incluidas todas las cuotas que cubrio.'} {amount > 0 ? `${cancel ? 'Ingreso a caja' : 'Devolucion al cliente desde caja'}: ${formatMoney(amount)}.` : 'Sin movimiento de efectivo.'}</p>
    {error ? <p role="alert" className="message--error">{error}</p> : null}
    <div className="actions">
      <Button variant="destructive" disabled={busy || !reason.trim() || (!cancel && !credit.latestPaymentAmount) || (amount > 0 && !sessionId)} onClick={() => void confirm()}>{busy ? 'Procesando...' : 'Confirmar reversion'}</Button>
      <Button variant="outline" disabled={busy} onClick={close}>Cerrar</Button>
    </div>
  </section>;
}

interface ReversalReceiptProps { voucher: ReversalVoucher }

export function ReversalReceipt({ voucher }: ReversalReceiptProps) {
  const [error, setError] = useState<string | null>(null);
  const print = () => {
    try {
      const target = window.open('', '_blank', 'width=800,height=700');
      if (!target) { setError('Permita ventanas emergentes para imprimir el voucher'); return; }
      target.document.write(getReversalVoucherHtml(voucher, window.location.origin));
      target.document.close();
      printDocument(target);
    } catch { setError('No se pudo imprimir el voucher'); }
  };
  return <div role="status">
    <p>Reversion registrada: {voucher.creditCode}, {formatMoney(voucher.amount)}.</p>
    <Button variant="outline" onClick={print}>Imprimir voucher de reversion</Button>
    {error ? <p className="message--error">{error}</p> : null}
  </div>;
}
