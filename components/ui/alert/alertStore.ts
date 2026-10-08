export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
}

export type AlertVariant = 'info' | 'success' | 'error' | 'warning';

export interface AlertOptions {
  variant?: AlertVariant;
  /** Allow dismissing via backdrop tap / Android back button. */
  cancelable?: boolean;
}

export interface AlertRequest {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  variant?: AlertVariant;
  cancelable: boolean;
}

// Alerts are queued so a button's onPress can open another alert
// (e.g. confirm -> error) without clobbering the one being dismissed.
let queue: AlertRequest[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const alertStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getCurrent(): AlertRequest | null {
    return queue[0] ?? null;
  },
  dismiss(id: number) {
    if (queue[0]?.id !== id) return;
    queue = queue.slice(1);
    emit();
  },
};

/** Same signature as React Native's `Alert.alert`, plus themed options. */
export const alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) => {
  const resolvedButtons = buttons?.length ? buttons : [{ text: 'OK' }];
  const cancelable =
    options?.cancelable ??
    (resolvedButtons.length === 1 ||
      resolvedButtons.some((b) => b.style === 'cancel'));

  queue = [
    ...queue,
    {
      id: nextId++,
      title,
      message,
      buttons: resolvedButtons,
      variant: options?.variant,
      cancelable,
    },
  ];
  emit();
};

export const AppAlert = { alert };
