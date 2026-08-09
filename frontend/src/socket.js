import { io } from "socket.io-client";


const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;


console.log("SOCKET_URL =", SOCKET_URL);

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  withCredentials: true
});

socket.on("connect", () => {
  console.log("⚡ Socket connecté, id =", socket.id);
});
socket.on("connect_error", (err) => {
  console.log("❌ Erreur connexion socket:", err.message);
});

socket.on("disconnect", () => {
  console.log("❌ Socket déconnectée");
});
