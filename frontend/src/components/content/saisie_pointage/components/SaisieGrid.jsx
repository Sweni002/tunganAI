import React from "react";
import styles from "../saisie.module.css";

const TAILLES = [25, 50, 100];

/** Numéros de page affichés : première, voisines de la page courante, dernière, avec « … ». */
function pagesVisibles(courante, nbPages) {
  const set = new Set([1, courante - 1, courante, courante + 1, nbPages]);
  const pages = [...set].filter((p) => p >= 1 && p <= nbPages).sort((a, b) => a - b);
  const resultat = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) resultat.push("…" + p);
    resultat.push(p);
  });
  return resultat;
}

function Pager({ total, page, taillePage, onPage, onTaillePage }) {
  const nbPages = Math.max(1, Math.ceil(total / taillePage));
  const debut = total ? (page - 1) * taillePage + 1 : 0;
  const fin = Math.min(page * taillePage, total);

  return (
    <nav className={styles.pager} aria-label="Pagination des agents">
      <div className={styles.pagerLeft}>
        <label className={styles.pagerSize}>
          Agents par page
          <select value={taillePage} onChange={(e) => onTaillePage(Number(e.target.value))}>
            {TAILLES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <span className={styles.pagerCount} aria-live="polite">
          {debut}–{fin} sur {total}
        </span>
      </div>

      {nbPages > 1 && (
        <div className={styles.pagerPages}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Page précédente"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>
          {pagesVisibles(page, nbPages).map((p) =>
            typeof p === "string" ? (
              <span key={p} className={styles.pageDots} aria-hidden="true">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`${styles.pageBtn} ${p === page ? styles.pageOn : ""}`}
                onClick={() => onPage(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => onPage(page + 1)}
            disabled={page >= nbPages}
            aria-label="Page suivante"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      )}
    </nav>
  );
}

/**
 * Grille de saisie (remplace le tableau Ant Design) :
 *  - très aérée, en-tête et colonne « Agent » fixes pendant le défilement ;
 *  - pagination par 25 / 50 / 100 agents : reste fluide avec plus de 50 personnes ;
 *  - squelettes de chargement.
 * `colonnes` : [{ key, title, width, fixed: "left" | "right", render(ligne, index) }]
 */
export default function SaisieGrid({ colonnes, lignes, chargement, classeLigne, page, taillePage, onPage, onTaillePage }) {
  const total = lignes.length;
  const nbPages = Math.max(1, Math.ceil(total / taillePage));
  const courante = Math.min(page, nbPages);
  const visibles = lignes.slice((courante - 1) * taillePage, courante * taillePage);

  const classeCol = (c) => (c.fixed === "left" ? styles.stickyL : c.fixed === "right" ? styles.stickyR : "");

  return (
    <div className={styles.gridBlock}>
      <div className={styles.gridWrap}>
        <table className={styles.grid}>
          <thead>
            <tr>
              {colonnes.map((c) => (
                <th key={c.key} scope="col" className={classeCol(c)} style={{ minWidth: c.width }}>
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chargement && !visibles.length
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={`sk-${i}`} aria-hidden="true">
                    {colonnes.map((c) => (
                      <td key={c.key} className={classeCol(c)}>
                        <span className={styles.skelBar} />
                      </td>
                    ))}
                  </tr>
                ))
              : visibles.map((ligne, index) => (
                  <tr key={ligne.idpers} className={classeLigne?.(ligne) ?? ""}>
                    {colonnes.map((c) => (
                      <td key={c.key} className={classeCol(c)}>
                        {c.render(ligne, index)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>

        {!chargement && !total && (
          <div className={styles.gridEmpty}>
            <i className="fa-regular fa-folder-open" aria-hidden="true"></i>
            Aucun agent à afficher
          </div>
        )}
      </div>

      <Pager total={total} page={courante} taillePage={taillePage} onPage={onPage} onTaillePage={onTaillePage} />
    </div>
  );
}
