import { BadRequestException } from '@nestjs/common';
import type { PaymentFrequency } from '@prisma/client';
import type { PenaltyFrequencySetting } from '../parameters/parameters.types';
import type { PenaltyScheduleState } from './credits.types';

export const limaDate = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`);
};

export const creditDueDate = (frequency: PaymentFrequency, installmentNo: number, base = limaDate()) => {
  const date = new Date(base);
  if (frequency === 'DAILY') {
    let remaining = installmentNo;
    while (remaining > 0) {
      date.setUTCDate(date.getUTCDate() + 1);
      if (date.getUTCDay() !== 0) remaining -= 1;
    }
    return date;
  }
  if (frequency === 'WEEKLY') {
    date.setUTCDate(date.getUTCDate() + (installmentNo - 1) * 7);
    return date;
  }
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + installmentNo - 1);
  const monthEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, monthEnd));
  return date;
};

export const readPenaltyTerms = (value: unknown): PenaltyFrequencySetting => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('Credito sin condiciones de mora guardadas; requiere regularizacion');
  }
  const setting = value as PenaltyFrequencySetting;
  if (!['SIMPLE', 'CAPPED_SIMPLE', 'FIXED_DAILY'].includes(setting.method)
    || ![setting.rate, setting.capRate, setting.fixedDailyAmount, setting.graceDays].every((n) => Number.isFinite(n) && n >= 0)
    || !Number.isInteger(setting.graceDays)) {
    throw new BadRequestException('Condiciones de mora invalidas');
  }
  return setting;
};

export const documentChecklist = (value: unknown) => {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return { contract: data.contract === true, schedule: data.schedule === true, disbursementRequest: data.disbursementRequest === true };
};

export const penaltyDays = (dueDate: Date, graceDays: number, today = limaDate()) =>
  Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000) - graceDays);

export const accruedPenalty = (schedule: PenaltyScheduleState, setting: PenaltyFrequencySetting, today = limaDate()) => {
  const previous = Number(schedule.penalty);
  if (schedule.status === 'PAID' || schedule.status === 'CANCELED') return previous;
  const newDays = Math.max(0, penaltyDays(schedule.dueDate, setting.graceDays, today) - schedule.penaltyAccruedDays);
  const basePaid = Number(schedule.paidAmount) - Number(schedule.penaltyPaid);
  const base = Math.max(0, Number(schedule.totalDue) - basePaid);
  if (base <= 0 || newDays === 0) return previous;
  const daily = setting.method === 'FIXED_DAILY' ? setting.fixedDailyAmount : base * setting.rate;
  const total = Math.round((previous + newDays * daily) * 100) / 100;
  if (setting.method !== 'CAPPED_SIMPLE') return total;
  // The original installment fixes the lifetime cap; an abono cannot erase accrued mora.
  return Math.max(previous, Math.min(total, Math.round(Number(schedule.totalDue) * setting.capRate * 100) / 100));
};
