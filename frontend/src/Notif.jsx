import React, { createContext, useState, useEffect } from 'react';
import { socket } from './socket';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [lastUpdateMessage, setLastUpdateMessage] = useState('Aucun pointage reçu');

  useEffect(() => {
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    const handlePointageUpdate = (data) => {
      console.log("🔔 Pointage update reçu :", data);
      setLastUpdateMessage('✅ Pointage mis à jour !'); // Message succès
      // Ajouter ou mettre à jour la notification si besoin
      setNotifications(prev => [data, ...(Array.isArray(prev) ? prev : [])]);
      // Effacer le message après 3 secondes
      setTimeout(() => setLastUpdateMessage(''), 3000);
    };

    socket.on("pointage_update", handlePointageUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("pointage_update", handlePointageUpdate);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, socketConnected, lastUpdateMessage }}>
      {children}
    </NotificationContext.Provider>
  );
};
