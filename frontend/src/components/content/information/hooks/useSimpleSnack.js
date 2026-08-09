// hooks/useSimpleSnack.js
import { useState } from 'react';

export function useSimpleSnack() {
  const [msg, setMsg] = useState('');
  const [openSnack, setOpenSnack] = useState(false);

  const handleCloseSnack = (_event, reason) => {
    if (reason === 'clickaway') {
      setOpenSnack(false);
      return;
    }
    setOpenSnack(false);
  };

  return { msg, setMsg, openSnack, setOpenSnack, handleCloseSnack };
}
