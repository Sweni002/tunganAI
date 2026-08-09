// src/components/SplashScreen.jsx
import React from 'react';
import { Spin } from 'antd';
import BeatLoader from "react-spinners/BeatLoader";
import styles from './charge.module.css'
export default function SplashScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
        zIndex: 9999,
        flexDirection: "column",
      }}
    >
      <span className={styles.loader}></span>
    </div>
  );
}
