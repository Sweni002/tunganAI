// hooks/useSnackbar.js
import { useEffect, useState, useCallback } from 'react';

export function useSnackbar() {
  const [snackMessage, setSnackMessage] = useState('');
  const [snackError, setSnackError] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);

  const showSnack = useCallback((message, isError = false) => {
    setSnackMessage(message);
    setSnackError(isError);
    setOpenSnack(true);
  }, []);

  const closeSnack = useCallback(() => setOpenSnack(false), []);

  // Reprend un message éventuellement déposé dans sessionStorage
  // par une autre page (ex: redirection après création/suppression).
  useEffect(() => {
    const snackMsg = sessionStorage.getItem('snackMessage');
    const snackErr = sessionStorage.getItem('snackError') === 'true';

    if (snackMsg) {
      showSnack(snackMsg, snackErr);
      sessionStorage.removeItem('snackMessage');
      sessionStorage.removeItem('snackError');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { snackMessage, snackError, openSnack, showSnack, closeSnack };
}