// Carte « Autorisations aujourd'hui » : sorties, retards et absence autorisés pour la journée en cours.
import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { Skeleton } from 'antd';
import styles from './autorisationsDuJour.module.css';

const PERIODES = { matin: 'matin', apres_midi: 'après-midi' };
const DEMI = { matin: 'matin', 'apres-midi': 'après-midi', complete: 'journée complète' };

function buildItems(data) {
  const items = [];
  (data?.speciales ?? []).forEach((a) => {
    const retard = a.type === 'retard';
    items.push({
      key: `s${a.id}`,
      icon: retard ? 'fa-regular fa-clock' : 'fa-solid fa-person-walking-arrow-right',
      titre: `${retard ? 'Retard autorisé' : 'Sortie autorisée'} · ${PERIODES[a.periode] ?? a.periode ?? ''}`,
      detail: a.motif,
    });
  });
  (data?.absences ?? []).forEach((a) => {
    items.push({
      key: `a${a.id}`,
      icon: 'fa-solid fa-file-circle-check',
      titre: `${a.type || 'Absence autorisée'} · ${DEMI[a.demi_journee] ?? 'journée complète'}`,
      detail: a.motif,
    });
  });
  return items;
}

export default function AutorisationsDuJour({ data, loading }) {
  const items = buildItems(data);
  const jour = dayjs(data?.date).locale('fr').format('dddd D MMMM');

  return (
    <section className={styles.card} aria-label="Autorisations d'aujourd'hui" aria-busy={loading}>
      <header className={styles.head}>
        <span className={styles.headIcon}>
          <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
        </span>
        <div>
          <h3 className={styles.title}>Autorisations aujourd'hui</h3>
          <p className={styles.sub}>{data?.date ? jour : '…'}</p>
        </div>
        {!loading && <span className={styles.count}>{items.length}</span>}
      </header>

      {loading && !data ? (
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          <i className="fa-regular fa-circle-check" aria-hidden="true"></i>
          Aucune autorisation pour aujourd'hui
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((it, i) => (
            <li key={it.key} className={styles.item} style={{ animationDelay: `${i * 70}ms` }}>
              <span className={styles.itemIcon}>
                <i className={it.icon} aria-hidden="true"></i>
              </span>
              <div>
                <strong>{it.titre}</strong>
                {it.detail && <p>{it.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
