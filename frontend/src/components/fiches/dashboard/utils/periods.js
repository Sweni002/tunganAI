import dayjs from 'dayjs';

const FMT = 'YYYY-MM-DD';

/** Périodes prédéfinies ; `custom` laisse l'utilisateur choisir ses dates. */
export const PRESETS = [
  { key: '7j', label: '7 jours' },
  { key: '30j', label: '30 jours' },
  { key: 'mois', label: 'Ce mois' },
  { key: 'mois_prec', label: 'Mois dernier' },
  { key: 'custom', label: 'Personnalisé' },
];

/** Retourne { debut, fin } (YYYY-MM-DD) pour un preset ; null pour `custom`. */
export function rangeForPreset(key) {
  const today = dayjs();
  switch (key) {
    case '7j':
      return { debut: today.subtract(6, 'day').format(FMT), fin: today.format(FMT) };
    case '30j':
      return { debut: today.subtract(29, 'day').format(FMT), fin: today.format(FMT) };
    case 'mois':
      return { debut: today.startOf('month').format(FMT), fin: today.format(FMT) };
    case 'mois_prec': {
      const m = today.subtract(1, 'month');
      return { debut: m.startOf('month').format(FMT), fin: m.endOf('month').format(FMT) };
    }
    default:
      return null;
  }
}

export const formatJourCourt = (iso) => dayjs(iso).format('DD/MM');
export const formatJourLong = (iso) => dayjs(iso).locale('fr').format('dddd D MMMM');

/** 125 → "2 h 05" ; 40 → "40 min" */
export const formatMinutes = (m) => {
  const n = Math.round(Number(m) || 0);
  return n >= 60 ? `${Math.floor(n / 60)} h ${String(n % 60).padStart(2, '0')}` : `${n} min`;
};

/** Nombre de jours (demi-journées comprises) : 2 → "2", 2.5 → "2,5" */
export const formatJours = (v) => String(Math.round((Number(v) || 0) * 10) / 10).replace('.', ',');
