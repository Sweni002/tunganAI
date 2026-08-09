// mockData.js

export const sparklinesDataMock = {
  visualControl: {
    title: "01. Contrôle Visuel (Anti-spoofing + Masque)",
    unit: "ms",
    data: [25, 22, 19, 21, 18, 20, 17, 18], // L'historique des relevés (ms)
    color: "#38bdf8", // Bleu Cyan
  },
  identification: {
    title: "02. Identification (Recherche 1:N BDD)",
    unit: "ms",
    data: [16, 15, 13, 14, 12, 11, 13, 12],
    color: "#818cf8", // Indigo
  },
  totalPointage: {
    title: "03. Pointage Total (Bout-en-bout)",
    unit: "ms",
    data: [55, 48, 45, 50, 42, 44, 46, 45],
    color: "#34d399", // Vert Émeraude
  },
  globalAverage: {
    title: "Moyenne globale des performances",
    unit: "ms",
    data: [49, 47, 46, 45, 45, 44, 45, 44.8],
    color: "#f59e0b", // Amber / Ambre
  },
};