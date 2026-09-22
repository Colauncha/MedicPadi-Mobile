export const formatTime = (isoString: string) => {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export type TimeFormat = '24h' | '12h';

export const formatTimeAdv = (
  hour: number | null | undefined,
  format: TimeFormat = '24h'
): string => {
  if (hour == null || Number.isNaN(Number(hour))) {
    return '';
  }

  const normalizedHour = Number(hour);

  // Keep invalid API values from producing invalid times.
  if (normalizedHour < 0 || normalizedHour > 23) {
    return '';
  }

  if (format === '12h') {
    const period = normalizedHour >= 12 ? 'PM' : 'AM';
    const displayHour = normalizedHour % 12 || 12;

    return `${displayHour}:00 ${period}`;
  }

  return `${String(normalizedHour).padStart(2, '0')}:00`;
};

export const formatDate = (isoString: string, showYear: boolean = false) => {
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'long',
      year: showYear ? '2-digit' : undefined,
    });
  } catch {
    return '';
  }
};

export const formatDateWeekday = (
  isoString: string,
  showYear: boolean = false,
  format_: boolean = true
) => {
  try {
    const date = new Date(isoString);

    const format = new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: 'long',
      year: showYear ? '2-digit' : undefined,
      weekday: 'long',
    });
    if (!format_) return format.format();

    const parts = format.formatToParts(date);
    const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));

    return `${partMap.weekday}, ${partMap.day} ${partMap.month}`;
  } catch {
    return '';
  }
};

export const getAge = (isoString: string, suffix: string = 'years old') => {
  try {
    const birthYear = new Date(isoString).getFullYear();
    const currentYear = new Date().getFullYear();
    return `${currentYear - birthYear || 0} ${suffix}`;
  } catch {
    return '';
  }
};
