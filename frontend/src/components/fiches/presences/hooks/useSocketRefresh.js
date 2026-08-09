// hooks/useSocketRefresh.js
import { useEffect } from 'react';
import { socket } from '../../../../socket';

export function useSocketRefresh(onUpdate) {
  useEffect(() => {
    const handler = (data) => {
      console.log('🔔 Pointage reçu :', data);
      onUpdate();
    };

    socket.on('pointage_update', handler);
    return () => socket.off('pointage_update', handler);
  }, [onUpdate]);
}