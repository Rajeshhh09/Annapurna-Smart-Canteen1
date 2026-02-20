import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #faf9f6; }

  /* ── HEADER ── */
  .ord-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,122,51,0.1);
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  }
  .ord-header-inner {
    max-width: 1000px; margin: 0 auto;
    padding: 0.85rem 2rem;
    display: flex; align-items: center; justify-content: space-between;
  }
  .header-logo { display: flex; align-items: center; gap: 0.75rem; }
  .header-logo-icon {
    width: 40px; height: 40px;
    background: linear-gradient(145deg, #FF7A33, #FF5500);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(255,107,0,0.3); flex-shrink: 0;
  }
  .header-brand { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 800; color: #2d1f0e; line-height: 1; }
  .header-sub { font-size: 0.62rem; color: #FF7A33; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }
  .back-btn {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: #f5f5f0; border: 1.5px solid #e5e7eb; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 600; color: #374151;
    cursor: pointer; transition: all 0.2s ease;
  }
  .back-btn:hover { background: #fff; border-color: rgba(255,122,51,0.3); color: #FF7A33; }

  /* ── HERO ── */
  .orders-hero {
    background: linear-gradient(135deg, #2d1f0e 0%, #3d2a14 60%, #4a3020 100%);
    padding: 2.75rem 2rem;
    position: relative; overflow: hidden;
  }
  .orders-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(255,122,51,0.18) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 30%, rgba(255,107,0,0.12) 0%, transparent 55%);
  }
  .orders-hero-inner {
    max-width: 1000px; margin: 0 auto;
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
    flex-wrap: wrap;
  }
  .hero-left {}
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: rgba(255,122,51,0.2); border: 1px solid rgba(255,122,51,0.35);
    color: #FFAA77; font-size: 0.72rem; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; padding: 0.3rem 0.75rem; border-radius: 999px;
    margin-bottom: 0.75rem;
  }
  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.25rem; font-weight: 800; color: white; line-height: 1.15;
    margin-bottom: 0.5rem;
  }
  .hero-title span { color: #FF7A33; }
  .hero-sub { font-size: 0.88rem; color: rgba(255,255,255,0.55); }

  /* Hero stats */
  .hero-stats { display: flex; gap: 0.85rem; }
  .hero-stat {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px; padding: 0.9rem 1.25rem;
    backdrop-filter: blur(8px); text-align: center; min-width: 90px;
  }
  .hero-stat-val { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 800; color: white; line-height: 1; }
  .hero-stat-lbl { font-size: 0.68rem; color: rgba(255,255,255,0.5); font-weight: 600; letter-spacing: 0.5px; margin-top: 3px; text-transform: uppercase; }

  /* ── MAIN ── */
  .ord-main { max-width: 1000px; margin: 0 auto; padding: 2rem; }

  /* ── STATUS LEGEND ── */
  .status-legend {
    display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem;
  }
  .legend-pill {
    display: flex; align-items: center; gap: 0.4rem;
    padding: 0.4rem 0.9rem; border-radius: 999px;
    font-size: 0.78rem; font-weight: 600; cursor: pointer;
    border: 1.5px solid transparent; transition: all 0.2s ease;
  }
  .legend-pill.active { border-color: currentColor; }
  .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* ── ORDER CARD ── */
  .order-card {
    background: white; border-radius: 18px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    border: 1px solid rgba(0,0,0,0.05);
    overflow: hidden; margin-bottom: 1.25rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: fadeUp 0.4s ease both;
  }
  .order-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.1); }

  /* Card top strip by status */
  .card-strip { height: 4px; width: 100%; }
  .strip-Pending   { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
  .strip-Preparing { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  .strip-Ready     { background: linear-gradient(90deg, #16a34a, #4ade80); }
  .strip-Delivered { background: linear-gradient(90deg, #9ca3af, #d1d5db); }

  .card-top {
    padding: 1.15rem 1.5rem 0.9rem;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
    border-bottom: 1px solid #f5f5f0;
  }
  .card-order-id { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: #2d1f0e; }
  .card-time { font-size: 0.75rem; color: #b0b8c1; margin-top: 3px; display: flex; align-items: center; gap: 0.3rem; }

  .status-badge {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.5px;
    text-transform: uppercase; padding: 0.35rem 0.85rem; border-radius: 999px;
    white-space: nowrap; flex-shrink: 0;
  }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; }
  .badge-Pending   { background: #fef3c7; color: #d97706; }
  .dot-Pending   { background: #f59e0b; }
  .badge-Preparing { background: #dbeafe; color: #2563eb; animation: pulseBadge 1.5s ease-in-out infinite; }
  .dot-Preparing { background: #3b82f6; }
  .badge-Ready     { background: #dcfce7; color: #16a34a; }
  .dot-Ready     { background: #22c55e; }
  .badge-Delivered { background: #f3f4f6; color: #6b7280; }
  .dot-Delivered { background: #9ca3af; }

  /* Progress tracker */
  .progress-wrap { padding: 1.1rem 1.5rem; border-bottom: 1px solid #f5f5f0; }
  .progress-track {
    display: flex; align-items: center; gap: 0;
    position: relative;
  }
  .progress-step {
    display: flex; flex-direction: column; align-items: center;
    flex: 1; position: relative; z-index: 1;
  }
  .step-circle {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 700; border: 2px solid #e5e7eb;
    background: white; color: #d1d5db; transition: all 0.3s ease;
    position: relative; z-index: 2;
  }
  .step-circle.done { background: linear-gradient(135deg, #FF7A33, #FF5500); border-color: #FF7A33; color: white; box-shadow: 0 4px 10px rgba(255,107,0,0.35); }
  .step-circle.active { background: white; border-color: #FF7A33; color: #FF7A33; box-shadow: 0 0 0 4px rgba(255,122,51,0.15); }
  .step-label { font-size: 0.68rem; font-weight: 600; color: #9ca3af; margin-top: 5px; white-space: nowrap; }
  .step-label.done, .step-label.active { color: #FF7A33; }
  .step-line {
    position: absolute; top: 16px; left: calc(50% + 16px);
    height: 2px; width: calc(100% - 32px);
    background: #e5e7eb; z-index: 1;
    transition: background 0.3s ease;
  }
  .step-line.done { background: linear-gradient(90deg, #FF7A33, #FF5500); }

  /* Card body */
  .card-body { padding: 1.1rem 1.5rem; }
  .delivery-row {
    display: flex; gap: 1.5rem; flex-wrap: wrap;
    background: #faf9f6; border-radius: 10px; padding: 0.75rem 1rem;
    margin-bottom: 1rem; border: 1px solid #f0f0f0;
  }
  .delivery-item { display: flex; align-items: flex-start; gap: 0.4rem; }
  .delivery-icon { font-size: 0.85rem; flex-shrink: 0; margin-top: 1px; }
  .delivery-label { font-size: 0.72rem; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
  .delivery-val { font-size: 0.83rem; color: #374151; font-weight: 600; margin-top: 1px; }

  /* Items */
  .items-header { font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.6rem; }
  .item-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.5rem 0; border-bottom: 1px solid #f9f9f7;
  }
  .item-row:last-child { border-bottom: none; }
  .item-left { display: flex; align-items: center; gap: 0.5rem; }
  .item-qty-badge {
    background: #fff3ec; color: #FF7A33;
    font-size: 0.72rem; font-weight: 800;
    width: 22px; height: 22px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .item-name { font-size: 0.88rem; font-weight: 500; color: #374151; }
  .item-price { font-size: 0.88rem; font-weight: 700; color: #1f2937; }

  /* Total */
  .card-footer {
    padding: 0.9rem 1.5rem;
    background: #fdf9f5;
    border-top: 1px solid #f5f5f0;
    display: flex; justify-content: space-between; align-items: center;
  }
  .total-label { font-size: 0.85rem; color: #9ca3af; font-weight: 500; }
  .total-amount { font-family: 'Playfair Display', serif; font-size: 1.35rem; font-weight: 800; color: #FF7A33; }

  /* ── EMPTY STATE ── */
  .empty-wrap {
    text-align: center; padding: 5rem 2rem;
    background: white; border-radius: 20px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    border: 1px solid rgba(255,122,51,0.08);
  }
  .empty-bowl {
    width: 80px; height: 80px;
    background: linear-gradient(145deg, #FF7A33, #FF5500);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem;
    box-shadow: 0 8px 24px rgba(255,107,0,0.3);
  }
  .empty-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; color: #2d1f0e; margin-bottom: 0.5rem; }
  .empty-sub { font-size: 0.9rem; color: #9ca3af; margin-bottom: 1.5rem; }
  .order-now-btn {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.8rem 1.75rem;
    background: linear-gradient(135deg, #FF7A33, #FF5500);
    color: white; border: none; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(255,107,0,0.35);
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .order-now-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,107,0,0.4); }

  /* ── LOADING ── */
  .loading-root {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 1rem;
    background: #faf9f6; font-family: 'DM Sans', sans-serif;
  }
  .loading-text { font-size: 0.9rem; color: #9ca3af; font-weight: 500; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseBadge {
    0%, 100% { opacity: 1; } 50% { opacity: 0.7; }
  }
  @keyframes steamRise {
    0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.9; }
    50% { transform: translateY(-3px) scaleX(0.8); opacity: 0.5; }
  }
  .steam-1 { animation: steamRise 1.8s ease-in-out infinite; }
  .steam-2 { animation: steamRise 1.8s ease-in-out 0.35s infinite; }
  .steam-3 { animation: steamRise 1.8s ease-in-out 0.7s infinite; }
`;

const STEPS = ['Pending', 'Preparing', 'Ready', 'Delivered'];
const STEP_ICONS = { Pending: '🕐', Preparing: '👨‍🍳', Ready: '✅', Delivered: '🎉' };

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
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={step} className="progress-step">
              {i < STEPS.length - 1 && (
                <div className={`step-line${isDone || isActive ? ' done' : ''}`} />
              )}
              <div className={`step-circle${isDone ? ' done' : isActive ? ' active' : ''}`}>
                {isDone ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                ) : (
                  <span>{STEP_ICONS[step]}</span>
                )}
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/user/${user.uid}`);
        setOrders(res.data);
      } catch (e) {
        if (e.response?.status !== 404) console.error(e);
      } finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const FILTERS = ['All', ...STEPS];
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);
  const activeCount = orders.filter(o => o.status !== 'Delivered').length;

  const FILTER_COLORS = {
    All: { bg: '#f5f5f0', text: '#374151', dot: '#9ca3af', activeBg: '#2d1f0e', activeText: 'white' },
    Pending:   { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
    Preparing: { bg: '#dbeafe', text: '#2563eb', dot: '#3b82f6' },
    Ready:     { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
    Delivered: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
  };

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="loading-root">
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px dashed rgba(255,122,51,0.3)', animation: 'spin 20s linear infinite' }} />
          <div style={{ width: 80, height: 80, background: 'linear-gradient(145deg,#FF7A33,#FF5500)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(255,107,0,0.35)' }}>
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
          </div>
        </div>
        <p className="loading-text">Loading your orders…</p>
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>

      {/* ── HEADER ── */}
      <header className="ord-header">
        <div className="ord-header-inner">
          <div className="header-logo">
            <div className="header-logo-icon">
              <svg width="24" height="24" viewBox="0 0 52 52" fill="none">
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
          <div className="hero-left">
            <div className="hero-eyebrow">✦ Order Tracking</div>
            <h1 className="hero-title">My <span>Orders</span></h1>
            <p className="hero-sub">{activeCount > 0 ? `${activeCount} active order${activeCount > 1 ? 's' : ''} in progress` : 'All your food orders in one place'}</p>
          </div>
          {orders.length > 0 && (
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-val">{orders.length}</div>
                <div className="hero-stat-lbl">Total</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-val">{orders.filter(o => o.status === 'Pending').length}</div>
                <div className="hero-stat-lbl">Pending</div>
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
            <div className="empty-bowl">
              <svg width="44" height="44" viewBox="0 0 52 52" fill="none">
                <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z" fill="white"/>
                <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
                <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.3)"/>
                <circle cx="26" cy="34" r="2.5" fill="rgba(255,107,0,0.5)"/>
                <ellipse cx="26" cy="42.5" rx="18" ry="2.5" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
            <div className="empty-title">No orders yet</div>
            <div className="empty-sub">Place your first order and track it live right here</div>
            <button className="order-now-btn" onClick={() => navigate('/menu')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
              </svg>
              Browse the Menu
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
                      background: isActive ? (f === 'All' ? '#2d1f0e' : c.bg) : 'white',
                      color: isActive ? (f === 'All' ? 'white' : c.text) : '#6b7280',
                      borderColor: isActive ? c.dot : '#e5e7eb',
                    }}
                    onClick={() => setFilter(f)}
                  >
                    {f !== 'All' && <span className="legend-dot" style={{ background: c.dot }} />}
                    {f} {count > 0 && <span style={{ fontWeight: 800 }}>({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* Order cards */}
            {filtered.map((order, idx) => {
              const ts = formatTimestamp(order.timestamp);
              return (
                <div key={order.id} className="order-card" style={{ animationDelay: `${idx * 0.06}s` }}>
                  {/* Status strip */}
                  <div className={`card-strip strip-${order.status}`} />

                  {/* Top */}
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
                    <span className={`status-badge badge-${order.status}`}>
                      <span className={`status-dot dot-${order.status}`} />
                      {order.status}
                    </span>
                  </div>

                  {/* Progress tracker */}
                  <ProgressTracker status={order.status} />

                  {/* Body */}
                  <div className="card-body">
                    {/* Delivery info */}
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

                    {/* Items */}
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

                  {/* Footer */}
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