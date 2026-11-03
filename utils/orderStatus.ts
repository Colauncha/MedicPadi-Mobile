import { Theme } from '@/theme/types';

export const formatPrice = (price: number): string =>
  `₦${price.toLocaleString('en-NG')}`;

// Amounts come back as decimal strings, e.g. "4500.00".
export const toAmount = (raw?: string | number | null): number => {
  const n = typeof raw === 'number' ? raw : parseFloat(raw ?? '');
  return Number.isFinite(n) ? n : 0;
};

export const toLabel = (raw?: string | null): string =>
  (raw ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
  'Unknown';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const toneOf = (raw?: string | null): Tone => {
  const s = (raw ?? '').toLowerCase();
  if (['success', 'paid', 'escrow', 'completed', 'delivered'].includes(s))
    return 'success';
  if (['failed', 'cancelled', 'canceled', 'rejected', 'refunded'].includes(s))
    return 'danger';
  if (s) return 'warning';
  return 'neutral';
};

/** Background and text colors for a requisition or payment status badge. */
export const statusColors = (theme: Theme, raw?: string | null) => {
  switch (toneOf(raw)) {
    case 'success':
      return { bg: theme.colors.successBg, fg: theme.colors.success };
    case 'danger':
      return { bg: theme.colors.dangerBg, fg: theme.colors.danger };
    case 'warning':
      return { bg: theme.colors.warningBg, fg: theme.colors.warning };
    default:
      return { bg: theme.colors.surfaceCard, fg: theme.colors.textMuted };
  }
};
