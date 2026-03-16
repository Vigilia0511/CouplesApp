// components/IncomingCallModal.tsx
"use client";
import React from "react";
import styles from "./IncomingCallModal.module.css";
export default function IncomingCallModal({ callId, initiatorName, onAccept, onReject, }) {
    return (<div className={styles.modal}>
      <div className={styles.card}>
        <div className={styles.callerInfo}>
          <div className={styles.avatar}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="60" height="60">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div className={styles.callerName}>{initiatorName}</div>
          <div className={styles.callingText}>is calling...</div>
        </div>

        <div className={styles.controls}>
          <button className={styles.btnAccept} onClick={onAccept}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            Accept
          </button>

          <button className={styles.btnReject} onClick={onReject}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
            </svg>
            Reject
          </button>
        </div>
      </div>
    </div>);
}
