// components/Logo.js
import React from 'react';

export default function Logo({ size = 64 }) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: 'linear-gradient(90deg, #FF7A33, #FF6B00)',
      background: 'linear-gradient(90deg, #FF7A33, #FF6B00)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(255, 122, 51, 0.2)',
      position: 'relative'
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ width: `${size * 0.5}px`, height: `${size * 0.5}px`, fill: 'white' }}>
        <path d="M12 2C8.686 2 6 4.686 6 8c0 1.333 0.5 2.5 1.333 3.333C8.167 12.167 9.333 12.667 10.667 12.667H13.333C14.667 12.667 15.833 12.167 16.667 11.333C17.5 10.5 18 9.333 18 8c0-3.314-2.686-6-6-6zm0 14c-1.105 0-2-0.895-2-2s0.895-2 2-2 2 0.895 2 2-0.895 2-2 2z" />
      </svg>
    </div>
  );
}