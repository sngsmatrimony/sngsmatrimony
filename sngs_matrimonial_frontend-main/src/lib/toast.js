import { toast } from 'sonner';

/**
 * Toast utility functions with consistent theming
 * Matches the warm color palette from CLAUDE.md
 */

export const toastSuccess = (message, options = {}) => {
  return toast.success(message, {
    className: 'bg-success text-white',
    ...options,
  });
};

export const toastError = (message, options = {}) => {
  return toast.error(message, {
    className: 'bg-destructive text-white',
    ...options,
  });
};

export const toastInfo = (message, options = {}) => {
  return toast.info(message, {
    className: 'bg-secondary text-white',
    ...options,
  });
};

export const toastWarning = (message, options = {}) => {
  return toast.warning(message, {
    className: 'bg-accent text-black',
    ...options,
  });
};

/**
 * Generic toast function with all options
 */
export const showToast = (message, type = 'default', options = {}) => {
  return toast[type](message, options);
};
