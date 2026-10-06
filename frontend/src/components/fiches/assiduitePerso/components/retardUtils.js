// total_retard_minutes arrive du backend au format "HH:MM:SS" (voir fiche_api.py)
export function hmsToMinutes(v) {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return 0;
  const [h = 0, m = 0, s = 0] = v.split(":").map((x) => parseInt(x, 10) || 0);
  return h * 60 + m + Math.round(s / 60);
}

export const fmtMin = (m) =>
  m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`;
