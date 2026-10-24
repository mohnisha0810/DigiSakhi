type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

type ToastListener = (toasts: ToastMessage[]) => void;

class ToastManager {
  private toasts: ToastMessage[] = [];
  private listeners: Set<ToastListener> = new Set();

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener([...this.toasts]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  public show(type: ToastType, message: string, title?: string, duration = 3800) {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const toast: ToastMessage = { id, type, message, title };
    this.toasts = [...this.toasts, toast];
    this.notify();

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  public success(message: string, title?: string) {
    this.show('success', message, title || 'Success');
  }

  public error(message: string, title?: string) {
    this.show('error', message, title || 'Notice');
  }

  public info(message: string, title?: string) {
    this.show('info', message, title || 'Information');
  }

  public remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }
}

export const toast = new ToastManager();
