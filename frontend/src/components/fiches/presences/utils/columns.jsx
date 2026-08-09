// utils/columns.jsx
import React from 'react';
import { Tooltip } from 'antd';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import styles from '../presences.module.css';

/**
 * Colonnes "Agents de bureau" (matin / après-midi détaillés).
 * @param {(event: any, record: any) => void} handleMenuClick
 */
export function buildColumns(handleMenuClick) {
  return [
    { title: 'Matricule', dataIndex: 'matricule', key: 'matricule' },
    {
      title: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          Nom
        </div>
      ),
      key: 'nom_prenom',
      render: (record) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center' }}>
          <strong>{record.nom}</strong>
          <small style={{ color: '#555', fontWeight: 'bold' }}>{record.division || '—'}</small>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      align: 'center',
      render: (val) => (val ? new Date(val).toLocaleDateString('fr-FR') : '—'),
    },
    {
      title: <span style={{ fontWeight: 'bold' }}>Matin</span>,
      children: [
        {
          title: 'Entrée',
          dataIndex: ['matin', 'entree'],
          key: 'matin_entree',
          align: 'center',
          className: styles.borderedLeft,
          render: (val) => val ?? '---',
        },
        {
          title: 'Sortie',
          dataIndex: ['matin', 'sortie'],
          key: 'matin_sortie',
          align: 'center',
          render: (val) => val ?? '---',
        },
        {
          title: <span style={{ color: '#FFA500', fontWeight: 'bold' }}>Retard</span>,
          dataIndex: ['matin', 'retard'],
          key: 'matin_retard',
          align: 'center',
          render: (val, record) => {
            const minutes = record.retard_matin_minutes;
            return (
              <Tooltip title={val && minutes > 0 ? `${minutes} minute(s) de retard` : ''}>
                {val ? <CheckCircleIcon style={{ color: '#FFA500', fontSize: '1.1rem' }} /> : '---'}
              </Tooltip>
            );
          },
        },
        {
          title: <span style={{ color: 'red', fontWeight: 'bold' }}>Absence</span>,
          key: 'matin_absence',
          align: 'center',
          render: (text, record) => {
            const val = record.matin.absence;
            if (val === null || val === undefined) return '---';
            return val ? (
              <Tooltip title="Absent">
                <CheckCircleIcon style={{ color: 'red', fontSize: '1.1rem' }} />
              </Tooltip>
            ) : (
              '---'
            );
          },
        },
        {
          title: <span style={{ color: 'green', fontWeight: 'bold' }}>Présence</span>,
          key: 'matin_presence',
          align: 'center',
          render: (record) => {
            const absenceMatin = record.matin?.absence;
            if (absenceMatin === null || absenceMatin === undefined) return '---';
            return absenceMatin ? (
              '---'
            ) : (
              <Tooltip title="Présent">
                <CheckCircleIcon style={{ color: 'green', fontSize: '1.1rem' }} />
              </Tooltip>
            );
          },
        },
      ],
    },
    {
      title: <span style={{ fontWeight: 'bold' }}>Après-midi</span>,
      children: [
        {
          title: 'Entrée',
          dataIndex: ['apresmidi', 'entree'],
          key: 'apresmidi_entree',
          align: 'center',
          className: styles.borderedLeft,
          render: (val) => val ?? '---',
        },
        {
          title: 'Sortie',
          dataIndex: ['apresmidi', 'sortie'],
          key: 'apresmidi_sortie',
          align: 'center',
          render: (val) => val ?? '---',
        },
        {
          title: <span style={{ color: '#FFA500', fontWeight: 'bold' }}>Retard</span>,
          dataIndex: ['apresmidi', 'retard'],
          key: 'apresmidi_retard',
          align: 'center',
          render: (val, record) => {
            const minutes = record.retard_soir_minutes;
            return (
              <Tooltip title={val && minutes > 0 ? `${minutes} minute(s) de retard` : ''}>
                {val > 0 ? <CheckCircleIcon style={{ color: '#FFA500', fontSize: '1.1rem' }} /> : '---'}
              </Tooltip>
            );
          },
        },
        {
          title: <span style={{ color: 'red', fontWeight: 'bold' }}>Absence</span>,
          key: 'apresmidi_absence',
          align: 'center',
          render: (_, record) => {
            const val = record.absence_soir;
            if (val === null || val === undefined) return '---';
            return val ? (
              <Tooltip title="Absent">
                <CheckCircleIcon style={{ color: 'red', fontSize: '1.1rem' }} />
              </Tooltip>
            ) : (
              '---'
            );
          },
        },
        {
          title: <span style={{ color: 'green', fontWeight: 'bold' }}>Présence</span>,
          key: 'apresmidi_presence',
          align: 'center',
          render: (record) => {
            const absenceSoir = record.apresmidi?.absence;
            if (absenceSoir === null || absenceSoir === undefined) return '---';
            return absenceSoir ? (
              '---'
            ) : (
              <Tooltip title="Présent">
                <CheckCircleIcon style={{ color: 'green', fontSize: '1.1rem' }} />
              </Tooltip>
            );
          },
        },
      ],
    },
    {
      title: <div style={{ textAlign: 'center', fontWeight: 'bold' }}>Statut</div>,
      align: 'center',
      children: [
        {
          title: 'Matin',
          key: 'statut_matin',
          className: styles.borderedLeft,
          align: 'center',
          render: (record) => {
            const { absence, absence_matin_abbr: abbr } = { absence: record.matin?.absence, absence_matin_abbr: record.absence_matin_abbr };
            const entree = record.matin?.entree;
            const sortie = record.matin?.sortie;

            if (abbr) {
              return (
                <Tooltip title={record.nomabbr}>
                  <span style={{ fontStyle: 'italic', fontWeight: '500', color: '#1890ff' }}>{abbr}</span>
                </Tooltip>
              );
            }
            if (absence && !entree) {
              return (
                <Tooltip title="Absence non justifiée">
                  <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1rem' }}>&#10006;</span>
                </Tooltip>
              );
            }
            if (absence && !sortie) {
              return (
                <Tooltip title="Sortie non enregistrée">
                  <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1rem' }}>&#10006;</span>
                </Tooltip>
              );
            }
            return <span>---</span>;
          },
        },
        {
          title: 'A-M',
          key: 'statut_soir',
          align: 'center',
          render: (record) => {
            const absence = record.apresmidi?.absence;
            const abbr = record.absence_soir_abbr;
            const entree = record.apresmidi?.entree;
            const sortie = record.apresmidi?.sortie;

            if (abbr) {
              return (
                <Tooltip title={record.nomabbr}>
                  <span style={{ fontStyle: 'italic', fontWeight: '500', color: '#1890ff' }}>{abbr}</span>
                </Tooltip>
              );
            }
            if (absence && !entree) {
              return (
                <Tooltip title="Absence non justifiée">
                  <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1rem' }}>&#10006;</span>
                </Tooltip>
              );
            }
            if (absence && !sortie) {
              return (
                <Tooltip title="Sortie non enregistrée">
                  <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1rem' }}>&#10006;</span>
                </Tooltip>
              );
            }
            return <span>---</span>;
          },
        },
      ],
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div onClick={(e) => handleMenuClick(e, record)}>
            <IconButton aria-label="more" size="small">
              <MoreVertIcon style={{ fontSize: '1.2rem' }} />
            </IconButton>
          </div>
        </div>
      ),
    },
  ];
}

/**
 * Colonnes "Agents de surface" (pointage unique entrée/sortie).
 */
export function buildColumnsSurface(handleMenuClick) {
  return [
    { title: 'Matricule', dataIndex: 'matricule', key: 'matricule' },
    {
      title: <span style={{ fontWeight: 'bold', textAlign: 'center' }}>Nom</span>,
      key: 'nom_prenom',
      align: 'center',
      render: (record) => (
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
          <strong>{record.nom}</strong>
          <small style={{ color: '#555', fontWeight: 'bold' }}>{record.division || '—'}</small>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      align: 'center',
      render: (val) => (val ? new Date(val).toLocaleDateString('fr-FR') : '—'),
    },
    {
      title: "Heure d'entrée",
      dataIndex: 'heure_entree_unique',
      key: 'heure_entree_unique',
      className: styles.borderedLeft,
      align: 'center',
      render: (val) => val ?? '---',
    },
    {
      title: 'Sortie',
      dataIndex: 'heure_sortie_unique',
      key: 'heure_sortie_unique',
      align: 'center',
      render: (val) => val ?? '---',
    },
    {
      title: <span style={{ color: 'red', fontWeight: 'bold' }}>Absent</span>,
      key: 'absent',
      align: 'center',
      render: (_, record) =>
        record.absence_unique ? (
          <Tooltip title="Absent">
            <CheckCircleIcon style={{ color: 'red', fontSize: '1.1rem' }} />
          </Tooltip>
        ) : (
          '---'
        ),
    },
    {
      title: <span style={{ color: 'green', fontWeight: 'bold' }}>Présent</span>,
      key: 'present',
      align: 'center',
      render: (_, record) => {
        const isPresent = !record.absence_unique && record.heure_entree_unique;
        return isPresent ? (
          <Tooltip title="Présent">
            <CheckCircleIcon style={{ color: 'green', fontSize: '1.1rem' }} />
          </Tooltip>
        ) : (
          '---'
        );
      },
    },
    {
      title: 'Statut',
      key: 'absence_surface',
      className: styles.borderedLeft,
      align: 'center',
      render: (record) => {
        const { absence_unique, absence_surface, heure_entree_unique, heure_sortie_unique } = record;

        if (absence_surface) {
          return (
            <Tooltip title={record.nomabbr}>
              <span style={{ fontStyle: 'italic', fontWeight: '500', color: '#1890ff' }}>{absence_surface}</span>
            </Tooltip>
          );
        }
        if (absence_unique && !absence_surface && !heure_entree_unique) {
          return (
            <Tooltip title="Absence non justifiée">
              <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1rem' }}>&#10006;</span>
            </Tooltip>
          );
        }
        if (absence_unique && !heure_sortie_unique) {
          return (
            <Tooltip title="Sortie non enregistrée">
              <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1rem' }}>&#10006;</span>
            </Tooltip>
          );
        }
        return <span>---</span>;
      },
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div onClick={(e) => handleMenuClick(e, record)}>
            <IconButton aria-label="more" size="small">
              <MoreVertIcon style={{ fontSize: '1.2rem' }} />
            </IconButton>
          </div>
        </div>
      ),
    },
  ];
}