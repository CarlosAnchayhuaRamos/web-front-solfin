const moneyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
});

const percentageFormatter = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  style: 'percent',
});

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const formatMoney = (value: number) => {
  return moneyFormatter.format(value);
};

export const formatPercentage = (value: number) => {
  return percentageFormatter.format(value);
};

export const formatDueDate = (value: string) => {
  return dateFormatter.format(new Date(value));
};
