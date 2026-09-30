import React, { useEffect, useRef, useState } from "react";
import logo from "../../assets/logo1.png";
import styles from "./loading.module.css";

const DURATION = 2000; // durée du chargement (ms)
const EXIT = 450; // durée du fondu de sortie (ms)

// Ralentit en fin de course pour une progression plus naturelle
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const Loading = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const finishRef = useRef(onFinish);

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  // Progression fluide avec requestAnimationFrame
  useEffect(() => {
    const start = performance.now();
    let raf;

    const tick = (now) => {
      const t = Math.min((now - start) / DURATION, 1);
      setProgress(easeOutCubic(t) * 100);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // À 100 % : fondu de sortie, puis onFinish
  useEffect(() => {
    if (progress < 100) return;
    setLeaving(true);
    const t = setTimeout(() => finishRef.current?.(), EXIT);
    return () => clearTimeout(t);
  }, [progress]);

  const pct = Math.round(progress);

  return (
    <div className={`${styles.screen} ${leaving ? styles.leave : ""}`}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <span className={styles.blob} aria-hidden="true" />
          <span className={styles.blob2} aria-hidden="true" />
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>

        <div className={styles.progressBlock}>
          <div
            className={styles.progress}
            role="progressbar"
            aria-label="Chargement"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
           
          </div>

       
        </div>
      </div>
    </div>
  );
};

export default Loading;