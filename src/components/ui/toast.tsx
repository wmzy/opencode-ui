import { toast } from 'sonner';
import type { ExternalToast } from 'sonner';

export type { ExternalToast as ToastOptions };

export function showToast(message: string, options?: ExternalToast) {
  toast(message, options);
}

export function showSuccess(message: string, options?: ExternalToast) {
  toast.success(message, options);
}

export function showError(message: string, options?: ExternalToast) {
  toast.error(message, options);
}

export function showInfo(message: string, options?: ExternalToast) {
  toast.info(message, options);
}

export function showWarning(message: string, options?: ExternalToast) {
  toast.warning(message, options);
}

export type ShowPromiseOptions<T> = {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((err: unknown) => string);
} & ExternalToast;

export function showPromise<T>(
  promise: Promise<T>,
  opts: ShowPromiseOptions<T>,
) {
  toast.promise(promise, opts);
}

export function dismissToast(id?: string | number) {
  toast.dismiss(id);
}

export { Toaster } from 'sonner';
