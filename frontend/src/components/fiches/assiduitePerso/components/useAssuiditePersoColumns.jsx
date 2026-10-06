import React from "react";
import { Tooltip } from "antd";
import { hmsToMinutes } from "./retardUtils";

// Tons M3 : fond tonal + texte contrasté ; neutre quand la valeur est 0
const TONES = {
  info: { bg: "#e4eef0", fg: "#1b6979" },
  warn: { bg: "#fdf0d2", fg: "#8a5a00" },
  danger: { bg: "#fde4e5", fg: "#a82a31" },
  neutral: { bg: "#f1f3f4", fg: "#8a9396" },
};
const chipStyle = (tone, active) => {
  const t = active ? TONES[tone] : TONES.neutral;
  return {
    backgroundColor: t.bg,
    color: t.fg,
    borderRadius: 999,
    padding: "4px 14px",
    fontWeight: 700,
  };
};


/**
 * Nettoie le suffixe " matin" / " après-midi" d'une date affichée,
 * pour ne garder que la date brute avant envoi à l'API de détail.
 */
function cleanDates(rawDates = []) {
  return rawDates.map((d) => d.replace(/\s+(matin|après-midi)$/, ""));
}

/**
 * Construit les colonnes du tableau principal (fiche d'assiduité personnelle),
 * y compris les colonnes dynamiques par type d'absence.
 * Recalculé à chaque rendu, exactement comme dans l'original.
 */
export function buildAssuiditePersoColumns({ types, fetchRetardDetails, setSelectedRetardDates }) {
  const childrenColumns = types.map((type) => ({
    title: type.nomtype,
    key: `type_${type.idtype}`,
    align: "center",
    render: (record) => {
      const absType = record.absences_par_type?.find(
        (a) => a.idtype === type.idtype,
      ) || { nombre: 0, dates: [] };

      const { nombre, dates = [] } = absType;

      return (
        <Tooltip title={dates.length > 0 ? dates.join(", ") : "Aucune date"}>
          <div
            onClick={() => {
              const cleanedDates = cleanDates(dates);
              fetchRetardDetails(cleanedDates);
              setSelectedRetardDates(cleanedDates);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              ...chipStyle("info", nombre > 0),
              minWidth: 40,
              minHeight: 30,
              textAlign: "center",
              fontWeight: 600,
              cursor: dates.length > 0 ? "pointer" : "default",
            }}
          >
            <span>{nombre}</span>
          </div>
        </Tooltip>
      );
    },
  }));

  const columns = [
    {
      title: "Matricule",
      dataIndex: "matricule",
      align: "center",
    },
    {
      title: "Volume et Nbre de jrs d'absences non valables",
      className: "m3x-col-danger",
      children: [
        {
          title: "Nbre de retard",
          dataIndex: "retards",
          align: "center",
          render: (retard) => (
            <div
              onClick={() => {
                const cleanedDates = cleanDates(retard?.dates || []);
                fetchRetardDetails(cleanedDates);
                setSelectedRetardDates(cleanedDates);
              }}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Tooltip title={retard?.dates?.join(", ") || "Aucune date"}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    ...chipStyle("warn", (retard?.nombre ?? 0) > 0),
                    minWidth: 40,
                    minHeight: 30,
                    textAlign: "center",
                  }}
                >
                  <span>{retard?.nombre ?? 0}</span>
                </div>
              </Tooltip>
            </div>
          ),
        },
        {
          title: "Volume de retard",
          dataIndex: "total_retard_minutes",
          align: "center",
          render: (val) => (
            <div
              style={{
                display: "inline-block",
                minWidth: 40,
                ...chipStyle("warn", hmsToMinutes(val) > 0),
              }}
            >
              {val}
            </div>
          ),
        },
        {
          title: "JA non justifiées",
          align: "center",
          render: (r) => (
            <div
              onClick={() => {
                const cleanedDates = cleanDates(r.absences?.non_justifiees?.dates || []);
                fetchRetardDetails(cleanedDates);
                setSelectedRetardDates(cleanedDates);
              }}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Tooltip
                title={
                  r.absences?.non_justifiees?.dates?.join(", ") || "Aucune date"
                }
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    ...chipStyle("danger", (r.absences?.non_justifiees?.nombre ?? 0) > 0),
                    minWidth: 40,
                    minHeight: 30,
                    textAlign: "center",
                  }}
                >
                  <span>{r.absences?.non_justifiees?.nombre ?? 0}</span>
                </div>
              </Tooltip>
            </div>
          ),
        },
      ],
    },
    {
      title: "Nombre de jrs d'absences justifiées ou valables(jrs)",
      className: "m3x-col-info",
      children: childrenColumns,
    },
  ];

  return { columns, childrenColumns };
}
