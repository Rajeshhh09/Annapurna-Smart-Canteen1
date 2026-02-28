import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = 'https://annapurna-smart-canteen1.onrender.com';

const getLS  = (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } };
const toStr  = (v)      => (v && Number(v) > 0) ? String(v) : '';

const STATUS_ORDER = ['Pending', 'Preparing', 'Ready', 'Delivered'];

const IMG_API = 'https://api.imgbb.com/1/upload?key=f551092ea99ba4836b1e1df45314cd1f';
async function uploadImage(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Please upload an image file.');
  if (file.size > 5 * 1024 * 1024) throw new Error('File must be under 5 MB.');
  const fd = new FormData(); fd.append('image', file);
  const r  = await fetch(IMG_API, { method: 'POST', body: fd });
  const d  = await r.json();
  if (!d.success) throw new Error(d.error?.message || 'Upload failed.');
  return d.data.url;
}

// ─────────────────────────────────────────────────────────────────────────────
const makeStyles = (dark) => `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: ${dark ? '#0f0f0f' : '#faf9f6'}; color: ${dark ? '#e5e7eb' : '#1f2937'}; transition: background .3s, color .3s; }

  .adm-hdr { position: sticky; top: 0; z-index: 100; background: ${dark ? 'rgba(15,15,15,0.96)' : 'rgba(255,255,255,0.95)'}; backdrop-filter: blur(16px); border-bottom: 1px solid ${dark ? 'rgba(255,122,51,0.12)' : 'rgba(255,122,51,0.1)'}; box-shadow: ${dark ? '0 2px 24px rgba(0,0,0,0.5)' : '0 2px 20px rgba(0,0,0,0.06)'}; }
  .adm-hdr-in { max-width: 1400px; margin: 0 auto; padding: 0.9rem 2rem; display: flex; align-items: center; justify-content: space-between; }
  .logo-wrap { display: flex; align-items: center; gap: 0.75rem; }
  .logo-icon { width: 42px; height: 42px; background: linear-gradient(145deg, #FF7A33, #FF5500); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(255,107,0,0.35); flex-shrink: 0; }
  .logo-brand { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; line-height: 1.1; }
  .logo-sub { font-size: 0.62rem; color: #FF7A33; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; }
  .admin-badge { background: linear-gradient(135deg, #FF7A33, #FF5500); color: white; font-size: 0.65rem; font-weight: 800; padding: 0.2rem 0.65rem; border-radius: 999px; letter-spacing: 1px; text-transform: uppercase; margin-left: 0.6rem; }
  .back-btn { display: flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1.1rem; background: ${dark ? 'rgba(255,122,51,0.1)' : '#f5f5f0'}; border: 1.5px solid ${dark ? 'rgba(255,122,51,0.25)' : '#e5e7eb'}; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600; color: ${dark ? '#FFAA77' : '#374151'}; cursor: pointer; transition: all 0.2s; }
  .back-btn:hover { border-color: rgba(255,122,51,0.45); color: #FF7A33; }

  .stats-bar { background: linear-gradient(135deg, #1a0f05 0%, #2d1f0e 50%, #3d2a14 100%); padding: 1.75rem 2rem; position: relative; overflow: hidden; }
  .stats-bar::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 15% 50%, rgba(255,122,51,0.18), transparent 55%); }
  .stats-in { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; position: relative; z-index: 1; }
  .stat-card { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1rem 1.25rem; transition: background .2s; }
  .stat-lbl { font-size: 0.68rem; color: rgba(255,255,255,0.5); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 0.45rem; }
  .stat-val { font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 800; color: white; line-height: 1; }
  .stat-sub { font-size: 0.7rem; color: #FFAA77; font-weight: 600; margin-top: 0.3rem; }

  .tabs-bg { background: ${dark ? '#141414' : '#faf9f6'}; border-bottom: 2px solid ${dark ? 'rgba(255,255,255,0.06)' : '#ede8e0'}; }
  .tabs-wrap { max-width: 1400px; margin: 0 auto; padding: 1.25rem 2rem 0; display: flex; gap: 0.35rem; }
  .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: none; border: none; border-radius: 12px 12px 0 0; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 700; color: ${dark ? '#6b7280' : '#9ca3af'}; cursor: pointer; transition: all 0.2s; position: relative; bottom: -2px; border: 2px solid transparent; border-bottom: none; }
  .tab-btn:hover { color: #FF7A33; background: ${dark ? 'rgba(255,122,51,0.08)' : 'rgba(255,122,51,0.05)'}; }
  .tab-btn.active { color: #FF7A33; background: ${dark ? '#141414' : '#faf9f6'}; border-color: ${dark ? 'rgba(255,255,255,0.06)' : '#ede8e0'}; border-bottom-color: ${dark ? '#141414' : '#faf9f6'}; }
  .tab-bdg { font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.5rem; border-radius: 999px; min-width: 20px; text-align: center; }
  .bdg-amber { background: #f59e0b; color: white; }
  .bdg-gray  { background: ${dark ? '#374151' : '#9ca3af'}; color: white; }

  .adm-main { max-width: 1400px; margin: 0 auto; padding: 2rem; }
  .menu-layout { display: grid; grid-template-columns: 390px 1fr; gap: 1.5rem; align-items: start; }

  .panel { background: ${dark ? '#1a1a1a' : 'white'}; border-radius: 18px; box-shadow: ${dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.06)'}; border: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,122,51,0.08)'}; overflow: hidden; }
  .panel-hdr { padding: 1.1rem 1.5rem; border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}; display: flex; align-items: center; gap: 0.5rem; background: ${dark ? 'rgba(255,122,51,0.04)' : '#fdfcfb'}; }
  .panel-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; }
  .panel-body { padding: 1.5rem; max-height: calc(100vh - 280px); overflow-y: auto; }
  .panel-body::-webkit-scrollbar { width: 4px; }
  .panel-body::-webkit-scrollbar-thumb { background: ${dark ? '#374151' : '#e5e7eb'}; border-radius: 4px; }

  .upload-zone { border: 2px dashed rgba(255,122,51,0.4); border-radius: 14px; padding: 1.5rem; text-align: center; cursor: pointer; transition: all .2s; background: ${dark ? 'rgba(255,122,51,0.04)' : '#fdf9f5'}; position: relative; min-height: 100px; display: flex; align-items: center; justify-content: center; }
  .upload-zone:hover, .upload-zone.drag { background: ${dark ? 'rgba(255,122,51,0.1)' : '#fff3ec'}; border-color: #FF7A33; }
  .upload-zone.has-img { padding: 0; overflow: hidden; height: 120px; }
  .upload-preview { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
  .upload-clear { position: absolute; top: 7px; right: 7px; background: #FF5500; color: white; border: none; border-radius: 50%; width: 26px; height: 26px; font-size: 1rem; cursor: pointer; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .upload-lbl { font-size: 0.82rem; color: #FF7A33; font-weight: 700; }
  .upload-hint { font-size: 0.72rem; color: ${dark ? '#6b7280' : '#b0b8c1'}; margin-top: 0.3rem; }

  .fstack { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
  .frow   { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .adm-inp, .adm-sel { width: 100%; padding: 0.8rem 1rem; border: 1.5px solid ${dark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; color: ${dark ? '#e5e7eb' : '#1f2937'}; background: ${dark ? '#252525' : '#fafafa'}; outline: none; transition: border-color .2s, box-shadow .2s; }
  .adm-inp:focus, .adm-sel:focus { border-color: #FF7A33; background: ${dark ? '#2a2a2a' : '#fff'}; box-shadow: 0 0 0 3px rgba(255,122,51,0.15); }
  .adm-inp::placeholder { color: ${dark ? '#4b5563' : '#c4c4c4'}; }
  .adm-sel option { background: ${dark ? '#1a1a1a' : '#fff'}; }
  .inp-hint { font-size: 0.7rem; color: ${dark ? '#6b7280' : '#9ca3af'}; margin-top: 0.25rem; }

  /* ── DNA section ── */
  .dna-section { margin-top: 1.25rem; border-radius: 14px; overflow: hidden; border: 2px solid rgba(255,122,51,0.3); }
  .dna-hdr { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.1rem; background: ${dark ? 'rgba(255,122,51,0.1)' : 'rgba(255,122,51,0.06)'}; }
  .dna-hdr-title { font-family: 'Playfair Display', serif; font-weight: 800; font-size: 0.95rem; color: ${dark ? '#f9fafb' : '#2d1f0e'}; flex: 1; }
  .dna-badge { font-size: 0.58rem; font-weight: 800; color: #FF7A33; background: rgba(255,122,51,0.15); border: 1px solid rgba(255,122,51,0.35); border-radius: 999px; padding: 0.1rem 0.5rem; letter-spacing: 1px; }
  .dna-body { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.65rem; background: ${dark ? 'rgba(255,122,51,0.03)' : '#fffaf7'}; }
  .dna-inp { background: ${dark ? '#1e1914' : '#fffaf5'} !important; border-color: rgba(255,122,51,0.25) !important; }
  .dna-inp:focus { border-color: #FF7A33 !important; box-shadow: 0 0 0 3px rgba(255,122,51,0.18) !important; }

  .btn-primary { width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #FF7A33, #FF5500); color: white; border: none; border-radius: 11px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 700; cursor: pointer; margin-top: 1rem; box-shadow: 0 4px 16px rgba(255,107,0,0.35); transition: transform .15s, box-shadow .15s; display: flex; align-items: center; justify-content: center; gap: 0.45rem; }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,0,0.45); }
  .btn-primary:disabled { background: ${dark ? '#374151' : '#d1d5db'}; box-shadow: none; transform: none; cursor: not-allowed; }
  .btn-sec { flex: 1; padding: 0.75rem; background: ${dark ? '#252525' : '#f5f5f0'}; border: 1.5px solid ${dark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 600; color: ${dark ? '#9ca3af' : '#6b7280'}; cursor: pointer; transition: all .2s; }
  .btn-sec:hover { border-color: rgba(255,122,51,0.3); color: ${dark ? '#e5e7eb' : '#374151'}; }

  .list-panel { background: ${dark ? '#1a1a1a' : 'white'}; border-radius: 18px; box-shadow: ${dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.06)'}; border: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,122,51,0.08)'}; overflow: hidden; }
  .list-hdr { padding: 1rem 1.5rem; border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}; display: flex; align-items: center; justify-content: space-between; background: ${dark ? 'rgba(255,122,51,0.04)' : '#fdfcfb'}; }
  .list-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; }
  .list-count { font-size: 0.75rem; font-weight: 700; color: ${dark ? '#6b7280' : '#9ca3af'}; background: ${dark ? '#252525' : '#f5f5f0'}; padding: 0.2rem 0.6rem; border-radius: 999px; }
  .menu-scroll { max-height: 720px; overflow-y: auto; }
  .menu-scroll::-webkit-scrollbar { width: 4px; }
  .menu-scroll::-webkit-scrollbar-thumb { background: ${dark ? '#374151' : '#e5e7eb'}; border-radius: 4px; }

  .item-row { display: flex; align-items: center; gap: 0.9rem; padding: 0.9rem 1.5rem; border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.04)' : '#f9f9f7'}; transition: background .15s; }
  .item-row:last-child { border-bottom: none; }
  .item-row:hover { background: ${dark ? 'rgba(255,122,51,0.05)' : '#fdf9f5'}; }
  .item-thumb { width: 56px; height: 56px; object-fit: cover; border-radius: 12px; flex-shrink: 0; }
  .item-info { flex: 1; min-width: 0; }
  .item-name { font-size: 0.88rem; font-weight: 700; color: ${dark ? '#f9fafb' : '#1f2937'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item-meta { font-size: 0.72rem; color: ${dark ? '#6b7280' : '#9ca3af'}; margin-top: 3px; display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; }
  .dna-tag { color: #FF7A33; font-weight: 700; background: ${dark ? 'rgba(255,122,51,0.12)' : '#fff3ec'}; border: 1px solid rgba(255,122,51,0.25); border-radius: 5px; padding: 0.06rem 0.3rem; }
  .item-price { font-size: 0.9rem; font-weight: 800; color: #FF7A33; white-space: nowrap; }
  .item-acts { display: flex; gap: 0.35rem; align-items: center; flex-shrink: 0; }
  .icon-btn { width: 32px; height: 32px; border-radius: 9px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .15s; }
  .icon-btn:hover { transform: scale(1.1); }
  .btn-edit { background: ${dark ? 'rgba(59,130,246,0.15)' : '#eff6ff'}; color: #3b82f6; }
  .btn-del  { background: ${dark ? 'rgba(239,68,68,0.15)' : '#fff1f0'}; color: #ef4444; }
  .oos-toggle { padding: 0.3rem 0.65rem; border-radius: 8px; border: 1.5px solid transparent; font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: all .2s; white-space: nowrap; }
  .oos-toggle.in-stock  { background: ${dark ? 'rgba(22,163,74,0.15)' : '#dcfce7'}; color: #16a34a; border-color: rgba(22,163,74,0.25); }
  .oos-toggle.out-stock { background: ${dark ? 'rgba(220,38,38,0.15)' : '#fee2e2'}; color: #dc2626; border-color: rgba(220,38,38,0.25); }

  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(6px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn .2s ease; }
  .modal-box { background: ${dark ? '#1a1a1a' : 'white'}; border-radius: 22px; box-shadow: ${dark ? '0 24px 80px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.2)'}; border: 1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'transparent'}; width: 480px; max-width: 95vw; max-height: 92vh; overflow-y: auto; animation: scaleIn .25s ease; }
  .modal-box::-webkit-scrollbar { width: 4px; }
  .modal-box::-webkit-scrollbar-thumb { background: ${dark ? '#374151' : '#e5e7eb'}; border-radius: 4px; }
  .modal-inner { padding: 2rem; }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; margin-bottom: 1.25rem; }
  .modal-acts { display: flex; gap: 0.75rem; margin-top: 1.25rem; }

  .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
  .section-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#ede8e0'}; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 1.35rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; }
  .section-sub { font-size: 0.82rem; color: ${dark ? '#6b7280' : '#9ca3af'}; margin-top: 2px; }
  .refresh-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.1rem; background: ${dark ? '#252525' : 'white'}; border: 1.5px solid ${dark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 700; color: ${dark ? '#9ca3af' : '#374151'}; cursor: pointer; transition: all .2s; }
  .refresh-btn:hover { border-color: rgba(255,122,51,0.4); color: #FF7A33; }
  .group-hdr { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem; padding-bottom: 0.6rem; border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#ede8e0'}; }
  .ocard { background: ${dark ? '#1a1a1a' : 'white'}; border-radius: 18px; box-shadow: ${dark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)'}; border: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}; overflow: hidden; animation: fadeIn .3s ease both; }
  .ocard-strip { height: 3px; }
  .ocard-top { padding: 1rem 1.25rem 0.8rem; border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#f5f5f0'}; display: flex; justify-content: space-between; align-items: flex-start; }
  .ocard-id { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; }
  .ocard-body { padding: 0.9rem 1.25rem; }
  .odet-row { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.45rem; }
  .odet-txt { font-size: 0.8rem; color: ${dark ? '#9ca3af' : '#6b7280'}; line-height: 1.4; }
  .odet-txt strong { color: ${dark ? '#d1d5db' : '#374151'}; font-weight: 600; }
  .oitems { background: ${dark ? 'rgba(255,255,255,0.03)' : '#faf9f6'}; border-radius: 10px; padding: 0.65rem 0.8rem; margin: 0.65rem 0; border: 1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'}; }
  .oitem-line { font-size: 0.78rem; color: ${dark ? '#9ca3af' : '#6b7280'}; padding: 0.22rem 0; display: flex; justify-content: space-between; }
  .oitem-line:not(:last-child) { border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'}; }
  .ototal { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 800; color: #FF7A33; margin-top: 0.6rem; }
  .status-pill { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; padding: 0.3rem 0.75rem; border-radius: 999px; }
  .s-Pending   { background: ${dark ? 'rgba(245,158,11,0.15)' : '#fef3c7'}; color: #d97706; }
  .s-Preparing { background: ${dark ? 'rgba(59,130,246,0.15)' : '#dbeafe'}; color: #2563eb; }
  .s-Ready     { background: ${dark ? 'rgba(255,122,51,0.15)' : '#fff3ec'}; color: #FF7A33; }
  .s-Delivered { background: ${dark ? 'rgba(107,114,128,0.15)' : '#f3f4f6'}; color: ${dark ? '#9ca3af' : '#6b7280'}; }
  .status-btns { display: flex; gap: 0.4rem; flex-wrap: wrap; padding: 0.85rem 1.25rem; border-top: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#f5f5f0'}; }
  .sbtn { flex: 1; min-width: 72px; padding: 0.45rem 0.5rem; border-radius: 8px; border: 1.5px solid transparent; font-family: 'DM Sans', sans-serif; font-size: 0.7rem; font-weight: 800; cursor: pointer; transition: all .15s; text-align: center; }
  .sbtn:disabled { opacity: 0.4; cursor: not-allowed; }
  .sb-Pending   { background: ${dark ? 'rgba(245,158,11,0.12)' : '#fef3c7'}; color: #d97706; border-color: rgba(217,119,6,0.25); }
  .sb-Preparing { background: ${dark ? 'rgba(59,130,246,0.12)' : '#dbeafe'}; color: #2563eb; border-color: rgba(37,99,235,0.25); }
  .sb-Ready     { background: ${dark ? 'rgba(255,122,51,0.12)' : '#fff3ec'}; color: #FF7A33; border-color: rgba(255,122,51,0.25); }
  .sb-Delivered { background: ${dark ? 'rgba(22,163,74,0.12)' : '#dcfce7'}; color: #16a34a; border-color: rgba(22,163,74,0.25); }
  .empty-st { text-align: center; padding: 4rem 2rem; color: ${dark ? '#6b7280' : '#9ca3af'}; border-radius: 18px; border: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,122,51,0.06)'}; }
  .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; }
  .empty-title { font-family: 'Playfair Display', serif; font-size: 1.15rem; color: ${dark ? '#9ca3af' : '#6b7280'}; margin-bottom: 0.35rem; }
  @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }

  @media (max-width: 1024px) { .menu-layout { grid-template-columns: 1fr; } .orders-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); } }
  @media (max-width: 768px) {
    .adm-hdr-in { padding: 0.65rem 1rem; } .logo-sub { display: none; }
    .stats-bar { padding: 1.25rem 1rem; } .stats-in { grid-template-columns: 1fr 1fr; gap: 0.65rem; }
    .stat-val { font-size: 1.45rem; } .stat-card { padding: 0.75rem 0.85rem; border-radius: 12px; }
    .tabs-wrap { padding: 1rem 1rem 0; } .tab-btn { padding: 0.65rem 1rem; font-size: 0.82rem; }
    .adm-main { padding: 1.25rem 1rem 4rem; } .menu-layout { grid-template-columns: 1fr; }
    .panel-body { max-height: none; padding: 1.1rem; }
    .item-row { padding: 0.75rem 1rem; gap: 0.65rem; } .item-thumb { width: 46px; height: 46px; }
    .item-acts { gap: 0.25rem; flex-wrap: wrap; } .oos-toggle { padding: 0.25rem 0.5rem; font-size: 0.65rem; } .icon-btn { width: 28px; height: 28px; }
    .orders-grid { grid-template-columns: 1fr; } .section-hdr { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .refresh-btn { width: 100%; justify-content: center; }
    .modal-bg { padding: 0; align-items: flex-end; } .modal-box { width: 100% !important; max-width: 100% !important; border-radius: 22px 22px 0 0 !important; }
    .frow { grid-template-columns: 1fr; }
  }
`;

// ── UploadZone ─────────────────────────────────────────────────────────────
function UploadZone({ imageUrl, onUpload, onClear, id }) {
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const handle = async (file) => {
    if (!file) return;
    setBusy(true);
    try { await onUpload(file); }
    catch (e) { alert('❌ ' + e.message); }
    finally { setBusy(false); }
  };
  return (
    <div
      className={`upload-zone${imageUrl ? ' has-img' : ''}${drag ? ' drag' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
    >
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="preview" className="upload-preview" />
          <button className="upload-clear" onClick={e => { e.stopPropagation(); onClear(); }}>×</button>
        </>
      ) : busy ? (
        <div style={{ color:'#FF7A33', fontSize:'.85rem', fontWeight:700 }}>Uploading…</div>
      ) : (
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="#FF7A33" strokeWidth="1.5" style={{ marginBottom:6 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <div className="upload-lbl">
            <input type="file" accept="image/*" id={id} style={{ display:'none' }} onChange={e => handle(e.target.files[0])} />
            <label htmlFor={id} style={{ cursor:'pointer' }}>Click to upload</label> or drag & drop
          </div>
          <div className="upload-hint">JPG, PNG · Max 5 MB</div>
        </div>
      )}
    </div>
  );
}

// ── EditModal — every DNA field is its own useState, no abstraction ─────────
function EditModal({ item, onSave, onClose, dark }) {
  const [name,        setName]        = useState(item.name || '');
  const [price,       setPrice]       = useState(String(item.price || ''));
  const [category,    setCategory]    = useState(item.category || '');
  const [imageUrl,    setImageUrl]    = useState(item.imageUrl || '');
  const [prepTime,    setPrepTime]    = useState(String(item.prepTime || 10));
  const [description, setDescription] = useState(item.description || '');
  const [saving,      setSaving]      = useState(false);

  // ── DNA: each field is its own state variable ─────────────────────────────
  const [dnaCalories,   setDnaCalories]   = useState(toStr(item.calories));
  const [dnaSpice,      setDnaSpice]      = useState(toStr(item.spice));
  const [dnaProtein,    setDnaProtein]    = useState(toStr(item.protein));
  const [dnaPopularity, setDnaPopularity] = useState(toStr(item.popularity));
  const [dnaFreshness,  setDnaFreshness]  = useState(toStr(item.freshness));

  const handleSave = async () => {
    const parsedPrice = parseFloat(price);
    if (!name.trim()) { alert('Please enter a dish name.'); return; }
    if (isNaN(parsedPrice) || parsedPrice <= 0) { alert('Please enter a valid price.'); return; }

    // Convert every DNA field to a number right here — no helpers, no indirection
    const cal = parseFloat(dnaCalories);
    const spc = parseFloat(dnaSpice);
    const pro = parseFloat(dnaProtein);
    const pop = parseFloat(dnaPopularity);
    const frs = parseFloat(dnaFreshness);

    const payload = {
      ...item,
      name:        name.trim(),
      price:       parsedPrice,
      category:    category,
      imageUrl:    imageUrl,
      prepTime:    parseInt(prepTime) || 10,
      description: description.trim(),
      calories:    isNaN(cal) ? 0 : Math.max(0, cal),
      spice:       isNaN(spc) ? 0 : Math.max(0, spc),
      protein:     isNaN(pro) ? 0 : Math.max(0, pro),
      popularity:  isNaN(pop) ? 0 : Math.max(0, pop),
      freshness:   isNaN(frs) ? 0 : Math.max(0, frs),
    };

    setSaving(true);
    await onSave(payload);
    setSaving(false);
  };

  const inputStyle = {
    width:'100%', padding:'.8rem 1rem',
    border:`1.5px solid rgba(255,122,51,0.3)`,
    borderRadius:10,
    fontFamily:"'DM Sans',sans-serif", fontSize:'.9rem',
    color: dark ? '#e5e7eb' : '#1f2937',
    background: dark ? '#1e1914' : '#fffaf5',
    outline:'none',
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-inner">
          <div className="modal-title">✏️ Edit Dish</div>
          <UploadZone
            id="edit-upload"
            imageUrl={imageUrl}
            onUpload={async f => { const url = await uploadImage(f); setImageUrl(url); }}
            onClear={() => setImageUrl('')}
          />
          <div className="fstack">
            <input className="adm-inp" placeholder="Dish name" value={name} onChange={e => setName(e.target.value)} />
            <input className="adm-inp" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
            <div className="frow">
              <input className="adm-inp" type="number" placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} />
              <div>
                <input className="adm-inp" type="number" placeholder="Prep time (mins)" min="1" max="120" value={prepTime} onChange={e => setPrepTime(e.target.value)} />
                <div className="inp-hint">⏱ ETA shown to customers</div>
              </div>
            </div>
            <select className="adm-sel" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select Category</option>
              {['Breakfast','Lunch','Snacks','Beverages','Desserts'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* ── DNA STATS — flat individual inputs, zero abstraction ─────── */}
          <div className="dna-section">
            <div className="dna-hdr">
              <span style={{ fontSize:'1.15rem' }}>🧬</span>
              <span className="dna-hdr-title">Food DNA Stats</span>
              <span className="dna-badge">OPTIONAL</span>
            </div>
            <div className="dna-body">
              <div className="frow">
                <div>
                  <input
                    style={inputStyle}
                    type="number" min="0" max="800" step="1"
                    placeholder="🔥 Calories (kcal)"
                    value={dnaCalories}
                    onChange={e => setDnaCalories(e.target.value)}
                  />
                  <div className="inp-hint">0 – 800 kcal</div>
                </div>
                <div>
                  <input
                    style={inputStyle}
                    type="number" min="0" max="10" step="0.5"
                    placeholder="🌶 Spice (0–10)"
                    value={dnaSpice}
                    onChange={e => setDnaSpice(e.target.value)}
                  />
                  <div className="inp-hint">0 = mild · 10 = very hot</div>
                </div>
              </div>
              <div className="frow">
                <div>
                  <input
                    style={inputStyle}
                    type="number" min="0" max="50" step="0.5"
                    placeholder="💪 Protein (g)"
                    value={dnaProtein}
                    onChange={e => setDnaProtein(e.target.value)}
                  />
                  <div className="inp-hint">0 – 50 g per serving</div>
                </div>
                <div>
                  <input
                    style={inputStyle}
                    type="number" min="0" max="100" step="1"
                    placeholder="⭐ Popularity (%)"
                    value={dnaPopularity}
                    onChange={e => setDnaPopularity(e.target.value)}
                  />
                  <div className="inp-hint">0 – 100%</div>
                </div>
              </div>
              <div>
                <input
                  style={inputStyle}
                  type="number" min="0" max="10" step="0.5"
                  placeholder="✨ Freshness (0–10)"
                  value={dnaFreshness}
                  onChange={e => setDnaFreshness(e.target.value)}
                />
                <div className="inp-hint">10 = made fresh daily</div>
              </div>
            </div>
          </div>

          <div className="modal-acts">
            <button className="btn-primary" style={{ marginTop:0 }} onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Saving…' : '💾 Save Changes'}
            </button>
            <button className="btn-sec" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [menu,        setMenu]        = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [activeTab,   setActiveTab]   = useState('menu');
  const [editingItem, setEditingItem] = useState(null);
  const [imgBusy,     setImgBusy]     = useState(false);
  const [adding,      setAdding]      = useState(false);
  const [dark,        setDark]        = useState(() => getLS('darkMode', false));
  const navigate = useNavigate();

  // ── Add-form basic fields ────────────────────────────────────────────────
  const [newName,        setNewName]        = useState('');
  const [newPrice,       setNewPrice]       = useState('');
  const [newCategory,    setNewCategory]    = useState('');
  const [newImageUrl,    setNewImageUrl]    = useState('');
  const [newPrepTime,    setNewPrepTime]    = useState('10');
  const [newDescription, setNewDescription] = useState('');

  // ── Add-form DNA fields — each is its own state ──────────────────────────
  const [addCalories,   setAddCalories]   = useState('');
  const [addSpice,      setAddSpice]      = useState('');
  const [addProtein,    setAddProtein]    = useState('');
  const [addPopularity, setAddPopularity] = useState('');
  const [addFreshness,  setAddFreshness]  = useState('');

  const resetAddForm = () => {
    setNewName(''); setNewPrice(''); setNewCategory('');
    setNewImageUrl(''); setNewPrepTime('10'); setNewDescription('');
    setAddCalories(''); setAddSpice(''); setAddProtein('');
    setAddPopularity(''); setAddFreshness('');
  };

  // ── Dark mode sync ───────────────────────────────────────────────────────
  useEffect(() => {
    const sync = () => setDark(getLS('darkMode', false));
    window.addEventListener('storage', sync);
    const t = setInterval(sync, 1000);
    return () => { window.removeEventListener('storage', sync); clearInterval(t); };
  }, []);

  useEffect(() => { fetchMenu(); fetchOrders(); }, []);

  const fetchMenu   = async () => { try { const r = await axios.get(`${API}/api/menu`);   setMenu(r.data);   } catch (e) { console.error(e); } };
  const fetchOrders = async () => { try { const r = await axios.get(`${API}/api/orders`); setOrders(r.data); } catch (e) { console.error(e); } };

  // ── addMenuItem — builds DNA from flat state variables ───────────────────
  const addMenuItem = async () => {
    if (!newName.trim()) { alert('Please enter a dish name.'); return; }
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) { alert('Please enter a valid price.'); return; }

    // Parse each DNA field individually — inline, no helper calls
    const cal = parseFloat(addCalories);
    const spc = parseFloat(addSpice);
    const pro = parseFloat(addProtein);
    const pop = parseFloat(addPopularity);
    const frs = parseFloat(addFreshness);

    const payload = {
      name:        newName.trim(),
      price:       price,
      category:    newCategory || 'Other',
      imageUrl:    newImageUrl || null,
      description: newDescription.trim(),
      prepTime:    parseInt(newPrepTime) || 10,
      inStock:     true,
      calories:    isNaN(cal) ? 0 : Math.max(0, cal),
      spice:       isNaN(spc) ? 0 : Math.max(0, spc),
      protein:     isNaN(pro) ? 0 : Math.max(0, pro),
      popularity:  isNaN(pop) ? 0 : Math.max(0, pop),
      freshness:   isNaN(frs) ? 0 : Math.max(0, frs),
    };

    console.log('[DNA] Adding dish with payload:', JSON.stringify(payload, null, 2));

    setAdding(true);
    try {
      const res = await axios.post(`${API}/api/menu`, payload);
      console.log('[DNA] Add success:', res.data);
      resetAddForm();
      await fetchMenu();
    } catch (e) {
      console.error('[DNA] Add failed:', e.response?.data || e.message);
      alert('Failed to add: ' + (e.response?.data?.error || e.message));
    } finally {
      setAdding(false);
    }
  };

  // ── updateMenuItem — receives full item object from EditModal.handleSave ─
  const updateMenuItem = async (updated) => {
    // Explicitly extract every DNA field — no spread tricks
    const payload = {
      name:        updated.name,
      price:       updated.price,
      category:    updated.category,
      imageUrl:    updated.imageUrl,
      prepTime:    updated.prepTime,
      description: updated.description,
      calories:    Number(updated.calories)   || 0,
      spice:       Number(updated.spice)      || 0,
      protein:     Number(updated.protein)    || 0,
      popularity:  Number(updated.popularity) || 0,
      freshness:   Number(updated.freshness)  || 0,
    };

    console.log('[DNA] Updating dish', updated.id, 'with payload:', JSON.stringify(payload, null, 2));

    try {
      const res = await axios.put(`${API}/api/menu/${updated.id}`, payload);
      console.log('[DNA] Update success:', res.data);
      setEditingItem(null);
      await fetchMenu();
    } catch (e) {
      console.error('[DNA] Update failed:', e.response?.data || e.message);
      alert('Failed to update: ' + (e.response?.data?.error || e.message));
    }
  };

  const toggleStock = async (item) => {
    try { await axios.put(`${API}/api/menu/${item.id}/stock`, { inStock: item.inStock === false }); fetchMenu(); }
    catch (e) { alert('Failed to update stock.'); }
  };
  const deleteMenuItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await axios.delete(`${API}/api/menu/${id}`); fetchMenu(); }
    catch (e) { alert('Failed to delete.'); }
  };
  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/api/orders/${orderId}/status`, { status });
      if (status === 'Delivered') await axios.delete(`${API}/api/orders/${orderId}`);
      fetchOrders();
    } catch (e) { alert('Failed to update order.'); }
  };

  const pending  = orders.filter(o => o.status === 'Pending').length;
  const totalRev = orders.reduce((s, o) => s + (o.total || 0), 0);
  const oosCount = menu.filter(m => m.inStock === false).length;
  const STRIP = { Pending:'#f59e0b', Preparing:'#3b82f6', Ready:'#FF7A33', Delivered:'#9ca3af' };

  const dnaInputStyle = (dark) => ({
    width:'100%', padding:'.8rem 1rem',
    border:`1.5px solid rgba(255,122,51,0.28)`,
    borderRadius:10,
    fontFamily:"'DM Sans',sans-serif", fontSize:'.9rem',
    color: dark ? '#e5e7eb' : '#1f2937',
    background: dark ? '#1e1914' : '#fffaf5',
    outline:'none',
  });

  return (
    <>
      <style>{makeStyles(dark)}</style>
      {editingItem && (
        <EditModal
          key={editingItem.id}
          item={editingItem}
          dark={dark}
          onSave={updateMenuItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* ── HEADER ── */}
      <header className="adm-hdr">
        <div className="adm-hdr-in">
          <div className="logo-wrap">
            <div className="logo-icon">
              <svg width="26" height="26" viewBox="0 0 52 52" fill="none">
                <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z" fill="white"/>
                <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
                <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.3)"/>
              </svg>
            </div>
            <div>
              <div className="logo-brand">Annapurna <span className="admin-badge">Admin</span></div>
              <div className="logo-sub">Control Panel</div>
            </div>
          </div>
          <button className="back-btn" onClick={() => navigate('/menu')}>← Back to Menu</button>
        </div>
      </header>

      {/* ── STATS ── */}
      <section className="stats-bar">
        <div className="stats-in">
          <div className="stat-card"><div className="stat-lbl">Menu Items</div><div className="stat-val">{menu.length}</div><div className="stat-sub">{oosCount > 0 ? `${oosCount} out of stock` : 'All available'}</div></div>
          <div className="stat-card"><div className="stat-lbl">Live Orders</div><div className="stat-val">{orders.length}</div><div className="stat-sub">{pending} pending</div></div>
          <div className="stat-card"><div className="stat-lbl">Preparing</div><div className="stat-val">{orders.filter(o => o.status === 'Preparing').length}</div><div className="stat-sub">In the kitchen</div></div>
          <div className="stat-card"><div className="stat-lbl">Ready</div><div className="stat-val" style={{ color: orders.filter(o=>o.status==='Ready').length>0 ? '#FFAA77' : 'white' }}>{orders.filter(o => o.status === 'Ready').length}</div><div className="stat-sub">Awaiting pickup</div></div>
          <div className="stat-card"><div className="stat-lbl">Revenue</div><div className="stat-val">₹{totalRev.toFixed(0)}</div><div className="stat-sub">Active orders</div></div>
        </div>
      </section>

      {/* ── TABS ── */}
      <div className="tabs-bg">
        <div className="tabs-wrap">
          <button className={`tab-btn${activeTab==='menu'?'  active':''}`} onClick={() => setActiveTab('menu')}>
            🍽️ Menu Management <span className="tab-bdg bdg-gray">{menu.length}</span>
          </button>
          <button className={`tab-btn${activeTab==='orders'?' active':''}`} onClick={() => setActiveTab('orders')}>
            📦 Live Orders <span className={`tab-bdg ${pending>0?'bdg-amber':'bdg-gray'}`}>{pending>0?pending:orders.length}</span>
          </button>
        </div>
      </div>

      <main className="adm-main">

        {/* ── MENU TAB ── */}
        {activeTab === 'menu' && (
          <div className="menu-layout">

            {/* ── ADD FORM ── */}
            <div className="panel">
              <div className="panel-hdr">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#FF7A33" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                <div className="panel-title">Add New Dish</div>
              </div>
              <div className="panel-body">
                <UploadZone
                  id="add-upload"
                  imageUrl={newImageUrl}
                  onUpload={async f => { setImgBusy(true); try { const url = await uploadImage(f); setNewImageUrl(url); } catch (e) { alert('❌ ' + e.message); } finally { setImgBusy(false); } }}
                  onClear={() => setNewImageUrl('')}
                />
                <div className="fstack">
                  <input className="adm-inp" placeholder="Dish name e.g. Paneer Tikka" value={newName} onChange={e => setNewName(e.target.value)} />
                  <input className="adm-inp" placeholder="Short description (optional)" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                  <div className="frow">
                    <input className="adm-inp" type="number" placeholder="Price (₹)" min="0" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
                    <div>
                      <input className="adm-inp" type="number" placeholder="Prep time (mins)" min="1" max="120" value={newPrepTime} onChange={e => setNewPrepTime(e.target.value)} />
                      <div className="inp-hint">⏱ ETA shown to customers</div>
                    </div>
                  </div>
                  <select className="adm-sel" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                    <option value="">Select Category</option>
                    {['Breakfast','Lunch','Snacks','Beverages','Desserts'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* ── DNA STATS — flat individual inputs ── */}
                <div className="dna-section">
                  <div className="dna-hdr">
                    <span style={{ fontSize:'1.15rem' }}>🧬</span>
                    <span className="dna-hdr-title">Food DNA Stats</span>
                    <span className="dna-badge">OPTIONAL</span>
                  </div>
                  <div className="dna-body">
                    <div className="frow">
                      <div>
                        <input
                          style={dnaInputStyle(dark)}
                          type="number" min="0" max="800" step="1"
                          placeholder="🔥 Calories (kcal)"
                          value={addCalories}
                          onChange={e => setAddCalories(e.target.value)}
                        />
                        <div className="inp-hint">0 – 800 kcal</div>
                      </div>
                      <div>
                        <input
                          style={dnaInputStyle(dark)}
                          type="number" min="0" max="10" step="0.5"
                          placeholder="🌶 Spice (0–10)"
                          value={addSpice}
                          onChange={e => setAddSpice(e.target.value)}
                        />
                        <div className="inp-hint">0 = mild · 10 = very hot</div>
                      </div>
                    </div>
                    <div className="frow">
                      <div>
                        <input
                          style={dnaInputStyle(dark)}
                          type="number" min="0" max="50" step="0.5"
                          placeholder="💪 Protein (g)"
                          value={addProtein}
                          onChange={e => setAddProtein(e.target.value)}
                        />
                        <div className="inp-hint">0 – 50 g per serving</div>
                      </div>
                      <div>
                        <input
                          style={dnaInputStyle(dark)}
                          type="number" min="0" max="100" step="1"
                          placeholder="⭐ Popularity (%)"
                          value={addPopularity}
                          onChange={e => setAddPopularity(e.target.value)}
                        />
                        <div className="inp-hint">0 – 100%</div>
                      </div>
                    </div>
                    <div>
                      <input
                        style={dnaInputStyle(dark)}
                        type="number" min="0" max="10" step="0.5"
                        placeholder="✨ Freshness (0–10)"
                        value={addFreshness}
                        onChange={e => setAddFreshness(e.target.value)}
                      />
                      <div className="inp-hint">10 = made fresh daily</div>
                    </div>
                  </div>
                </div>

                <button className="btn-primary" onClick={addMenuItem} disabled={imgBusy || adding}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  {imgBusy ? 'Uploading image…' : adding ? '⏳ Adding…' : 'Add to Menu'}
                </button>
              </div>
            </div>

            {/* ── MENU LIST ── */}
            <div className="list-panel">
              <div className="list-hdr">
                <div className="list-title">All Menu Items</div>
                <span className="list-count">{menu.length} dishes · {oosCount} OOS</span>
              </div>
              <div className="menu-scroll">
                {menu.length === 0 ? (
                  <div className="empty-st" style={{ margin:'1rem', borderRadius:14 }}>
                    <div className="empty-icon">🍽️</div>
                    <div className="empty-title">No dishes yet</div>
                    <p style={{ fontSize:'.82rem' }}>Add your first dish using the form</p>
                  </div>
                ) : menu.map(item => {
                  const hasDNA = (item.calories > 0 || item.spice > 0 || item.protein > 0 || item.popularity > 0 || item.freshness > 0);
                  return (
                    <div key={item.id} className="item-row">
                      <img className="item-thumb"
                        src={item.imageUrl || `https://via.placeholder.com/56/2d1f0e/FF7A33?text=${encodeURIComponent(item.name[0])}`}
                        alt={item.name}
                        style={{ opacity: item.inStock === false ? 0.45 : 1 }}
                      />
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-meta">
                          <span>{item.category || 'Uncategorised'}</span>
                          {item.prepTime > 0 && <span>⏱ {item.prepTime}m</span>}
                          {hasDNA && <span className="dna-tag">🧬 DNA</span>}
                        </div>
                      </div>
                      <div className="item-price">₹{item.price.toFixed(2)}</div>
                      <div className="item-acts">
                        <button className={`oos-toggle ${item.inStock===false?'out-stock':'in-stock'}`} onClick={() => toggleStock(item)}>
                          {item.inStock===false ? '❌ OOS' : '✅ In Stock'}
                        </button>
                        <button className="icon-btn btn-edit" onClick={() => setEditingItem(item)} title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/>
                          </svg>
                        </button>
                        <button className="icon-btn btn-del" onClick={() => deleteMenuItem(item.id)} title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === 'orders' && (
          <div>
            <div className="section-hdr">
              <div>
                <div className="section-title">Live Orders</div>
                <div className="section-sub">{orders.length} active · Auto-refresh recommended</div>
              </div>
              <button className="refresh-btn" onClick={fetchOrders}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
                </svg>
                Refresh
              </button>
            </div>
            {orders.length === 0 ? (
              <div className="empty-st">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No active orders</div>
                <p style={{ fontSize:'.82rem', marginTop:'.25rem' }}>New orders will appear here</p>
              </div>
            ) : (
              ['Pending','Preparing','Ready'].map(status => {
                const group = orders.filter(o => o.status === status);
                if (!group.length) return null;
                return (
                  <div key={status} style={{ marginBottom:'2.25rem' }}>
                    <div className="group-hdr">
                      <span className={`status-pill s-${status}`}>{status}</span>
                      <span style={{ fontSize:'.8rem', color: dark?'#6b7280':'#9ca3af', fontWeight:600 }}>{group.length} order{group.length>1?'s':''}</span>
                    </div>
                    <div className="orders-grid">
                      {group.map(order => (
                        <div key={order.id} className="ocard">
                          <div className="ocard-strip" style={{ background: STRIP[order.status] }} />
                          <div className="ocard-top">
                            <div className="ocard-id">#{order.id.slice(-6).toUpperCase()}</div>
                            <span className={`status-pill s-${order.status}`}>{order.status}</span>
                          </div>
                          <div className="ocard-body">
                            <div className="odet-row"><span>👤</span><span className="odet-txt"><strong>To:</strong> {order.deliveryName||'—'}</span></div>
                            <div className="odet-row"><span>📍</span><span className="odet-txt"><strong>At:</strong> {order.deliveryLocation||'—'}</span></div>
                            <div className="odet-row"><span>{order.paymentMethod==='upi'?'💳':'💵'}</span><span className="odet-txt"><strong>Pay:</strong> {order.paymentMethod==='upi'?'Prepaid UPI':'Cash on Delivery'}</span></div>
                            {order.items?.length > 0 && (
                              <div className="oitems">
                                {order.items.map((it, i) => (
                                  <div key={i} className="oitem-line">
                                    <span>{it.name} × {it.quantity}</span>
                                    <span>₹{(it.price*it.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="ototal">₹{(order.total||0).toFixed(2)}</div>
                          </div>
                          <div className="status-btns">
                            {STATUS_ORDER.filter(s => s!=='Delivered').map(s => (
                              <button key={s} className={`sbtn sb-${s}`} disabled={order.status===s} onClick={() => updateOrderStatus(order.id, s)}>{s}</button>
                            ))}
                            <button className="sbtn sb-Delivered" onClick={() => updateOrderStatus(order.id, 'Delivered')}>✓ Done</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </>
  );
}