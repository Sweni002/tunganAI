// components/AvatarUploader.jsx
import React from 'react';
import Avatar from '@mui/material/Avatar';
import styles from '../ajout_perso.module.css';

export default function AvatarUploader({ preview, isMobile, onClick }) {
  return (
    <div className={styles.sary}>
      <div
        onClick={onClick}
        style={{
          padding: '6px',
          borderRadius: '50%',
          background: 'linear-gradient(90deg,#00c4cc,#8b69b8)',
          display: 'inline-block',
          animation: 'rotateBorder 6s linear infinite',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <Avatar
          src={preview || ''}
          sx={{
            width: isMobile ? 150 : 250,
            height: isMobile ? 150 : 250,
            borderRadius: '50%',
            backgroundColor: '#fff',
            transition: 'all 0.4s ease',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            '&:hover': {
              transform: 'scale(1.03)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.25)',
            },
          }}
        />
      </div>
    </div>
  );
}
