// components/PageBreadcrumb.jsx
import React from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import styles from '../ajout_perso.module.css';

export default function PageBreadcrumb({ isMobile }) {
  return (
    <div className={styles.break}>
      {!isMobile && (
        <div className={styles.break}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" sx={{ fontSize: '0.9rem' }}>
              Personnels
            </Link>
            <Typography sx={{ color: 'text.primary', fontSize: '0.9rem' }}>Information</Typography>
          </Breadcrumbs>
        </div>
      )}
    </div>
  );
}
