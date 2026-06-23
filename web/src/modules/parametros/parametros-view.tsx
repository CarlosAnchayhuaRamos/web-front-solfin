import React, { useEffect, useState } from 'react';
import { Button } from '../../common/components/Button';
import { Card, CardBody, CardHeader } from '../../common/components/Card';
import { PageHeader } from '../../common/layout/PageHeader';
import { initialCashPolicyForm, initialCreditPolicyForm, paymentFrequencyLabels, penaltyFrequencyKeys, penaltyMethodOptions } from './data';
import { toCashPolicyFormState, toCreditPolicyFormState, useCashPolicy, useCreditPolicy } from './hooks';
import type { CashPolicyFormState, CreditPolicyFormState, PaymentFrequencyKey, PenaltyFrequencyFormState } from './types';

export const ParametrosView: React.FC = () => {
  const credit = useCreditPolicy();
  const cash = useCashPolicy();
  const [creditForm, setCreditForm] = useState<CreditPolicyFormState>(initialCreditPolicyForm);
  const [cashForm, setCashForm] = useState<CashPolicyFormState>(initialCashPolicyForm);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!credit.creditPolicy) return;
    setCreditForm(toCreditPolicyFormState(credit.creditPolicy));
  }, [credit.creditPolicy]);

  useEffect(() => {
    if (!cash.cashPolicy) return;
    setCashForm(toCashPolicyFormState(cash.cashPolicy));
  }, [cash.cashPolicy]);

  const handleCreditChange = (field: keyof CreditPolicyFormState, value: string | boolean) => {
    setSaveMessage(null);
    setCreditForm((currentForm) => ({
      ...currentForm,
      [field]:
        typeof value === 'string' && (field === 'defaultInterestRate' || field === 'specialInterestRate')
          ? limitDecimals(value, 3)
          : value,
    }));
  };

  const handlePenaltySettingChange = (frequency: PaymentFrequencyKey, field: keyof PenaltyFrequencyFormState, value: string) => {
    setSaveMessage(null);
    setCreditForm((currentForm) => ({
      ...currentForm,
      penaltySettings: {
        ...currentForm.penaltySettings,
        [frequency]: {
          ...currentForm.penaltySettings[frequency],
          [field]: field === 'rate' || field === 'capRate' || field === 'fixedDailyAmount' ? limitDecimals(value, 2) : value,
        },
      },
    }));
  };

  const handleCashChange = (field: keyof CashPolicyFormState, value: string | boolean) => {
    setSaveMessage(null);
    setCashForm((currentForm) => ({
      ...currentForm,
      [field]: typeof value === 'string' && field === 'maxCashDifference' ? limitDecimals(value, 2) : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveMessage(null);

    const creditSaved = await credit.updateCreditPolicy(creditForm);
    if (!creditSaved) return;

    const cashSaved = await cash.updateCashPolicy(cashForm);
    if (!cashSaved) return;

    setSaveMessage('Parametros guardados');
  };

  if (credit.isLoading || cash.isLoading) {
    return (
      <>
        <PageHeader
          actions={<Button variant="outline">Cargando</Button>}
          description="Configura reglas de credito, limites operativos, caja y boveda."
          title="Parametros"
        />
        <Card>
          <CardBody>Cargando parametros...</CardBody>
        </Card>
      </>
    );
  }

  if ((credit.error && !credit.creditPolicy) || (cash.error && !cash.cashPolicy)) {
    return (
      <>
        <PageHeader
          actions={
            <Button
              onClick={() => {
                void credit.refetch();
                void cash.refetch();
              }}
            >
              Reintentar
            </Button>
          }
          description="Configura reglas de credito, limites operativos, caja y boveda."
          title="Parametros"
        />
        <Card>
          <CardBody className="message--error">{credit.error ?? cash.error}</CardBody>
        </Card>
      </>
    );
  }

  const isSaving = credit.isSaving || cash.isSaving;

  return (
    <>
      <PageHeader
        actions={
          <Button disabled={isSaving} form="parameters-form" type="submit">
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        }
        description="Configura reglas de credito, limites operativos, caja y boveda."
        title="Parametros"
      />
      {credit.error || cash.error ? (
        <Card>
          <CardBody className="message--error">{credit.error ?? cash.error}</CardBody>
        </Card>
      ) : null}
      {saveMessage ? (
        <Card>
          <CardBody className="message--success">{saveMessage}</CardBody>
        </Card>
      ) : null}
      <form className="grid grid--two" id="parameters-form" onSubmit={handleSubmit}>
        <Card>
          <CardHeader description="Tasas mensuales y reglas de aprobacion." title="Credito" />
          <CardBody>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="defaultInterestRate">Tasa de interes mensual</label>
                <input
                  id="defaultInterestRate"
                  min="0"
                  onChange={(event) => handleCreditChange('defaultInterestRate', event.target.value)}
                  step="0.001"
                  type="number"
                  value={creditForm.defaultInterestRate}
                />
              </div>
              <div className="field">
                <label htmlFor="specialInterestRate">Tasa clientes especiales</label>
                <input
                  id="specialInterestRate"
                  min="0"
                  onChange={(event) => handleCreditChange('specialInterestRate', event.target.value)}
                  step="0.001"
                  type="number"
                  value={creditForm.specialInterestRate}
                />
              </div>
              <div className="field">
                <label htmlFor="maxAnalystApprovalAmount">Limite de analista</label>
                <input
                  id="maxAnalystApprovalAmount"
                  min="1"
                  onChange={(event) => handleCreditChange('maxAnalystApprovalAmount', event.target.value)}
                  step="1"
                  type="number"
                  value={creditForm.maxAnalystApprovalAmount}
                />
              </div>
              <div className="field">
                <label htmlFor="maxInstallments">Cuotas maximas</label>
                <input
                  id="maxInstallments"
                  min="1"
                  onChange={(event) => handleCreditChange('maxInstallments', event.target.value)}
                  step="1"
                  type="number"
                  value={creditForm.maxInstallments}
                />
              </div>
              <div className="field">
                <label htmlFor="graceDays">Dias de gracia</label>
                <input
                  id="graceDays"
                  min="0"
                  onChange={(event) => handleCreditChange('graceDays', event.target.value)}
                  step="1"
                  type="number"
                  value={creditForm.graceDays}
                />
              </div>
              <div className="field">
                <label htmlFor="maxRequestFiles">Maximo archivos solicitud</label>
                <input
                  id="maxRequestFiles"
                  min="1"
                  onChange={(event) => handleCreditChange('maxRequestFiles', event.target.value)}
                  step="1"
                  type="number"
                  value={creditForm.maxRequestFiles}
                />
              </div>
              <label className="field field--checkbox" htmlFor="requireApprovalAboveLimit">
                <input
                  checked={creditForm.requireApprovalAboveLimit}
                  id="requireApprovalAboveLimit"
                  onChange={(event) => handleCreditChange('requireApprovalAboveLimit', event.target.checked)}
                  type="checkbox"
                />
                Requiere aprobacion sobre limite
              </label>
              <div className="field field--full">
                <label>Mora por frecuencia</label>
                <div className="settings-list">
                  {penaltyFrequencyKeys.map((frequency) => {
                    const setting = creditForm.penaltySettings[frequency];
                    const isFixedDaily = setting.method === 'FIXED_DAILY';
                    const isCappedSimple = setting.method === 'CAPPED_SIMPLE';

                    return (
                      <div className="settings-panel" key={frequency}>
                        <strong>{paymentFrequencyLabels[frequency]}</strong>
                        <div className="form-grid">
                          <div className="field">
                            <label htmlFor={`${frequency}-penalty-method`}>Tipo de mora</label>
                            <select
                              id={`${frequency}-penalty-method`}
                              onChange={(event) => handlePenaltySettingChange(frequency, 'method', event.target.value)}
                              value={setting.method}
                            >
                              {penaltyMethodOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {!isFixedDaily ? (
                            <div className="field">
                              <label htmlFor={`${frequency}-penalty-rate`}>Tasa diaria (%)</label>
                              <input
                                id={`${frequency}-penalty-rate`}
                                min="0"
                                onChange={(event) => handlePenaltySettingChange(frequency, 'rate', event.target.value)}
                                step="0.01"
                                type="number"
                                value={setting.rate}
                              />
                            </div>
                          ) : null}
                          {isCappedSimple ? (
                            <div className="field">
                              <label htmlFor={`${frequency}-penalty-cap`}>Tope por cuota (%)</label>
                              <input
                                id={`${frequency}-penalty-cap`}
                                min="0"
                                onChange={(event) => handlePenaltySettingChange(frequency, 'capRate', event.target.value)}
                                step="0.01"
                                type="number"
                                value={setting.capRate}
                              />
                            </div>
                          ) : null}
                          {isFixedDaily ? (
                            <div className="field">
                              <label htmlFor={`${frequency}-fixed-daily-amount`}>Monto diario (S/)</label>
                              <input
                                id={`${frequency}-fixed-daily-amount`}
                                min="0"
                                onChange={(event) => handlePenaltySettingChange(frequency, 'fixedDailyAmount', event.target.value)}
                                step="0.01"
                                type="number"
                                value={setting.fixedDailyAmount}
                              />
                            </div>
                          ) : null}
                          <div className="field">
                            <label htmlFor={`${frequency}-grace-days`}>Dias de gracia</label>
                            <input
                              id={`${frequency}-grace-days`}
                              min="0"
                              onChange={(event) => handlePenaltySettingChange(frequency, 'graceDays', event.target.value)}
                              step="1"
                              type="number"
                              value={setting.graceDays}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader description="Reglas operativas de caja y boveda." title="Caja y boveda" />
          <CardBody>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="maxCashBoxBalance">Maximo efectivo caja</label>
                <input
                  id="maxCashBoxBalance"
                  min="1"
                  onChange={(event) => handleCashChange('maxCashBoxBalance', event.target.value)}
                  step="1"
                  type="number"
                  value={cashForm.maxCashBoxBalance}
                />
              </div>
              <div className="field">
                <label htmlFor="vaultWarningThreshold">Alerta de boveda</label>
                <input
                  id="vaultWarningThreshold"
                  min="0"
                  onChange={(event) => handleCashChange('vaultWarningThreshold', event.target.value)}
                  step="1"
                  type="number"
                  value={cashForm.vaultWarningThreshold}
                />
              </div>
              <div className="field">
                <label htmlFor="maxCashDifference">Diferencia maxima cierre</label>
                <input
                  id="maxCashDifference"
                  min="0"
                  onChange={(event) => handleCashChange('maxCashDifference', event.target.value)}
                  step="0.01"
                  type="number"
                  value={cashForm.maxCashDifference}
                />
              </div>
              <label className="field field--checkbox" htmlFor="requireDailyClosing">
                <input
                  checked={cashForm.requireDailyClosing}
                  id="requireDailyClosing"
                  onChange={(event) => handleCashChange('requireDailyClosing', event.target.checked)}
                  type="checkbox"
                />
                Cierre diario obligatorio
              </label>
              <label className="field field--checkbox" htmlFor="allowNegativeCash">
                <input
                  checked={cashForm.allowNegativeCash}
                  id="allowNegativeCash"
                  onChange={(event) => handleCashChange('allowNegativeCash', event.target.checked)}
                  type="checkbox"
                />
                Permitir caja negativa
              </label>
            </div>
          </CardBody>
        </Card>
      </form>
    </>
  );
};

const limitDecimals = (value: string, decimals: number) => {
  const [integerPart, decimalPart] = value.split('.');

  if (decimalPart === undefined) return value;
  return `${integerPart}.${decimalPart.slice(0, decimals)}`;
};
