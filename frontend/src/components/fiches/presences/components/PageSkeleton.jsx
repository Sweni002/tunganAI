// components/PageSkeleton.jsx — squelette de la page Présences au premier chargement
import React from 'react';
import { Skeleton } from 'antd';
import { Box } from '@mui/material';
import styles from '../presences.module.css';

const card = {
  background: '#fff',
  borderRadius: '28px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06)',
};

export default function PageSkeleton() {
  return (
    <div className={styles.personnels} style={{ maxWidth: '88%', margin: '0 auto' }} aria-busy="true" aria-label="Chargement">
      {/* En-tête */}
      <Box sx={{ width: '100%', maxWidth: 1700 }}>
        <Skeleton.Input active size="large" style={{ width: 220 }} />
        <div style={{ marginTop: 10 }}>
          <Skeleton.Input active size="small" style={{ width: 360, height: 14 }} />
        </div>
      </Box>

      {/* Cartes de statistiques */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%', maxWidth: 1700 }}>
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} sx={{ ...card, flex: '1 1 200px', minWidth: 200, p: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Skeleton.Avatar active shape="square" size={48} />
            <div>
              <Skeleton.Input active size="small" style={{ width: 90, height: 12 }} />
              <div style={{ marginTop: 8 }}>
                <Skeleton.Input active size="small" style={{ width: 60 }} />
              </div>
            </div>
          </Box>
        ))}
      </Box>

      {/* Carte filtres */}
      <Box sx={{ ...card, width: '100%', maxWidth: 1700, p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Skeleton.Input active size="small" style={{ width: 120 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton.Button key={i} active shape="round" style={{ width: 150 }} />
          ))}
        </Box>
      </Box>

      {/* Carte tableau */}
      <Box sx={{ ...card, width: '100%', maxWidth: 1700, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton.Button active shape="round" style={{ width: 280 }} />
          <Skeleton.Input active style={{ width: 260, borderRadius: 34 }} />
        </Box>
        <Skeleton active title={false} paragraph={{ rows: 6, width: '100%' }} />
      </Box>
    </div>
  );
}
