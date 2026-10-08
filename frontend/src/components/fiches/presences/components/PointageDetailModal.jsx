// components/PointageDetailModal.jsx
// Détail d'un pointage : agent, journée (matin / après-midi), autorisations, récap du mois.
import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import Dialog from '@mui/material/Dialog';
import styles from './pointageDetail.module.css';

dayjs.locale('fr');

const API_URL = import.meta.env.VITE_API_URL;

const STATUTS = {
  present: { label: 'Présent', icon: 'fa-solid fa-circle-check', cls: 'ok' },
  retard: { label: 'En retard', icon: 'fa-regular fa-clock', cls: 'late' },
  absent: { label: 'Absent', icon: 'fa-solid fa-circle-xmark', cls: 'abs' },
  non_pointe: { label: 'Non pointé', icon: 'fa-regular fa-hourglass-half', cls: 'wait' },
};

const ROLES = { bureau: 'Agent de bureau', surface: 'Agent de surface', personnel: 'Personnel' };

const formatDuree = (min) => {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
};

const formatRetard = (min) => (min > 0 ? `${min} min` : 'Aucun');

function StatutPill({ statut }) {
  const s = STATUTS[statut] || STATUTS.non_pointe;
  return (
    <span className={`${styles.pill} ${styles[s.cls]}`}>
      <i className={s.icon} aria-hidden="true"></i>
      {s.label}
    </span>
  );
}

function Avatar({ personnel }) {
  const initiales = `${personnel.prenom?.[0] ?? ''}${personnel.nom?.[0] ?? ''}`.toUpperCase();
  const [broken, setBroken] = React.useState(false);
  return (
    <div className={styles.avatar}>
      {personnel.image && !broken ? (
        <img
          src={`${API_URL}/uploads/${personnel.image}`}
          alt={`${personnel.prenom} ${personnel.nom}`}
          onError={() => setBroken(true)}
        />
      ) : (
        <span>{initiales || '?'}</span>
      )}
    </div>
  );
}

/** Une demi-journée : horaires d'entrée → sortie + statut + retard. */
function PeriodeCard({ titre, icone, data, delay }) {
  return (
    <div className={styles.periode} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.periodeHead}>
        <span className={styles.periodeTitle}>
          <i className={icone} aria-hidden="true"></i>
          {titre}
        </span>
        <StatutPill statut={data.statut} />
      </div>

      <div className={styles.horaires}>
        <div className={styles.horaire}>
          <span className={styles.label}>Entrée</span>
          <strong>{data.entree ?? '—'}</strong>
        </div>
        <i className={`fa-solid fa-arrow-right ${styles.arrow}`} aria-hidden="true"></i>
        <div className={styles.horaire}>
          <span className={styles.label}>Sortie</span>
          <strong>{data.sortie ?? '—'}</strong>
        </div>
      </div>

      <dl className={styles.facts}>
        {'retard_minutes' in data && (
          <div>
            <dt>Retard</dt>
            <dd className={data.retard ? styles.textLate : undefined}>{formatRetard(data.retard_minutes)}</dd>
          </div>
        )}
        <div>
          <dt>Durée</dt>
          <dd>{formatDuree(data.duree_minutes)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Tile({ icon, label, value, delay, tone }) {
  return (
    <div className={`${styles.tile} ${tone ? styles[tone] : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <span className={styles.tileIcon}>
        <i className={icon} aria-hidden="true"></i>
      </span>
      <strong>{value}</strong>
      <span className={styles.label}>{label}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className={styles.body} aria-busy="true" aria-label="Chargement">
      <div className={`${styles.skel} ${styles.skelHead}`} />
      <div className={styles.grid2}>
        <div className={`${styles.skel} ${styles.skelCard}`} />
        <div className={`${styles.skel} ${styles.skelCard}`} />
      </div>
      <div className={`${styles.skel} ${styles.skelRow}`} />
    </div>
  );
}

export default function PointageDetailModal({ open, onClose, detail, loading, error }) {
  const personnel = detail?.personnel;
  const pointage = detail?.pointage;
  const isSurface = pointage?.role === 'surface';
  const date = pointage ? dayjs(pointage.date) : null;
  const speciales = detail?.autorisations?.speciales ?? [];
  const absences = detail?.autorisations?.absences ?? [];
  const recap = detail?.recap_mois;
  const h = detail?.horaires;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
      aria-labelledby="pointage-detail-title"
      slotProps={{ paper: { className: styles.paper }, backdrop: { className: styles.backdrop } }}
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>

      {loading && <Skeleton />}

      {!loading && error && (
        <div className={styles.body}>
          <div className={styles.errorBox} role="alert">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && detail && (
        <div className={styles.body}>
          {/* ---------- En-tête : agent ---------- */}
          <header className={styles.head}>
            <Avatar personnel={personnel} />
            <div className={styles.identity}>
              <h2 id="pointage-detail-title" className={styles.name}>
                {personnel.prenom} {personnel.nom}
              </h2>
              <p className={styles.meta}>
                <span>{personnel.matricule}</span>
                <span className={styles.sep} aria-hidden="true">·</span>
                <span>{ROLES[personnel.role] ?? personnel.role}</span>
              </p>
              <p className={styles.meta}>
                {[personnel.division, personnel.sigle || personnel.service].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <div className={styles.headSide}>
              <StatutPill statut={pointage.statut} />
              <span className={styles.date}>{date.format('dddd D MMMM YYYY')}</span>
            </div>
          </header>

          {/* ---------- Journée ---------- */}
          <section aria-label="Journée" className={styles.section}>
            <h3 className={styles.sectionTitle}>Journée</h3>
            {isSurface ? (
              <PeriodeCard titre="Journée" icone="fa-solid fa-sun" data={pointage.unique} delay={0} />
            ) : (
              <div className={styles.grid2}>
                <PeriodeCard titre="Matin" icone="fa-solid fa-sun" data={pointage.matin} delay={0} />
                <PeriodeCard titre="Après-midi" icone="fa-solid fa-cloud-sun" data={pointage.apres_midi} delay={70} />
              </div>
            )}

            <div className={styles.tiles}>
              <Tile icon="fa-solid fa-hourglass-half" label="Durée travaillée" value={formatDuree(pointage.duree_travaillee_minutes)} delay={120} />
              {!isSurface && (
                <Tile
                  icon="fa-regular fa-clock"
                  label="Retard total"
                  value={formatRetard(pointage.retard_total_minutes)}
                  tone={pointage.retard_total_minutes > 0 ? 'late' : undefined}
                  delay={190}
                />
              )}
              <Tile icon="fa-solid fa-paperclip" label="Justificatif" value={pointage.justificatif || '—'} delay={260} />
            </div>
          </section>

          {/* ---------- Autorisations du jour ---------- */}
          {(speciales.length > 0 || absences.length > 0) && (
            <section aria-label="Autorisations" className={styles.section}>
              <h3 className={styles.sectionTitle}>Autorisations du jour</h3>
              <ul className={styles.autoList}>
                {speciales.map((a) => (
                  <li key={`s${a.id}`} className={styles.auto}>
                    <span className={styles.autoIcon}>
                      <i className={a.type === 'retard' ? 'fa-regular fa-clock' : 'fa-solid fa-person-walking-arrow-right'} aria-hidden="true"></i>
                    </span>
                    <div>
                      <strong>
                        {a.type === 'retard' ? 'Autorisation de retard' : 'Autorisation de sortie'}
                        {' · '}
                        {a.periode === 'matin' ? 'matin' : 'après-midi'}
                      </strong>
                      <p>{a.motif}</p>
                    </div>
                  </li>
                ))}
                {absences.map((a) => (
                  <li key={`a${a.id}`} className={styles.auto}>
                    <span className={styles.autoIcon}>
                      <i className="fa-solid fa-file-circle-check" aria-hidden="true"></i>
                    </span>
                    <div>
                      <strong>
                        {a.type || "Autorisation d'absence"}
                        {a.demi_journee && a.demi_journee !== 'complete' ? ` · ${a.demi_journee}` : ' · journée complète'}
                      </strong>
                      <p>{a.motif}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---------- Plages du service ---------- */}
          {h && !isSurface && (
            <section aria-label="Horaires du service" className={styles.section}>
              <h3 className={styles.sectionTitle}>Horaires du service</h3>
              <div className={styles.plages}>
                <div className={styles.plage}>
                  <span className={styles.label}>Matin</span>
                  <p>Entrée {h.entree_matin_debut} – {h.entree_matin_fin}</p>
                  <p>Sortie {h.sortie_matin_debut} – {h.sortie_matin_fin}</p>
                </div>
                <div className={styles.plage}>
                  <span className={styles.label}>Après-midi</span>
                  <p>Entrée {h.entree_soir_debut} – {h.entree_soir_fin}</p>
                  <p>Sortie {h.sortie_soir_debut} – {h.sortie_soir_fin}</p>
                </div>
              </div>
            </section>
          )}

          {/* ---------- Récap du mois ---------- */}
          {recap && (
            <section aria-label="Récapitulatif du mois" className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Récapitulatif de {dayjs(`${recap.annee}-${recap.mois}-01`).format('MMMM YYYY')}
              </h3>
              <div className={styles.tiles}>
                <Tile icon="fa-solid fa-calendar-check" label="Jours pointés" value={recap.jours_pointes} delay={0} />
                <Tile icon="fa-regular fa-clock" label="Jours de retard" value={recap.jours_retard} delay={70} />
                <Tile icon="fa-solid fa-stopwatch" label="Retard cumulé" value={formatRetard(recap.retard_minutes)} delay={140} />
                <Tile icon="fa-solid fa-user-xmark" label="Jours d'absence" value={recap.jours_absence} delay={210} />
              </div>
            </section>
          )}
        </div>
      )}
    </Dialog>
  );
}
