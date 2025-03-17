import { useSnackbar, VariantType } from 'notistack';

// Create a custom hook to use these notification functions anywhere
export const useNotifications = () => {
  const { enqueueSnackbar } = useSnackbar();

  // Default notification
  const nd = (message: string) => enqueueSnackbar(message, { variant: 'default' });

  // Success notification 
  const ns = (message: string) => enqueueSnackbar(message, { variant: 'success' });

  // Error notification
  const ne = (message: string) => enqueueSnackbar(message, { variant: 'error' });

  // Warning notification
  const nw = (message: string) => enqueueSnackbar(message, { variant: 'warning' });

  // Info notification
  const ni = (message: string) => enqueueSnackbar(message, { variant: 'info' });

  return { nd, ns, ne, nw, ni };
};