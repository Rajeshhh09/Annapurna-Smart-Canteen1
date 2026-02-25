import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const API = 'https://annapurna-smart-canteen1.onrender.com';

// ── Dark mode helpers (synced with MenuPage via localStorage) ─────────────
const getLS = (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } };

const STEPS = ['Pending', 'Preparing', 'Ready', 'Delivered'];
const STEP_ICONS = { Pending: '🕐', Preparing: '👨‍🍳', Ready: '✅', Delivered: '🎉' };

const makeStyles = (dark) => `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: ${dark ? '#0f0f0f' : '#faf9f6'};
    color: ${dark ? '#e5e7eb' : '#1f2937'};
    transition: background .3s, color .3s;
  }

  /* ── HEADER ─────────────────────────────────────────────────────── */
  .ord-header {
    position: sticky; top: 0; z-index: 100;
    background: ${dark ? 'rgba(15,15,15,0.95)' : 'rgba(255,255,255,0.95)'};
    backdrop-filter: blur(16px);
    border-bottom: 1px solid ${dark ? 'rgba(255,122,51,0.12)' : 'rgba(255,122,51,0.1)'};
    box-shadow: ${dark ? '0 2px 24px rgba(0,0,0,0.4)' : '0 2px 20px rgba(0,0,0,0.06)'};
  }
  .ord-header-inner {
    max-width: 1000px; margin: 0 auto;
    padding: 0.9rem 2rem;
    display: flex; align-items: center; justify-content: space-between;
  }
  .header-logo { display: flex; align-items: center; gap: 0.75rem; }
  .header-logo-icon {
    width: 42px; height: 42px;
    background: linear-gradient(145deg, #FF7A33, #FF5500);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(255,107,0,0.35); flex-shrink: 0;
  }
  .header-brand { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; line-height: 1.1; }
  .header-sub { font-size: 0.62rem; color: #FF7A33; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 1px; }
  .back-btn {
    display: flex; align-items: center; gap: 0.45rem;
    padding: 0.55rem 1.1rem;
    background: ${dark ? 'rgba(255,122,51,0.1)' : '#f5f5f0'};
    border: 1.5px solid ${dark ? 'rgba(255,122,51,0.25)' : '#e5e7eb'};
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600;
    color: ${dark ? '#FFAA77' : '#374151'};
    cursor: pointer; transition: all 0.2s ease;
  }
  .back-btn:hover {
    background: ${dark ? 'rgba(255,122,51,0.18)' : '#fff'};
    border-color: rgba(255,122,51,0.45); color: #FF7A33;
    transform: translateX(-2px);
  }

  /* ── HERO ─────────────────────────────────────────────────────────── */
  .orders-hero {
    background: linear-gradient(135deg, #1a0f05 0%, #2d1f0e 50%, #3d2a14 100%);
    padding: 3rem 2rem;
    position: relative; overflow: hidden;
  }
  .orders-hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 15% 50%, rgba(255,122,51,0.2) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 20%, rgba(255,107,0,0.12) 0%, transparent 55%),
      radial-gradient(ellipse at 50% 100%, rgba(255,85,0,0.08) 0%, transparent 50%);
  }
  .orders-hero::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,122,51,0.4), transparent);
  }
  .orders-hero-inner {
    max-width: 1000px; margin: 0 auto;
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: space-between; gap: 2rem;
    flex-wrap: wrap;
  }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: rgba(255,122,51,0.15); border: 1px solid rgba(255,122,51,0.3);
    color: #FFAA77; font-size: 0.7rem; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; padding: 0.3rem 0.85rem; border-radius: 999px;
    margin-bottom: 0.85rem;
  }
  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.5rem; font-weight: 800; color: white; line-height: 1.1;
    margin-bottom: 0.6rem;
  }
  .hero-title span { color: #FF7A33; }
  .hero-sub { font-size: 0.88rem; color: rgba(255,255,255,0.5); font-weight: 500; }
  .hero-stats { display: flex; gap: 0.85rem; flex-wrap: wrap; }
  .hero-stat {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; padding: 1rem 1.35rem;
    backdrop-filter: blur(8px); text-align: center; min-width: 95px;
    transition: background .2s;
  }
  .hero-stat:hover { background: rgba(255,255,255,0.12); }
  .hero-stat-val { font-family: 'Playfair Display', serif; font-size: 1.7rem; font-weight: 800; color: white; line-height: 1; }
  .hero-stat-lbl { font-size: 0.65rem; color: rgba(255,255,255,0.45); font-weight: 700; letter-spacing: 1px; margin-top: 4px; text-transform: uppercase; }

  /* ── MAIN ─────────────────────────────────────────────────────────── */
  .ord-main { max-width: 1000px; margin: 0 auto; padding: 2rem; }

  /* ── FILTER PILLS ─────────────────────────────────────────────────── */
  .status-legend { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
  .legend-pill {
    display: flex; align-items: center; gap: 0.45rem;
    padding: 0.45rem 1rem; border-radius: 999px;
    font-size: 0.78rem; font-weight: 700; cursor: pointer;
    border: 1.5px solid transparent; transition: all 0.2s ease;
    background: ${dark ? '#1a1a1a' : 'white'};
    color: ${dark ? '#9ca3af' : '#6b7280'};
  }
  .legend-pill:hover { transform: translateY(-1px); }
  .legend-pill.active { border-color: currentColor; }
  .legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  /* ── ORDER CARD ───────────────────────────────────────────────────── */
  .order-card {
    background: ${dark ? '#1a1a1a' : 'white'};
    border-radius: 20px;
    box-shadow: ${dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.06)'};
    border: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
    overflow: hidden; margin-bottom: 1.25rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: fadeUp 0.4s ease both;
  }
  .order-card:hover {
    transform: translateY(-4px);
    box-shadow: ${dark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 10px 32px rgba(0,0,0,0.1)'};
  }

  /* Status strip */
  .card-strip { height: 4px; width: 100%; }
  .strip-Pending   { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .strip-Preparing { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  .strip-Ready     { background: linear-gradient(90deg, #FF7A33, #FF5500); }
  .strip-Delivered { background: linear-gradient(90deg, #6b7280, #9ca3af); }

  .card-top {
    padding: 1.2rem 1.5rem 1rem;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
    border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#f5f5f0'};
  }
  .card-order-id {
    font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 800;
    color: ${dark ? '#f9fafb' : '#2d1f0e'};
  }
  .card-time { font-size: 0.75rem; color: ${dark ? '#6b7280' : '#b0b8c1'}; margin-top: 4px; display: flex; align-items: center; gap: 0.3rem; }

  .status-badge {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.7rem; font-weight: 800; letter-spacing: 0.8px;
    text-transform: uppercase; padding: 0.35rem 0.9rem; border-radius: 999px;
    white-space: nowrap; flex-shrink: 0;
  }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; }
  .badge-Pending   { background: ${dark ? 'rgba(245,158,11,0.15)' : '#fef3c7'}; color: #d97706; }
  .dot-Pending     { background: #f59e0b; }
  .badge-Preparing { background: ${dark ? 'rgba(59,130,246,0.15)' : '#dbeafe'}; color: #3b82f6; animation: pulseBadge 1.5s ease-in-out infinite; }
  .dot-Preparing   { background: #3b82f6; }
  .badge-Ready     { background: ${dark ? 'rgba(255,122,51,0.15)' : '#fff3ec'}; color: #FF7A33; }
  .dot-Ready       { background: #FF7A33; }
  .badge-Delivered { background: ${dark ? 'rgba(107,114,128,0.15)' : '#f3f4f6'}; color: ${dark ? '#9ca3af' : '#6b7280'}; }
  .dot-Delivered   { background: #9ca3af; }

  /* ── PROGRESS TRACKER ─────────────────────────────────────────────── */
  .progress-wrap {
    padding: 1.1rem 1.5rem;
    border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#f5f5f0'};
    background: ${dark ? 'rgba(255,255,255,0.02)' : '#fdfcfb'};
  }
  .progress-track { display: flex; align-items: center; position: relative; }
  .progress-step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; z-index: 1; }
  .step-circle {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.78rem; font-weight: 700;
    border: 2px solid ${dark ? '#2d2d2d' : '#e5e7eb'};
    background: ${dark ? '#1a1a1a' : 'white'};
    color: ${dark ? '#4b5563' : '#d1d5db'};
    transition: all 0.3s ease; position: relative; z-index: 2;
  }
  .step-circle.done { background: linear-gradient(135deg, #FF7A33, #FF5500); border-color: #FF7A33; color: white; box-shadow: 0 4px 12px rgba(255,107,0,0.4); }
  .step-circle.active { background: ${dark ? '#1a1a1a' : 'white'}; border-color: #FF7A33; color: #FF7A33; box-shadow: 0 0 0 5px rgba(255,122,51,0.15); }
  .step-label { font-size: 0.65rem; font-weight: 700; color: ${dark ? '#6b7280' : '#9ca3af'}; margin-top: 6px; white-space: nowrap; letter-spacing: 0.3px; }
  .step-label.done, .step-label.active { color: #FF7A33; }
  .step-line {
    position: absolute; top: 17px; left: calc(50% + 17px);
    height: 2px; width: calc(100% - 34px);
    background: ${dark ? '#2d2d2d' : '#e5e7eb'}; z-index: 1; transition: background 0.4s ease;
  }
  .step-line.done { background: linear-gradient(90deg, #FF7A33, #FF5500); }

  /* ── CARD BODY ─────────────────────────────────────────────────────── */
  .card-body { padding: 1.2rem 1.5rem; }
  .delivery-row {
    display: flex; gap: 1.5rem; flex-wrap: wrap;
    background: ${dark ? 'rgba(255,255,255,0.03)' : '#faf9f6'};
    border-radius: 12px; padding: 0.8rem 1rem;
    margin-bottom: 1rem;
    border: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'};
  }
  .delivery-item { display: flex; align-items: flex-start; gap: 0.45rem; }
  .delivery-icon { font-size: 0.85rem; flex-shrink: 0; margin-top: 1px; }
  .delivery-label { font-size: 0.68rem; color: ${dark ? '#6b7280' : '#9ca3af'}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .delivery-val { font-size: 0.83rem; color: ${dark ? '#e5e7eb' : '#374151'}; font-weight: 600; margin-top: 2px; }

  .items-header { font-size: 0.72rem; font-weight: 800; color: ${dark ? '#6b7280' : '#9ca3af'}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.6rem; }
  .item-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.55rem 0; border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.04)' : '#f5f5f0'};
  }
  .item-row:last-child { border-bottom: none; }
  .item-left { display: flex; align-items: center; gap: 0.5rem; }
  .item-qty-badge {
    background: ${dark ? 'rgba(255,122,51,0.15)' : '#fff3ec'}; color: #FF7A33;
    font-size: 0.7rem; font-weight: 800;
    width: 24px; height: 24px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .item-name { font-size: 0.88rem; font-weight: 500; color: ${dark ? '#d1d5db' : '#374151'}; }
  .item-price { font-size: 0.88rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#1f2937'}; }

  /* ── CARD FOOTER ───────────────────────────────────────────────────── */
  .card-footer {
    padding: 0.95rem 1.5rem;
    background: ${dark ? 'rgba(255,122,51,0.06)' : '#fdf9f5'};
    border-top: 1px solid ${dark ? 'rgba(255,122,51,0.1)' : '#f5f5f0'};
    display: flex; justify-content: space-between; align-items: center;
  }
  .total-label { font-size: 0.82rem; color: ${dark ? '#9ca3af' : '#9ca3af'}; font-weight: 500; }
  .total-amount { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 800; color: #FF7A33; }

  /* ── PAYMENT BADGE ─────────────────────────────────────────────────── */
  .pay-badge {
    font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px;
    letter-spacing: 0.3px; text-transform: uppercase;
  }
  .pay-upi { background: ${dark ? 'rgba(99,102,241,0.15)' : '#eef2ff'}; color: #6366f1; }
  .pay-cod { background: ${dark ? 'rgba(16,185,129,0.15)' : '#ecfdf5'}; color: #10b981; }

  /* ── EMPTY STATE ───────────────────────────────────────────────────── */
  .empty-wrap {
    text-align: center; padding: 5rem 2rem;
    background: ${dark ? '#1a1a1a' : 'white'}; border-radius: 24px;
    box-shadow: ${dark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.06)'};
    border: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,122,51,0.08)'};
  }
  .empty-bowl {
    width: 88px; height: 88px;
    background: linear-gradient(145deg, #FF7A33, #FF5500);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.5rem;
    box-shadow: 0 12px 32px rgba(255,107,0,0.35);
  }
  .empty-title { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; margin-bottom: 0.6rem; }
  .empty-sub { font-size: 0.9rem; color: ${dark ? '#6b7280' : '#9ca3af'}; margin-bottom: 1.75rem; }
  .order-now-btn {
    display: inline-flex; align-items: center; gap: 0.45rem;
    padding: 0.85rem 2rem;
    background: linear-gradient(135deg, #FF7A33, #FF5500);
    color: white; border: none; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 700;
    cursor: pointer; box-shadow: 0 6px 20px rgba(255,107,0,0.4);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .order-now-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(255,107,0,0.5); }

  /* ── LOADING ───────────────────────────────────────────────────────── */
  .loading-root {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 1.25rem;
    background: ${dark ? '#0f0f0f' : '#faf9f6'};
    font-family: 'DM Sans', sans-serif;
  }
  .loading-text { font-size: 0.9rem; color: ${dark ? '#6b7280' : '#9ca3af'}; font-weight: 600; }

  /* ── ANIMATIONS ────────────────────────────────────────────────────── */
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulseBadge { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }
  @keyframes steamRise {
    0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.9; }
    50% { transform: translateY(-3px) scaleX(0.8); opacity: 0.5; }
  }
  .steam-1 { animation: steamRise 1.8s ease-in-out infinite; }
  .steam-2 { animation: steamRise 1.8s ease-in-out 0.35s infinite; }
  .steam-3 { animation: steamRise 1.8s ease-in-out 0.7s infinite; }

  /* ═══════════════════════════════════════════
     MOBILE — max-width 768px
  ═══════════════════════════════════════════ */
  @media (max-width: 768px) {
    /* Header */
    .ord-header-inner { padding: 0.65rem 1rem; }
    .header-brand { font-size: 1rem; }
    .header-sub { display: none; }
    .back-btn { padding: 0.45rem 0.75rem; font-size: 0.78rem; }
    .back-btn span { display: none; }

    /* Hero */
    .orders-hero { padding: 1.75rem 1rem; }
    .orders-hero-inner { flex-direction: column; gap: 1.25rem; }
    .hero-title { font-size: 1.85rem; }
    .hero-sub { font-size: 0.82rem; }
    .hero-stats { width: 100%; justify-content: space-between; }
    .hero-stat { flex: 1; min-width: 0; padding: 0.75rem 0.5rem; }
    .hero-stat-val { font-size: 1.35rem; }
    .hero-stat-lbl { font-size: 0.6rem; }

    /* Main */
    .ord-main { padding: 1.25rem 1rem 4rem; }

    /* Filter pills — horizontal scroll */
    .status-legend { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 0.25rem; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .status-legend::-webkit-scrollbar { display: none; }
    .legend-pill { flex-shrink: 0; }

    /* Order cards */
    .order-card { border-radius: 15px; margin-bottom: 1rem; }
    .card-top { padding: 1rem 1.1rem 0.8rem; }
    .card-order-id { font-size: 1rem; }
    .card-body { padding: 1rem 1.1rem; }
    .card-footer { padding: 0.8rem 1.1rem; }

    /* Progress tracker — smaller on mobile */
    .progress-wrap { padding: 0.9rem 0.75rem; overflow-x: auto; }
    .step-circle { width: 28px; height: 28px; font-size: 0.7rem; }
    .step-label { font-size: 0.58rem; }
    .step-line { top: 14px; }

    /* Delivery row */
    .delivery-row { flex-direction: column; gap: 0.6rem; padding: 0.65rem 0.85rem; }

    /* Empty state */
    .empty-wrap { padding: 3.5rem 1.5rem; border-radius: 18px; }
    .empty-title { font-size: 1.35rem; }
    .empty-bowl { width: 72px; height: 72px; }
  }

  @media (max-width: 400px) {
    .hero-title { font-size: 1.55rem; }
    .step-label { display: none; }
    .step-circle { width: 26px; height: 26px; }
  }
`;

const formatTimestamp = (ts) => {
  if (!ts) return null;
  if (ts && typeof ts.toDate === 'function') return ts.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  if (ts instanceof Date) return ts.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

function ProgressTracker({ status }) {
  const currentIdx = STEPS.indexOf(status);
  return (
    <div className="progress-wrap">
      <div className="progress-track">
        {STEPS.map((step, i) => {
          const isDone   = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={step} className="progress-step">
              {i < STEPS.length - 1 && (
                <div className={`step-line${isDone ? ' done' : ''}`} />
              )}
              <div className={`step-circle${isDone ? ' done' : isActive ? ' active' : ''}`}>
                {isDone ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                ) : <span>{STEP_ICONS[step]}</span>}
              </div>
              <div className={`step-label${isDone || isActive ? ' done' : ''}`}>{step}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('All');
  const [user, setUser]       = useState(null);
  const [dark, setDark]       = useState(() => getLS('darkMode', false));
  const navigate = useNavigate();

  // Sync dark mode with MenuPage changes (in case user switches tabs)
  useEffect(() => {
    const sync = () => setDark(getLS('darkMode', false));
    window.addEventListener('storage', sync);
    const interval = setInterval(sync, 1000);
    return () => { window.removeEventListener('storage', sync); clearInterval(interval); };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${API}/api/orders/user/${user.uid}`);
        setOrders(res.data);
      } catch (e) {
        if (e.response?.status !== 404) console.error(e);
      } finally { setLoading(false); }
    };
    fetchOrders();
  }, [user]);

  const FILTERS = ['All', ...STEPS];
  const filtered     = filter === 'All' ? orders : orders.filter(o => o.status === filter);
  const activeCount  = orders.filter(o => o.status !== 'Delivered').length;

  const FILTER_COLORS = {
    All:       { dot: dark ? '#6b7280' : '#9ca3af' },
    Pending:   { dot: '#f59e0b' },
    Preparing: { dot: '#3b82f6' },
    Ready:     { dot: '#FF7A33' },
    Delivered: { dot: '#9ca3af' },
  };

  const BowlSVG = (
    <svg width="44" height="44" viewBox="0 0 52 52" fill="none">
      <path className="steam-1" d="M18 14 Q17 11 18 8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path className="steam-2" d="M26 13 Q25 10 26 7" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path className="steam-3" d="M34 14 Q33 11 34 8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z" fill="white"/>
      <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
      <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.18)"/>
      <circle cx="26" cy="34" r="2.5" fill="rgba(255,107,0,0.35)"/>
      <ellipse cx="26" cy="42.5" rx="18" ry="2.5" fill="rgba(255,255,255,0.4)"/>
    </svg>
  );

  if (loading) return (
    <>
      <style>{makeStyles(dark)}</style>
      <div className="loading-root">
        <div style={{ position:'relative', width:80, height:80 }}>
          <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:'2px dashed rgba(255,122,51,0.35)', animation:'spin 20s linear infinite' }} />
          <div style={{ width:80, height:80, background:'linear-gradient(145deg,#FF7A33,#FF5500)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 28px rgba(255,107,0,0.4)' }}>
            {BowlSVG}
          </div>
        </div>
        <p className="loading-text">Loading your orders…</p>
      </div>
    </>
  );

  return (
    <>
      <style>{makeStyles(dark)}</style>

      {/* ── HEADER ── */}
      <header className="ord-header">
        <div className="ord-header-inner">
          <div className="header-logo">
            <div className="header-logo-icon">
              <svg width="26" height="26" viewBox="0 0 52 52" fill="none">
                <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z" fill="white"/>
                <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
                <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.3)"/>
                <circle cx="26" cy="34" r="2" fill="rgba(255,107,0,0.5)"/>
                <ellipse cx="26" cy="42.5" rx="18" ry="2.5" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
            <div>
              <div className="header-brand">Annapurna</div>
              <div className="header-sub">Smart Canteen</div>
            </div>
          </div>
          <button className="back-btn" onClick={() => navigate('/menu')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            Back to Menu
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="orders-hero">
        <div className="orders-hero-inner">
          <div>
            <div className="hero-eyebrow">✦ Order Tracking</div>
            <h1 className="hero-title">My <span>Orders</span></h1>
            <p className="hero-sub">
              {activeCount > 0 ? `${activeCount} active order${activeCount > 1 ? 's' : ''} in progress` : 'All your food orders in one place'}
            </p>
          </div>
          {orders.length > 0 && (
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-val">{orders.length}</div>
                <div className="hero-stat-lbl">Total</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-val">{activeCount}</div>
                <div className="hero-stat-lbl">Active</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-val">₹{orders.reduce((s, o) => s + o.total, 0).toFixed(0)}</div>
                <div className="hero-stat-lbl">Spent</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── MAIN ── */}
      <main className="ord-main">
        {orders.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-bowl">{BowlSVG}</div>
            <div className="empty-title">No orders yet</div>
            <div className="empty-sub">Place your first order and track it live right here</div>
            <button className="order-now-btn" onClick={() => navigate('/menu')}>
              🍽️ Browse the Menu
            </button>
          </div>
        ) : (
          <>
            {/* Filter pills */}
            <div className="status-legend">
              {FILTERS.map(f => {
                const isActive = filter === f;
                const c = FILTER_COLORS[f];
                const count = f === 'All' ? orders.length : orders.filter(o => o.status === f).length;
                if (count === 0 && f !== 'All') return null;
                return (
                  <button
                    key={f}
                    className={`legend-pill${isActive ? ' active' : ''}`}
                    style={{
                      color: isActive ? (f === 'All' ? '#FF7A33' : c.dot) : undefined,
                      borderColor: isActive ? c.dot : 'transparent',
                    }}
                    onClick={() => setFilter(f)}
                  >
                    <span className="legend-dot" style={{ background: c.dot }} />
                    {f} <span style={{ fontWeight:800 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Order cards */}
            {filtered.map((order, idx) => {
              const ts = formatTimestamp(order.timestamp);
              return (
                <div key={order.id} className="order-card" style={{ animationDelay:`${idx * 0.06}s` }}>
                  <div className={`card-strip strip-${order.status}`} />
                  <div className="card-top">
                    <div>
                      <div className="card-order-id">Order #{order.id.slice(-6).toUpperCase()}</div>
                      {ts && (
                        <div className="card-time">
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          {ts}
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.4rem' }}>
                      <span className={`status-badge badge-${order.status}`}>
                        <span className={`status-dot dot-${order.status}`} />
                        {order.status}
                      </span>
                      {order.paymentMethod && (
                        <span className={`pay-badge ${order.paymentMethod === 'upi' ? 'pay-upi' : 'pay-cod'}`}>
                          {order.paymentMethod === 'upi' ? '💳 UPI' : '💵 COD'}
                        </span>
                      )}
                    </div>
                  </div>

                  <ProgressTracker status={order.status} />

                  <div className="card-body">
                    {(order.deliveryName || order.deliveryLocation) && (
                      <div className="delivery-row">
                        {order.deliveryName && (
                          <div className="delivery-item">
                            <span className="delivery-icon">👤</span>
                            <div>
                              <div className="delivery-label">Recipient</div>
                              <div className="delivery-val">{order.deliveryName}</div>
                            </div>
                          </div>
                        )}
                        {order.deliveryLocation && (
                          <div className="delivery-item">
                            <span className="delivery-icon">📍</span>
                            <div>
                              <div className="delivery-label">Delivery to</div>
                              <div className="delivery-val">{order.deliveryLocation}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="items-header">Items ordered</div>
                    {order.items.map((item, i) => (
                      <div key={i} className="item-row">
                        <div className="item-left">
                          <span className="item-qty-badge">{item.quantity}</span>
                          <span className="item-name">{item.name}</span>
                        </div>
                        <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="card-footer">
                    <span className="total-label">Order Total</span>
                    <span className="total-amount">₹{order.total.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>
    </>
  );
}