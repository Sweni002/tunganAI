// src/pages/Login/components/ErrorToast.jsx

import React, { useState } from "react";
import s from "./errorToast.module.css";

const ErrorToast = ({
  message,
  onClose,
  title = "Connexion impossible",
  duration = 5000,
}) => {
  const [leaving, setLeaving] = useState(false);

  if (!message) return null;

  const close = () => setLeaving(true);

  const handleAnimationEnd = (e) => {
    if (leaving && e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={`${s.toast} ${leaving ? s.leave : ""}`}
      role="alert"
      aria-live="assertive"
      onAnimationEnd={handleAnimationEnd}
    >
      <span className={s.iconTile} aria-hidden="true">
        <i className="fa-solid fa-circle-exclamation" />
      </span>

      <div className={s.content}>
        <span className={s.title}>{title}</span>
        <span className={s.message}>{message}</span>
      </div>

      <button
        type="button"
        className={s.close}
        onClick={close}
        aria-label="Fermer le message d'erreur"
      >
        <i className="fa-solid fa-xmark" aria-hidden="true" />
      </button>

      <span
        className={s.progress}
        style={{ animationDuration: `${duration}ms` }}
        onAnimationEnd={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default ErrorToast;