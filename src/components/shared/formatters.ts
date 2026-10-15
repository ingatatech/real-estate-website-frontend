export const formatPrice = (price: string | number | null, currency: string | null = 'RWF'): string => {
  if (price === null || price === undefined || price === '') return 'Price on request';
  const amount = Number(price);
  if (!Number.isFinite(amount)) return 'Price on request';
  return `${currency || 'RWF'} ${amount.toLocaleString()}`;
};

export const formatDate = (date: string | Date | null, includeTime = false): string => {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString(undefined, includeTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatLabel = (value?: string | null): string => {
  if (!value) return '—';
  return value.replace(/[_-]/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};
