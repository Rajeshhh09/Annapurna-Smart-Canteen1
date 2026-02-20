import React from 'react';
import styles from './UploadBox.module.css';

export default function UploadBox({ imageUrl, onUpload, onRemove }) {
  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleChange = (e) => {
    if (e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div
      className={styles.uploadBox}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {imageUrl ? (
        <div className={styles.preview}>
          <img src={imageUrl} alt="Preview" />
          <button className={styles.removeBtn} onClick={onRemove}>
            ×
          </button>
        </div>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} viewBox="0 0 24 24">
            <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            style={{ display: 'none' }}
            id="upload-input"
          />
          <label htmlFor="upload-input" style={{ cursor: 'pointer', color: '#e65100', fontWeight: '600' }}>
            Click to upload or drag & drop
          </label>
        </>
      )}
    </div>
  );
}