import React from "react";
import { Tooltip } from "antd";

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
              backgroundColor: nombre > 0 ? "#e6f7ff" : "#f5f5f5",
              padding: "4px",
              borderRadius: "4px",
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
                    backgroundColor: "#fff9db",
                    padding: "4px",
                    borderRadius: "4px",
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
                backgroundColor: "#fff9db",
                padding: "4px",
                borderRadius: "4px",
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
                    backgroundColor: "#ffe6e6",
                    padding: "4px",
                    borderRadius: "4px",
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
      children: childrenColumns,
    },
  ];

  return { columns, childrenColumns };
}
