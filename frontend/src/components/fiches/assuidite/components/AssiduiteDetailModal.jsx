// Fenêtre « détail d'un agent » : informations personnelles + assiduité du mois sélectionné.
import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import Dialog from '@mui/material/Dialog';
import styles from './assiduiteDetail.module.css';

const API_URL = import.meta.env.VITE_API_URL;

const ROLES = { bureau: 'Agent de bureau', surface: 'Agent de surface', personnel: 'Personnel' };

/** 1,5 -> « 1,5 » ; 2 -> « 2 » */
const nb = (n) => Number(n || 0).toString().replace('.', ',');

/** « 05/10/2026 après-midi » -> { date: '05/10/2026', periode: 'après-midi' } */
const parseDate = (texte) => {
  const m = String(texte).match(/^(\d{2}\/\d{2}\/\d{4})\s*(.*)$/);
  return m ? { date: m[1], periode: m[2] } : { date: String(texte), periode: '' };
};

function Avatar({ personnel }) {
  const [broken, setBroken] = React.useState(false);
  const initiales = `${personnel.prenom?.[0] ?? ''}${personnel.nom?.[0] ?? ''}`.toUpperCase();
  return (
    <div className={styles.avatar}>
      {personnel.image && !broken ? (
        <img src={`${API_URL}/uploads/${personnel.image}`} alt="" onError={() => setBroken(true)} />
      ) : (
        <span>{initiales || '?'}</span>
      )}
    </div>
  );
}

/** Une tuile : nombre entier de matins / soirs, ou une valeur unique. */
function Tile({ icon, label, tone, hint, split, value, delay }) {
  return (
    <div className={`${styles.tile} ${styles[tone]}`} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.tileHead}>
        <span className={styles.tileIcon}>
          <i className={icon} aria-hidden="true"></i>
        </span>
        <span className={styles.tileLabel}>{label}</span>
      </div>
      {split ? (
        <div className={styles.split}>
          <div className={styles.half}>
            <span className={styles.halfLabel}><i className="fa-solid fa-sun" aria-hidden="true"></i>Matin</span>
            <strong>{split.matin}</strong>
          </div>
          <div className={styles.half}>
            <span className={styles.halfLabel}><i className="fa-solid fa-cloud-sun" aria-hidden="true"></i>Soir</span>
            <strong>{split.soir}</strong>
          </div>
        </div>
      ) : (
        <strong className={styles.bigValue}>{value}</strong>
      )}
      {hint && <span className={styles.tileHint}>{hint}</span>}
    </div>
  );
}

/** Liste de dates sous forme de pastilles. */
function DateChips({ dates, tone }) {
  if (!dates?.length) return null;
  return (
    <ul className={styles.chips}>
      {dates.map((d, i) => {
        const { date, periode } = parseDate(d);
        return (
          <li key={`${d}-${i}`} className={`${styles.chip} ${styles[tone]}`}>
            {date}
            {periode && <span>{periode}</span>}
          </li>
        );
      })}
    </ul>
  );
}

function Section({ titre, icone, children }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        <i className={icone} aria-hidden="true"></i>
        {titre}
      </h3>
      {children}
    </section>
  );
}

function Skeleton() {
  return (
    <div className={styles.body} aria-busy="true" aria-label="Chargement">
      <div className={`${styles.skel} ${styles.skelHead}`} />
      <div className={styles.tiles}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${styles.skel} ${styles.skelTile}`} />
        ))}
      </div>
      <div className={`${styles.skel} ${styles.skelRow}`} />
    </div>
  );
}

export default function AssiduiteDetailModal({ open, onClose, detail, loading, error }) {
  const personnel = detail?.personnel;
  const fiche = detail?.fiche;
  const matin = detail?.matin;
  const soir = detail?.soir;
  const mois = detail ? dayjs(`${detail.annee}-${detail.mois}-01`).locale('fr').format('MMMM YYYY') : '';

  const nonJust = fiche?.absences?.non_justifiees;
  const types = (fiche?.absences_par_type ?? []).filter((t) => t.nombre > 0);
  const autres = fiche?.absences?.autres ?? [];
  const aRetard = (fiche?.retards?.nombre ?? 0) > 0;

  const statut = !fiche
    ? null
    : (nonJust?.nombre ?? 0) > 0
      ? { cls: 'bad', icon: 'fa-solid fa-triangle-exclamation', texte: 'Absences à régulariser' }
      : aRetard
        ? { cls: 'warn', icon: 'fa-solid fa-circle-info', texte: 'Quelques retards ce mois-ci' }
        : { cls: 'ok', icon: 'fa-solid fa-circle-check', texte: 'Assiduité exemplaire' };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
      aria-labelledby="assiduite-detail-title"
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
              <h2 id="assiduite-detail-title" className={styles.name}>
                {personnel.prenom} {personnel.nom}
              </h2>
              <p className={styles.meta}>
                {personnel.matricule} · {ROLES[personnel.role] ?? personnel.role}
              </p>
              <p className={styles.meta}>
                {[personnel.division, personnel.sigle || personnel.service].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <div className={styles.headSide}>
              {statut && (
                <span className={`${styles.status} ${styles[statut.cls]}`}>
                  <i className={statut.icon} aria-hidden="true"></i>
                  {statut.texte}
                </span>
              )}
              <span className={styles.month}>
                <i className="fa-regular fa-calendar" aria-hidden="true"></i>
                {mois}
              </span>
            </div>
          </header>

          {/* ---------- Résumé du mois ---------- */}
          <Section titre="Résumé du mois" icone="fa-solid fa-chart-simple">
            <div className={styles.tiles}>
              <Tile
                icon="fa-regular fa-clock"
                label="Retards"
                tone="warn"
                split={{ matin: matin.retards, soir: soir.retards }}
                hint={`Cumul : ${fiche.total_retard_minutes}`}
                delay={0}
              />
              <Tile
                icon="fa-solid fa-user-xmark"
                label="Absences non justifiées"
                tone="bad"
                split={{ matin: matin.absences_non_justifiees, soir: soir.absences_non_justifiees }}
                hint={nonJust?.nombre > 0 ? 'À régulariser' : 'Rien à signaler'}
                delay={70}
              />
              <Tile
                icon="fa-solid fa-user-check"
                label="Absences justifiées"
                tone="info"
                split={{ matin: matin.absences_justifiees, soir: soir.absences_justifiees }}
                hint="Demi-journées valables"
                delay={140}
              />
              <Tile
                icon="fa-solid fa-calendar-check"
                label="Jours de présence"
                tone="ok"
                value={nb(fiche.presences)}
                hint={`${detail.jours_pointes} fiche${detail.jours_pointes > 1 ? 's' : ''} de pointage`}
                delay={210}
              />
            </div>
          </Section>

          {/* ---------- Retards ---------- */}
          <Section titre="Retards" icone="fa-regular fa-clock">
            {aRetard ? (
              <>
                <p className={styles.note}>
                  {nb(fiche.retards.nombre)} jour{fiche.retards.nombre > 1 ? 's' : ''} de retard · matin{' '}
                  {fiche.retard_matin_minutes} min · après-midi {fiche.retard_soir_minutes} min
                </p>
                <DateChips dates={fiche.retards.dates} tone="warn" />
              </>
            ) : (
              <p className={styles.empty}>
                <i className="fa-regular fa-circle-check" aria-hidden="true"></i>
                Aucun retard ce mois-ci
              </p>
            )}
          </Section>

          {/* ---------- Absences non justifiées ---------- */}
          {(nonJust?.dates?.length ?? 0) > 0 && (
            <Section titre="Absences non justifiées" icone="fa-solid fa-user-xmark">
              <p className={styles.note}>
                {nb(nonJust.nombre)} jour{nonJust.nombre > 1 ? 's' : ''} à régulariser
              </p>
              <DateChips dates={nonJust.dates} tone="bad" />
            </Section>
          )}

          {/* ---------- Absences justifiées, par type ---------- */}
          {(types.length > 0 || autres.length > 0 || fiche.repos?.nombre > 0 || fiche.missions?.nombre > 0) && (
            <Section titre="Absences justifiées" icone="fa-solid fa-file-circle-check">
              <ul className={styles.typeList}>
                {types.map((t) => (
                  <li key={t.idtype} className={styles.typeRow}>
                    <div className={styles.typeHead}>
                      <strong>{t.nomtype || t.abbreviation || 'Autre'}</strong>
                      <span className={styles.typeCount}>{nb(t.nombre)} j</span>
                    </div>
                    <DateChips dates={t.dates} tone="info" />
                  </li>
                ))}
                {fiche.repos?.nombre > 0 && (
                  <li className={styles.typeRow}>
                    <div className={styles.typeHead}>
                      <strong>Repos</strong>
                      <span className={styles.typeCount}>{fiche.repos.nombre} j</span>
                    </div>
                    <DateChips dates={fiche.repos.dates} tone="info" />
                  </li>
                )}
                {fiche.missions?.nombre > 0 && (
                  <li className={styles.typeRow}>
                    <div className={styles.typeHead}>
                      <strong>Missions</strong>
                      <span className={styles.typeCount}>{fiche.missions.nombre} j</span>
                    </div>
                    <DateChips dates={fiche.missions.dates} tone="info" />
                  </li>
                )}
                {autres.map((a, i) => (
                  <li key={`${a.date}-${i}`} className={styles.typeRow}>
                    <div className={styles.typeHead}>
                      <strong>{a.motif}</strong>
                      <span className={styles.typeCount}>{a.date}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* ---------- Informations personnelles ---------- */}
          <Section titre="Informations personnelles" icone="fa-regular fa-id-card">
            <dl className={styles.infos}>
              {[
                ['Matricule', personnel.matricule],
                ['Rôle', ROLES[personnel.role] ?? personnel.role],
                ['Division', personnel.division],
                ['Service', personnel.service],
                ['Email', personnel.email],
                ['Téléphone', personnel.numtel],
              ].map(([label, valeur]) => (
                <div key={label} className={styles.info}>
                  <dt>{label}</dt>
                  <dd>{valeur || '—'}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
      )}
    </Dialog>
  );
}
