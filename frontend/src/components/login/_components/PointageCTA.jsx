// src/pages/Login/components/PointageCTA.jsx

import React, { useEffect, useState } from "react";
import s from "./pointageCta.module.css";

const pad = (n) => String(n).padStart(2, "0");

const PointageCTA = ({ onClick, disabled = false }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const ss = pad(now.getSeconds());

  return (
    <button
      type="button"
      className={s.cta}
      onClick={onClick}
      disabled={disabled}
      aria-label="Faire pointage par reconnaissance faciale"
    >
      <span className={s.iconTile} aria-hidden="true">
        <i className={`fa-solid fa-expand ${s.frame}`} />
        <i className={`fa-solid fa-user ${s.face}`} />
        <span className={s.scan} />
      </span>

      <span className={s.text}>
        <span className={s.title}>Faire pointage</span>
        <span className={s.subtitle}>Reconnaissance faciale</span>
      </span>

      <span className={s.clock} aria-hidden="true">
        {hhmm}
        <span className={s.colon}>:</span>
        <span key={ss} className={s.sec}>
          {ss}
        </span>
      </span>

      <span className={s.divider} aria-hidden="true" />

      <span className={s.arrow} aria-hidden="true">
        <i className="fa-solid fa-arrow-right" />
      </span>
    </button>
  );
};

export default PointageCTA;