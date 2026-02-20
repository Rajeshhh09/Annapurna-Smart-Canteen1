import React from 'react';

const styles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes steamRise {
    0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.9; }
    50% { transform: translateY(-4px) scaleX(0.8); opacity: 0.5; }
  }
  .logo-wrap { position: relative; width: 88px; height: 88px; }
  .logo-ring {
    position: absolute; inset: -6px; border-radius: 50%;
    border: 2px dashed rgba(255,122,51,0.3);
    animation: spin 20s linear infinite;
  }
  .logo-circle {
    width: 88px; height: 88px;
    background: linear-gradient(145deg, #FF7A33, #FF5500);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 32px rgba(255,107,0,0.35), 0 2px 8px rgba(255,107,0,0.2);
    position: relative; z-index: 1;
  }
  .steam-1 { animation: steamRise 1.8s ease-in-out infinite; }
  .steam-2 { animation: steamRise 1.8s ease-in-out 0.35s infinite; }
  .steam-3 { animation: steamRise 1.8s ease-in-out 0.7s infinite; }
`;

export default function AnnapurnaLogo({ size = 88 }) {
  return (
    <>
      <style>{styles}</style>
      <div className="logo-wrap" style={{ width: size, height: size }}>
        <div className="logo-ring" />
        <div className="logo-circle" style={{ width: size, height: size }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none"
               xmlns="http://www.w3.org/2000/svg">

            {/* Steam wisps */}
            <path className="steam-1"
              d="M18 14 Q17 11 18 8"
              stroke="rgba(255,255,255,0.85)" strokeWidth="2"
              strokeLinecap="round" fill="none"/>
            <path className="steam-2"
              d="M26 13 Q25 10 26 7"
              stroke="rgba(255,255,255,0.85)" strokeWidth="2"
              strokeLinecap="round" fill="none"/>
            <path className="steam-3"
              d="M34 14 Q33 11 34 8"
              stroke="rgba(255,255,255,0.85)" strokeWidth="2"
              strokeLinecap="round" fill="none"/>

            {/* Bowl shadow ellipse */}
            <ellipse cx="26" cy="33" rx="16" ry="4.5"
              fill="rgba(255,255,255,0.25)"/>

            {/* Bowl body */}
            <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z"
              fill="white"/>

            {/* Inner bowl tint */}
            <path d="M15 29 Q15 39 26 39 Q37 39 37 29 Z"
              fill="rgba(255,122,51,0.12)"/>

            {/* Rim outer */}
            <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>

            {/* Rim inner tint */}
            <ellipse cx="26" cy="29" rx="14" ry="2.5"
              fill="rgba(255,107,0,0.18)"/>

            {/* Garnish dots */}
            <circle cx="26" cy="34" r="2.5"
              fill="rgba(255,107,0,0.35)"/>
            <circle cx="20" cy="32.5" r="1.5"
              fill="rgba(255,107,0,0.25)"/>
            <circle cx="32" cy="32.5" r="1.5"
              fill="rgba(255,107,0,0.25)"/>

            {/* Base plate */}
            <ellipse cx="26" cy="42.5" rx="18" ry="2.5"
              fill="rgba(255,255,255,0.4)"/>
          </svg>
        </div>
      </div>
    </>
  );
}