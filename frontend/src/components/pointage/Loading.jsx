import React, { useEffect, useState } from 'react';
import { LinearProgress, Box } from '@mui/material';
import logo from '../../assets/logo1.png'; // ⚡ Remplace par le chemin réel de ton logo
import styles from "./loading.module.css"

const Loading = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);

useEffect(() => {
  const duration = 2000; // 👈 2 secondes
  const interval = 50;   // mise à jour toutes les 50ms
  const increment = 100 / (duration / interval);

  const timer = setInterval(() => {
    setProgress((prev) => {
      const next = Math.min(prev + increment, 100);
      if (next === 100) {
        clearInterval(timer);
        if (onFinish) onFinish();
      }
      return next;
    });
  }, interval);

  return () => clearInterval(timer);
}, [onFinish]);

  return (
    <div
    className={styles.contents}
    >
<div className={styles.card}>

  <div className={styles.images}>
        <img src={logo} alt="" />
    </div>

      {/* Barre de progression */}
      <div className={styles.loading}>
      {/* <span className={styles.loader}></span>*/}
      
      </div>


</div>

     
       </div>
  );
};

export default Loading;
