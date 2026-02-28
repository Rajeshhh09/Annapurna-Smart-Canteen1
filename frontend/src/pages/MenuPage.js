import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const API = 'https://annapurna-smart-canteen1.onrender.com';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const calcPoints  = (total) => Math.floor(total / 100) * 10;
const CATEGORY_PREP = { Breakfast: 12, Lunch: 15, Snacks: 8, Beverages: 5, Desserts: 10 };
const calcETA = (cartItems, menuItems) => {
  if (!cartItems.length) return null;
  const times = cartItems.map(ci => {
    const m = menuItems.find(m => m.id === ci.id);
    return m?.prepTime || CATEGORY_PREP[m?.category] || 10;
  });
  return `${Math.max(...times) + 3}–${Math.max(...times) + 8} mins`;
};
const getTier = (pts) => {
  if (pts >= 500) return { name: 'Gold',   color: '#ff8800', bg: '#fef3c7', icon: '🥇' };
  if (pts >= 200) return { name: 'Silver', color: '#6b7280', bg: '#f3f4f6', icon: '🥈' };
  return               { name: 'Bronze', color: '#b45309', bg: '#fef9ee', icon: '🥉' };
};
const saveCart = (c) => { try { localStorage.setItem('cart', JSON.stringify(c)); } catch (_) {} };
const loadCart = () => { try { const s = localStorage.getItem('cart'); return s ? JSON.parse(s) : []; } catch (_) { return []; } };
const getLS = (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } };
const setLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };
const CAT_ICONS = { All: '🍽️', Breakfast: '🌅', Lunch: '🍱', Snacks: '🥨', Beverages: '🥤', Desserts: '🍮' };
const formatDate = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

// ─── Payment confirmed sound ──────────────────────────────────────────────────
function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = 'sine';
      g.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
      o.start(ctx.currentTime + i * 0.12);
      o.stop(ctx.currentTime + i * 0.12 + 0.25);
    });
  } catch (_) {}
}

// ─── Receipt Download ─────────────────────────────────────────────────────────
function downloadReceipt(order) {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Receipt – Annapurna Smart Canteen</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f8f6f2;display:flex;justify-content:center;padding:20px 10px}
  .receipt{width:390px;max-width:100%;background:white;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.09)}
  .top-bar{display:flex;justify-content:space-between;align-items:center;padding:14px 22px;font-size:13px;color:#666;border-bottom:1px solid #f0ede8}
  .logo-section{padding:32px 20px 20px;text-align:center}
  .brand{font-family:'Playfair Display',serif;font-size:29px;font-weight:800;color:#2d1f0e}
  .brand-sub{font-size:11.8px;font-weight:700;letter-spacing:3.2px;color:#FF7A33;text-transform:uppercase}
  .success{background:#f0fdf4;color:#166534;padding:16px;text-align:center;font-weight:600;font-size:15.5px;display:flex;align-items:center;justify-content:center;gap:10px;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb}
  .order-meta{display:flex;justify-content:space-between;padding:22px 22px 18px;border-bottom:2px dashed #e5e7eb}
  .order-id{font-size:18px;font-weight:700;color:#1f2937;letter-spacing:1.2px;margin-top:3px}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 22px 22px}
  .info-box{background:#faf9f6;border:1px solid #ede8e0;border-radius:14px;padding:14px 16px}
  .info-label{font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px}
  .info-val{font-size:14.5px;font-weight:500;color:#374151;line-height:1.45}
  .pay-row{margin:0 22px 18px;background:#f5f5f0;border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
  .upi-badge{background:linear-gradient(135deg,#FF7A33,#FF5500);color:white;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px}
  .cod-badge{background:linear-gradient(135deg,#16a34a,#15803d);color:white;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px}
  .items-section{padding:0 22px}
  .item-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid #f3f4f6}
  .totals{margin:22px;background:#faf9f6;border:1px solid #ede8e0;border-radius:16px;padding:18px 20px}
  .total-line{display:flex;justify-content:space-between;font-size:14.5px;color:#6b7280;padding:7px 0}
  .total-line.grand{border-top:2px solid #fed7aa;margin-top:8px;padding-top:14px;font-size:17.5px;color:#2d1f0e}
  .thankyou{text-align:center;padding:30px 22px 40px;color:#6b7280;font-size:15px}
  .footer{text-align:center;padding:18px 22px;font-size:11.5px;color:#9ca3af;border-top:1px solid #f3f4f6;line-height:1.6}
  @media print{body{background:white;padding:0}.receipt{box-shadow:none;border-radius:0;width:100%}}
</style></head><body><div class="receipt">
<div class="top-bar"><div>${new Date().toLocaleDateString('en-IN')}, ${new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}</div><div style="font-weight:600;color:#1f2937">Annapurna Smart Canteen</div></div>
<div class="logo-section"><div class="brand">Annapurna</div><div class="brand-sub">SMART CANTEEN</div></div>
<div class="success">✓ Order Confirmed Successfully!</div>
<div class="order-meta"><div><div style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase">ORDER ID</div><div class="order-id">#${order.orderId.slice(-8).toUpperCase()}</div></div><div style="text-align:right;font-size:13.5px;color:#6b7280"><div>${formatDate(order.date)}</div><div>${formatTime(order.date)}</div></div></div>
<div class="info-grid"><div class="info-box"><div class="info-label">👤 RECIPIENT</div><div class="info-val">${order.deliveryName}</div></div><div class="info-box"><div class="info-label">📍 DELIVERY TO</div><div class="info-val">${order.deliveryLocation}</div></div></div>
<div class="pay-row"><span style="font-size:13px;font-weight:600;color:#374151">💳 Payment</span>${order.paymentMethod==='upi'?'<span class="upi-badge">📱 UPI Prepaid</span>':'<span class="cod-badge">💵 Cash on Delivery</span>'}</div>
${order.eta?`<div style="margin:0 22px 22px;background:#fef3c7;border:1px solid #fcd34d;border-radius:14px;padding:14px 18px;font-size:14.5px;font-weight:600;color:#d97706">⏱ Estimated: <strong>${order.eta}</strong></div>`:''}
<div class="items-section"><div style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f3f4f6">ITEMS ORDERED</div>
${order.items.map(item=>`<div class="item-row"><div style="display:flex;align-items:center;gap:14px"><div style="font-size:17px;font-weight:700;color:#FF7A33">${item.quantity}</div><div><div style="font-weight:600;color:#1f2937">${item.name}</div><div style="font-size:12.5px;color:#9ca3af">₹${item.price.toFixed(2)} each</div></div></div><div style="font-size:15.5px;font-weight:700">₹${(item.price*item.quantity).toFixed(2)}</div></div>`).join('')}
</div>
<div class="totals"><div class="total-line"><span>Subtotal</span><span>₹${order.total.toFixed(2)}</span></div><div class="total-line"><span>Delivery</span><span style="color:#15803d;font-weight:700">FREE</span></div><div class="total-line grand"><span style="font-weight:700">${order.paymentMethod==='upi'?'Total Paid':'Total to Pay'}</span><span style="color:#FF7A33;font-weight:800">₹${order.total.toFixed(2)}</span></div></div>
${order.pointsEarned>0?`<div style="margin:0 22px 22px;background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between"><div style="font-size:14.5px;color:#9ca3af">You earned <strong style="color:#c2410c">+${order.pointsEarned} loyalty points</strong>!</div><div style="background:#FF7A33;color:white;padding:6px 18px;border-radius:9999px;font-size:13px;font-weight:700">⭐ ${order.pointsEarned} pts</div></div>`:''}
<div class="thankyou">🙏 <strong style="color:#FF7A33">Thank You!</strong><br>${order.paymentMethod==='upi'?'Your payment was received. Food is being <strong>prepared with love</strong>.':'Please keep <strong>₹'+order.total.toFixed(2)+' ready</strong> for cash payment on delivery.'}<br>We hope to see you again at Annapurna Smart Canteen!</div>
<div class="footer">Annapurna Smart Canteen • SURAT, Gujarat<br>Support: Annapurna@canteen.edu.in<br>© ${new Date().getFullYear()} All rights reserved</div>
</div></body></html>`;
  const w = window.open('','_blank','width=650,height=920');
  w.document.write(html); w.document.close();
  w.onload = () => setTimeout(() => { w.focus(); w.print(); }, 700);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (dark, largeFontSize, compactMode) => `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: ${dark ? '#111827' : '#faf9f6'};
  --bg2: ${dark ? '#1f2937' : '#ffffff'};
  --bg3: ${dark ? '#374151' : '#f5f5f0'};
  --bg4: ${dark ? '#2d3748' : '#faf9f6'};
  --border: ${dark ? '#374151' : '#e5e7eb'};
  --border2: ${dark ? '#4b5563' : '#ede8e0'};
  --text: ${dark ? '#f9fafb' : '#1f2937'};
  --text2: ${dark ? '#d1d5db' : '#374151'};
  --text3: ${dark ? '#9ca3af' : '#6b7280'};
  --text4: ${dark ? '#6b7280' : '#9ca3af'};
  --orange: #FF7A33;
  --orange2: #FF5500;
  --card-shadow: ${dark ? '0 2px 12px rgba(0,0,0,.35)' : '0 2px 12px rgba(0,0,0,.06)'};
  --card-img-h: ${compactMode ? '120px' : '155px'};
  --card-pad: ${compactMode ? '.75rem' : '1rem'};
  font-size: ${largeFontSize ? '17px' : '16px'};
}
body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); transition: background .3s, color .3s; }

/* ── HEADER ── */
.mhdr { position: sticky; top: 0; z-index: 200; background: ${dark ? 'rgba(17,24,39,0.96)' : 'rgba(255,255,255,0.95)'}; backdrop-filter: blur(14px); border-bottom: 1px solid ${dark ? 'rgba(255,122,51,0.2)' : 'rgba(255,122,51,0.1)'}; box-shadow: 0 2px 24px rgba(0,0,0,${dark ? '.25' : '.07'}); }
.mhdr-in { max-width: 1400px; margin: 0 auto; padding: .8rem 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.logo-wrap { display: flex; align-items: center; gap: .75rem; }
.logo-icon { width: 42px; height: 42px; background: linear-gradient(145deg,#FF7A33,#FF5500); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(255,107,0,.35); flex-shrink: 0; }
.logo-brand { font-family: 'Playfair Display',serif; font-size: 1.2rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; line-height: 1; }
.logo-sub { font-size: .62rem; color: #FF7A33; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }
.nav-right { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; }
.nav-btn { display: flex; align-items: center; gap: .4rem; padding: .48rem .95rem; background: var(--bg3); border: 1.5px solid transparent; border-radius: 10px; font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 600; color: var(--text2); cursor: pointer; transition: all .2s; white-space: nowrap; }
.nav-btn:hover { background: var(--bg2); border-color: rgba(255,122,51,.3); color: #FF7A33; }
.nav-btn.active { background: ${dark ? 'rgba(255,122,51,.2)' : '#fff3ec'}; border-color: rgba(255,122,51,.4); color: #FF7A33; }
.nav-btn.logout { background: ${dark ? 'rgba(220,38,38,.15)' : '#fff1f0'}; color: #dc2626; border-color: rgba(220,38,38,.2); }
.nav-btn.settings-btn { background: ${dark ? 'rgba(255,122,51,.15)' : '#fff3ec'}; color: #FF7A33; border-color: rgba(255,122,51,.3); }
.user-chip { display: flex; align-items: center; gap: .5rem; background: ${dark ? 'rgba(255,122,51,.12)' : 'linear-gradient(135deg,#fff3ec,#fef9f5)'}; border: 1.5px solid rgba(255,122,51,.35); border-radius: 12px; padding: .4rem .85rem; }
.user-avatar { width: 28px; height: 28px; border-radius: '50%'; background: linear-gradient(135deg,#FF7A33,#FF5500); display: flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 800; color: white; flex-shrink: 0; box-shadow: 0 2px 8px rgba(255,107,0,.35); }
.user-name { font-size: .82rem; font-weight: 700; color: #FF7A33; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loy-chip { display: flex; align-items: center; gap: .5rem; background: ${dark ? 'rgba(255,255,255,.05)' : 'white'}; border: 1.5px solid var(--border); border-radius: 12px; padding: .4rem .85rem; }
.loy-pts { font-size: .85rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; }
.loy-lbl { font-size: .68rem; color: var(--text4); font-weight: 500; }
.cart-trigger { position: relative; display: flex; align-items: center; gap: .5rem; padding: .5rem 1.15rem; background: linear-gradient(135deg,#FF7A33,#FF5500); border: none; border-radius: 10px; font-family: 'DM Sans',sans-serif; font-size: .85rem; font-weight: 700; color: white; cursor: pointer; box-shadow: 0 4px 14px rgba(255,107,0,.35); transition: all .2s; }
.cart-trigger:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(255,107,0,.45); }
.cart-badge { position: absolute; top: -8px; right: -8px; background: #2d1f0e; color: white; font-size: .68rem; font-weight: 800; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid ${dark ? '#111827' : 'white'}; }

/* ── LOYALTY BANNER ── */
.loy-banner { background: linear-gradient(135deg,#2d1f0e,#3d2a14,#4a3020); padding: 1rem 2rem; position: relative; overflow: hidden; }
.loy-banner::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 15% 50%,rgba(255,122,51,.2),transparent 55%); }
.loy-inner { max-width: 1400px; margin: 0 auto; position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
.loy-tier-badge { padding: .28rem .75rem; border-radius: 999px; font-size: .72rem; font-weight: 800; letter-spacing: .5px; }
.loy-pts-big { font-family: 'Playfair Display',serif; font-size: 1.4rem; font-weight: 800; color: white; line-height: 1; }
.loy-pts-lbl { font-size: .7rem; color: rgba(255,255,255,.5); font-weight: 500; }
.loy-prog-bar { height: 5px; background: rgba(255,255,255,.15); border-radius: 999px; overflow: hidden; margin-top: 5px; }
.loy-prog-fill { height: 100%; background: linear-gradient(90deg,#FF7A33,#FF5500); border-radius: 999px; transition: width .8s ease; }
.loy-tip { font-size: .7rem; color: rgba(255,255,255,.55); }
.loy-tip span { color: #FFAA77; font-weight: 700; }

/* ── HERO ── */
.mhero { background: linear-gradient(135deg,#2d1f0e,#3d2a14,#4a3020); padding: 2.75rem 2rem; text-align: center; position: relative; overflow: hidden; }
.mhero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 50%,rgba(255,122,51,.15),transparent 60%); }
.hero-in { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
.hero-eye { display: inline-flex; align-items: center; gap: .5rem; background: rgba(255,122,51,.2); border: 1px solid rgba(255,122,51,.35); color: #FFAA77; font-size: .72rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: .3rem .8rem; border-radius: 999px; margin-bottom: .85rem; }
.hero-title { font-family: 'Playfair Display',serif; font-size: 2.6rem; font-weight: 800; color: white; line-height: 1.1; margin-bottom: .6rem; }
.hero-title span { color: #FF7A33; }
.hero-sub { font-size: .95rem; color: rgba(255,255,255,.55); }

/* ── PAGE BODY ── */
.page-body { display: flex; align-items: flex-start; }
.menu-area { flex: 1; min-width: 0; }
.mmain { padding: 2rem 2rem 3rem; }
.search-wrap { position: relative; margin-bottom: 1.5rem; }
.search-ico { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text4); pointer-events: none; }
.search-inp { width: 100%; padding: .85rem 1rem .85rem 2.75rem; border: 1.5px solid var(--border); border-radius: 12px; font-family: 'DM Sans',sans-serif; font-size: .95rem; color: var(--text); background: var(--bg2); outline: none; box-shadow: 0 2px 8px rgba(0,0,0,.04); transition: border-color .2s,box-shadow .2s; }
.search-inp:focus { border-color: #FF7A33; box-shadow: 0 0 0 3px rgba(255,122,51,.12); }
.search-inp::placeholder { color: var(--text4); }
.cat-row { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 2rem; }
.cat-pill { padding: .48rem 1.1rem; background: var(--bg2); border: 1.5px solid var(--border); border-radius: 999px; font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 600; color: var(--text3); cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: .3rem; }
.cat-pill:hover { border-color: rgba(255,122,51,.4); color: #FF7A33; }
.cat-pill.active { background: linear-gradient(135deg,#FF7A33,#FF5500); border-color: transparent; color: white; box-shadow: 0 4px 12px rgba(255,107,0,.3); }
.sec-label { font-family: 'Playfair Display',serif; font-size: 1.3rem; font-weight: 700; color: ${dark ? '#f9fafb' : '#2d1f0e'}; margin-bottom: 1.1rem; display: flex; align-items: center; gap: .6rem; }
.sec-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

/* ── CARDS ── */
.mgrid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 1.25rem; }
.mcard { background: var(--bg2); border-radius: 16px; box-shadow: var(--card-shadow); border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; transition: transform .22s,box-shadow .22s; }
.mcard:not(.oos):hover { transform: translateY(-4px); box-shadow: ${dark ? '0 12px 30px rgba(0,0,0,.35)' : '0 12px 30px rgba(0,0,0,.1)'}; }
.mcard.oos { opacity: .7; }
.cimg-wrap { position: relative; height: var(--card-img-h); overflow: hidden; }
.cimg { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.mcard:not(.oos):hover .cimg { transform: scale(1.06); }
.oos-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.oos-tag { background: #ef4444; color: white; font-size: .78rem; font-weight: 800; padding: .35rem .9rem; border-radius: 999px; letter-spacing: 1px; text-transform: uppercase; }
.cbadge { position: absolute; top: .55rem; left: .55rem; background: rgba(20,12,0,.78); backdrop-filter: blur(6px); color: white; font-size: .65rem; font-weight: 700; padding: .22rem .55rem; border-radius: 5px; letter-spacing: .5px; text-transform: uppercase; }
.cprice { position: absolute; top: .55rem; right: .55rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; font-size: .85rem; font-weight: 800; padding: .28rem .62rem; border-radius: 7px; box-shadow: 0 3px 10px rgba(255,107,0,.4); }
.cbody { padding: var(--card-pad) var(--card-pad) 1rem; flex: 1; display: flex; flex-direction: column; }
.cname { font-size: .97rem; font-weight: 700; color: var(--text); margin-bottom: .25rem; line-height: 1.3; }
.cdesc { font-size: .78rem; color: var(--text3); line-height: 1.45; flex: 1; margin-bottom: .55rem; }
.prep-pill { display: inline-flex; align-items: center; gap: .28rem; font-size: .7rem; font-weight: 600; color: var(--text3); background: var(--bg3); padding: .22rem .55rem; border-radius: 5px; margin-bottom: .7rem; }
.card-bottom { display: flex; align-items: center; gap: .55rem; }
.add-btn { flex: 1; padding: .62rem .5rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; border: none; border-radius: 9px; font-family: 'DM Sans',sans-serif; font-size: .83rem; font-weight: 700; cursor: pointer; box-shadow: 0 3px 10px rgba(255,107,0,.25); transition: transform .15s,box-shadow .15s; display: flex; align-items: center; justify-content: center; gap: .35rem; }
.add-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(255,107,0,.4); }
.add-btn:disabled { background: var(--bg3); color: var(--text4); box-shadow: none; transform: none; cursor: not-allowed; }
.qty-ctrl { display: flex; align-items: center; gap: .3rem; background: var(--bg3); border-radius: 9px; padding: .3rem .4rem; flex: 1; justify-content: center; }
.qty-btn { width: 28px; height: 28px; border: none; border-radius: 7px; background: var(--bg2); color: var(--text2); font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,.1); transition: all .15s; line-height: 1; }
.qty-btn:hover { background: #FF7A33; color: white; }
.qty-num { font-size: .9rem; font-weight: 800; color: #FF7A33; min-width: 22px; text-align: center; }

/* ── CART DRAWER ── */
.cart-drawer { width: 0; overflow: hidden; position: sticky; top: 73px; height: calc(100vh - 73px); transition: width .35s cubic-bezier(.4,0,.2,1); flex-shrink: 0; background: var(--bg2); border-left: 1px solid var(--border2); box-shadow: -4px 0 24px rgba(0,0,0,${dark ? '.3' : '.07'}); display: flex; flex-direction: column; }
.cart-drawer.open { width: 400px; }
.drawer-inner { width: 400px; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.drawer-hdr { background: linear-gradient(135deg,#2d1f0e,#3d2a14); padding: 1.1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.drawer-title { font-family: 'Playfair Display',serif; font-size: 1.1rem; font-weight: 700; color: white; display: flex; align-items: center; gap: .5rem; }
.drawer-cnt { background: rgba(255,122,51,.35); color: #FFAA77; font-size: .72rem; font-weight: 800; padding: .18rem .5rem; border-radius: 999px; }
.drawer-close { background: rgba(255,255,255,.12); border: none; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; color: rgba(255,255,255,.7); font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
.drawer-close:hover { background: rgba(255,255,255,.22); color: white; }
.eta-strip { background: ${dark ? 'rgba(255,122,51,.12)' : 'rgba(255,122,51,.08)'}; border-bottom: 1px solid rgba(255,122,51,.12); padding: .55rem 1.25rem; display: flex; align-items: center; gap: .5rem; font-size: .78rem; font-weight: 600; color: #FF7A33; flex-shrink: 0; }
.drawer-items { flex: 1; overflow-y: auto; padding: .75rem 1.25rem; }
.drawer-items::-webkit-scrollbar { width: 4px; }
.drawer-items::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.cart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: .75rem; color: var(--text4); text-align: center; }
.ci-row { display: flex; align-items: flex-start; gap: .75rem; padding: .85rem 0; border-bottom: 1px solid var(--border); animation: fadeUp .25s ease; }
.ci-row:last-child { border-bottom: none; }
.ci-img { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0; border: 1px solid var(--border); }
.ci-info { flex: 1; min-width: 0; }
.ci-name { font-size: .88rem; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: .2rem; }
.ci-unit { font-size: .72rem; color: var(--text4); }
.ci-remove-btn { font-size: .68rem; color: var(--text4); background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; margin-top: 3px; display: block; }
.ci-remove-btn:hover { color: #ef4444; }
.ci-right { display: flex; flex-direction: column; align-items: flex-end; gap: .45rem; }
.ci-price { font-size: .92rem; font-weight: 800; color: #FF7A33; }
.ci-qty-ctrl { display: flex; align-items: center; gap: .3rem; }
.ci-qty-btn { width: 26px; height: 26px; border-radius: 7px; border: 1.5px solid var(--border); background: var(--bg2); font-size: .9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; color: var(--text2); }
.ci-qty-btn:hover { border-color: #FF7A33; color: #FF7A33; }
.ci-qty-btn.rem { border-color: #fecaca; color: #ef4444; }
.ci-qty-btn.rem:hover { background: #ef4444; color: white; border-color: #ef4444; }
.ci-qty-num { font-size: .88rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; min-width: 20px; text-align: center; }
.drawer-footer { flex-shrink: 0; border-top: 1px solid var(--border2); padding: 1rem 1.25rem 1.25rem; }
.pts-preview { background: ${dark ? 'rgba(255,122,51,.1)' : 'linear-gradient(135deg,#fff3ec,#fef9f5)'}; border: 1px solid rgba(255,122,51,.2); border-radius: 10px; padding: .65rem 1rem; margin-bottom: .85rem; display: flex; align-items: center; justify-content: space-between; }
.pts-preview-l { font-size: .78rem; color: var(--text3); }
.pts-preview-l span { font-weight: 700; color: #FF7A33; }
.pts-earn-badge { background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; font-size: .72rem; font-weight: 800; padding: .25rem .65rem; border-radius: 999px; }
.total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: .85rem; }
.total-lbl { font-family: 'Playfair Display',serif; font-size: 1.05rem; font-weight: 700; color: ${dark ? '#f9fafb' : '#2d1f0e'}; }
.total-amt { font-family: 'Playfair Display',serif; font-size: 1.3rem; font-weight: 800; color: #FF7A33; }
.clear-cart-btn { width: 100%; padding: .55rem; background: ${dark ? 'rgba(220,38,38,.15)' : '#fff1f0'}; border: 1.5px solid rgba(220,38,38,.2); border-radius: 9px; color: #dc2626; font-family: 'DM Sans',sans-serif; font-size: .8rem; font-weight: 700; cursor: pointer; margin-bottom: .65rem; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: .4rem; }
.clear-cart-btn:hover { background: #dc2626; color: white; }
.checkout-btn { width: 100%; padding: .85rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; border: none; border-radius: 11px; font-family: 'DM Sans',sans-serif; font-size: .95rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(255,107,0,.3); transition: all .15s; display: flex; align-items: center; justify-content: center; gap: .5rem; }
.checkout-btn:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(255,107,0,.4); }

/* ── MODALS ── */
.modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(5px); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 1.5rem; animation: fadeIn .2s ease; }
.modal-box { background: var(--bg2); border-radius: 22px; box-shadow: 0 24px 70px rgba(0,0,0,${dark ? '.5' : '.2'}); width: 500px; max-width: 95vw; max-height: 92vh; overflow-y: auto; animation: scaleIn .25s ease; }
.modal-box::-webkit-scrollbar { width: 4px; }
.modal-box::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.modal-hdr { background: linear-gradient(135deg,#2d1f0e,#3d2a14); padding: 1.35rem 1.75rem; display: flex; align-items: center; justify-content: space-between; border-radius: 22px 22px 0 0; position: sticky; top: 0; z-index: 1; }
.modal-title { font-family: 'Playfair Display',serif; font-size: 1.25rem; font-weight: 700; color: white; }
.modal-close { background: rgba(255,255,255,.12); border: none; border-radius: 9px; width: 32px; height: 32px; cursor: pointer; color: white; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: rgba(255,255,255,.22); }
.modal-body { padding: 1.5rem 1.75rem; }
.modal-summary { background: var(--bg4); border: 1px solid var(--border2); border-radius: 12px; padding: 1rem 1.1rem; margin-bottom: 1.25rem; }
.modal-sum-title { font-size: .8rem; font-weight: 700; color: var(--text4); text-transform: uppercase; letter-spacing: .5px; margin-bottom: .65rem; }
.modal-item { display: flex; justify-content: space-between; padding: .35rem 0; font-size: .85rem; border-bottom: 1px solid var(--border); }
.modal-item:last-child { border-bottom: none; }
.modal-total-row { display: flex; justify-content: space-between; margin-top: .85rem; padding-top: .85rem; border-top: 2px solid #FF7A33; }
.modal-total-lbl { font-family: 'Playfair Display',serif; font-size: 1rem; font-weight: 700; color: ${dark ? '#f9fafb' : '#2d1f0e'}; }
.modal-total-amt { font-family: 'Playfair Display',serif; font-size: 1.2rem; font-weight: 800; color: #FF7A33; }
.modal-eta-row { display: flex; align-items: center; gap: .5rem; background: ${dark ? 'rgba(217,119,6,.15)' : '#fef3c7'}; border-radius: 8px; padding: .5rem .85rem; margin-top: .65rem; font-size: .8rem; font-weight: 600; color: #d97706; }
.form-section-title { font-size: .88rem; font-weight: 700; color: var(--text2); margin-bottom: .75rem; display: flex; align-items: center; gap: .4rem; margin-top: 1.25rem; }
.fld { margin-bottom: .75rem; }
.fld label { font-size: .78rem; font-weight: 600; color: var(--text3); display: block; margin-bottom: .3rem; }
.fld input, .fld textarea { width: 100%; padding: .75rem 1rem; border: 1.5px solid var(--border); border-radius: 10px; font-family: 'DM Sans',sans-serif; font-size: .9rem; color: var(--text); background: ${dark ? '#374151' : 'white'}; outline: none; transition: border-color .2s,box-shadow .2s; }
.fld input:focus, .fld textarea:focus { border-color: #FF7A33; box-shadow: 0 0 0 3px rgba(255,122,51,.12); }
.fld input::placeholder, .fld textarea::placeholder { color: var(--text4); }
.fld textarea { resize: none; }
.modal-actions { display: flex; gap: .75rem; margin-top: 1.25rem; }
.cancel-btn { padding: .9rem 1.35rem; background: var(--bg3); border: 1.5px solid var(--border); border-radius: 11px; font-family: 'DM Sans',sans-serif; font-size: .9rem; font-weight: 600; color: var(--text3); cursor: pointer; }
.cancel-btn:hover { border-color: #FF7A33; color: #FF7A33; }
.action-btn-orange { flex: 1; padding: .9rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; border: none; border-radius: 11px; font-family: 'DM Sans',sans-serif; font-size: .9rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(255,107,0,.3); display: flex; align-items: center; justify-content: center; gap: .4rem; transition: all .15s; }
.action-btn-orange:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(255,107,0,.4); }
.action-btn-orange:disabled { background: var(--bg3); color: var(--text4); box-shadow: none; cursor: not-allowed; transform: none; }
.action-btn-green { flex: 1; padding: .9rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; border: none; border-radius: 11px; font-family: 'DM Sans',sans-serif; font-size: .9rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(255,107,0,.35); display: flex; align-items: center; justify-content: center; gap: .4rem; transition: all .4s ease; }
.action-btn-green:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(255,107,0,.45); }
.action-btn-locked { flex: 1; padding: .9rem; background: var(--bg3); color: var(--text4); border: none; border-radius: 11px; font-family: 'DM Sans',sans-serif; font-size: .9rem; font-weight: 700; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: .4rem; }

/* ── RECEIPT MODAL ── */
.receipt-modal-box { background: var(--bg2); border-radius: 24px; box-shadow: 0 30px 80px rgba(0,0,0,${dark ? '.5' : '.25'}); width: 520px; max-width: 95vw; max-height: 92vh; overflow-y: auto; animation: scaleIn .3s ease; }
.receipt-modal-box::-webkit-scrollbar { width: 4px; }
.rm-header { background: linear-gradient(145deg,#2d1f0e,#3d2a14,#4a3020); padding: 2rem 2rem 0; text-align: center; position: relative; overflow: hidden; border-radius: 24px 24px 0 0; }
.rm-header::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 50%,rgba(255,122,51,.22),transparent 60%); }
.rm-header-in { position: relative; z-index: 1; }
.rm-glow-logo { width: 100px; height: 100px; margin: 0 auto 14px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 0 35px rgba(255,122,51,.85), 0 0 60px rgba(255,122,51,.45); }
.rm-logo-circle { width: 80px; height: 80px; background: #FF7A33; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.rm-brand { font-family: 'Playfair Display',serif; font-size: 1.5rem; font-weight: 800; color: white; }
.rm-brand-sub { font-size: .65rem; color: rgba(255,255,255,.5); font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin: 4px 0 1.25rem; }
.rm-wave { display: block; width: 100%; margin-bottom: -2px; }
.rm-success { background: linear-gradient(135deg,#15803d,#16a34a); padding: .85rem 2rem; display: flex; align-items: center; justify-content: center; gap: .65rem; }
.rm-success-text { color: white; font-size: .95rem; font-weight: 700; }
.rm-body { padding: 1.5rem 1.75rem; }
.rm-order-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 2px dashed var(--border2); }
.rm-order-id { font-family: 'Playfair Display',serif; font-size: 1.1rem; font-weight: 800; color: ${dark ? '#f9fafb' : '#2d1f0e'}; margin-top: 3px; }
.rm-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: 1rem; }
.rm-info-box { background: var(--bg4); border: 1px solid var(--border2); border-radius: 10px; padding: .7rem .85rem; }
.rm-info-lbl { font-size: .63rem; font-weight: 700; color: var(--text4); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
.rm-info-val { font-size: .85rem; font-weight: 600; color: var(--text); line-height: 1.4; }
.rm-pay-row { display: flex; align-items: center; justify-content: space-between; background: var(--bg3); border-radius: 10px; padding: .65rem 1rem; margin-bottom: 1rem; }
.rm-upi-badge { background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; font-size: .72rem; font-weight: 800; padding: .25rem .7rem; border-radius: 999px; }
.rm-cod-badge { background: linear-gradient(135deg,#16a34a,#15803d); color: white; font-size: .72rem; font-weight: 800; padding: .25rem .7rem; border-radius: 999px; }
.rm-totals { background: var(--bg4); border: 1px solid var(--border2); border-radius: 12px; padding: .9rem 1rem; margin-top: .85rem; margin-bottom: 1rem; }
.rm-total-line { display: flex; justify-content: space-between; font-size: .8rem; color: var(--text3); padding: .25rem 0; }
.rm-total-line.grand { border-top: 2px solid #FF7A33; margin-top: .55rem; padding-top: .65rem; }
.rm-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; padding: 0 1.75rem 1.75rem; }
.rm-download-btn { padding: .88rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; border: none; border-radius: 12px; font-family: 'DM Sans',sans-serif; font-size: .9rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(255,107,0,.35); transition: all .15s; display: flex; align-items: center; justify-content: center; gap: .5rem; }
.rm-download-btn:hover { transform: translateY(-1px); }
.rm-orders-btn { padding: .88rem; background: ${dark ? '#374151' : '#2d1f0e'}; color: white; border: none; border-radius: 12px; font-family: 'DM Sans',sans-serif; font-size: .9rem; font-weight: 700; cursor: pointer; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: .5rem; }
.rm-orders-btn:hover { background: #3d2a14; transform: translateY(-1px); }

/* ── SETTINGS PANEL ── */
.settings-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 600; animation: fadeIn .2s ease; }
.settings-panel { position: fixed; right: 0; top: 0; bottom: 0; width: 340px; max-width: 95vw; background: var(--bg2); box-shadow: -8px 0 40px rgba(0,0,0,${dark ? '.5' : '.2'}); z-index: 601; display: flex; flex-direction: column; animation: slideInRight .3s ease; overflow: hidden; }
.settings-hdr { background: linear-gradient(135deg,#2d1f0e,#3d2a14); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.settings-title { font-family: 'Playfair Display',serif; font-size: 1.15rem; font-weight: 700; color: white; }
.settings-body { flex: 1; overflow-y: auto; padding: 1.25rem; }
.settings-body::-webkit-scrollbar { width: 4px; }
.settings-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.setting-group { margin-bottom: 1.5rem; }
.setting-group-label { font-size: .7rem; font-weight: 800; color: var(--text4); text-transform: uppercase; letter-spacing: 1px; margin-bottom: .75rem; padding-bottom: .5rem; border-bottom: 1px solid var(--border); }
.setting-row { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1rem; background: var(--bg4); border: 1px solid var(--border); border-radius: 12px; margin-bottom: .5rem; }
.setting-row-info { display: flex; align-items: center; gap: .65rem; }
.setting-row-icon { font-size: 1.3rem; width: 32px; text-align: center; }
.setting-row-text { }
.setting-row-title { font-size: .88rem; font-weight: 700; color: var(--text); line-height: 1.2; }
.setting-row-desc { font-size: .7rem; color: var(--text4); margin-top: 2px; }
.toggle-track { width: 44px; height: 24px; background: var(--border); border-radius: 999px; cursor: pointer; position: relative; transition: background .25s; flex-shrink: 0; }
.toggle-track.on { background: #FF7A33; }
.toggle-thumb { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform .25s; box-shadow: 0 2px 6px rgba(0,0,0,.2); }
.toggle-track.on .toggle-thumb { transform: translateX(20px); }
.settings-input { width: 100%; padding: .6rem .9rem; border: 1.5px solid var(--border); border-radius: 9px; font-family: 'DM Sans',sans-serif; font-size: .85rem; color: var(--text); background: ${dark ? '#374151' : 'white'}; outline: none; margin-top: .5rem; }
.settings-input:focus { border-color: #FF7A33; }
.settings-save-btn { width: 100%; padding: .85rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; border: none; border-radius: 11px; font-family: 'DM Sans',sans-serif; font-size: .95rem; font-weight: 700; cursor: pointer; margin-top: 1rem; box-shadow: 0 4px 14px rgba(255,107,0,.3); transition: all .2s; }
.settings-save-btn:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(255,107,0,.4); }
.font-size-btns { display: flex; gap: .5rem; margin-top: .5rem; }
.font-size-btn { flex: 1; padding: .5rem; border: 1.5px solid var(--border); background: var(--bg2); color: var(--text3); border-radius: 8px; font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 600; cursor: pointer; transition: all .2s; text-align: center; }
.font-size-btn.active { border-color: #FF7A33; background: rgba(255,122,51,.1); color: #FF7A33; }

/* ── TOAST ── */
.pts-toast { position: fixed; bottom: 2rem; right: 2rem; z-index: 999; background: linear-gradient(135deg,#2d1f0e,#3d2a14); border: 1px solid rgba(255,122,51,.3); border-radius: 16px; padding: 1rem 1.5rem; display: flex; align-items: center; gap: .85rem; box-shadow: 0 16px 40px rgba(0,0,0,.2); animation: toastIn .4s ease; }
.toast-icon { font-size: 1.75rem; }
.toast-val { font-family: 'Playfair Display',serif; font-size: 1.1rem; font-weight: 800; color: #FF7A33; }
.toast-msg { font-size: .8rem; color: rgba(255,255,255,.65); }
.empty-st { text-align: center; padding: 4rem 2rem; }
.load-root { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; background: var(--bg); }

/* ── DNA BUTTON ON CARD ── */
.dna-btn { width: 34px; height: 34px; border-radius: 9px; border: 1.5px solid ${dark ? 'rgba(255,122,51,.3)' : 'rgba(255,122,51,.25)'}; background: ${dark ? 'rgba(255,122,51,.1)' : '#fff3ec'}; color: #FF7A33; font-size: .95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .18s; }
.dna-btn:hover { background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; border-color: transparent; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255,107,0,.4); }

/* ── FOOD DNA PANEL ── */
@keyframes dnaBarPulse { 0%,100% { opacity:.5; box-shadow: 0 0 8px rgba(255,122,51,.5); } 50% { opacity:1; box-shadow: 0 0 20px rgba(255,122,51,.9), 0 0 40px rgba(255,107,0,.4); } }
@keyframes dnaShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes dnaHelixFloat { 0% { transform: translateY(0px) rotate(0deg); } 100% { transform: translateY(-80px) rotate(3deg); } }
@keyframes dnaRipple { 0% { transform: scale(0); opacity: .7; } 100% { transform: scale(4); opacity: 0; } }
@keyframes dnaSpark0 { to { transform: translate(-14px,-18px) scale(0); opacity:0; } }
@keyframes dnaSpark1 { to { transform: translate(14px,-18px) scale(0); opacity:0; } }
@keyframes dnaSpark2 { to { transform: translate(-20px,-4px) scale(0); opacity:0; } }
@keyframes dnaSpark3 { to { transform: translate(20px,-4px) scale(0); opacity:0; } }
@keyframes dnaSpark4 { to { transform: translate(-10px,14px) scale(0); opacity:0; } }
@keyframes dnaSpark5 { to { transform: translate(10px,14px) scale(0); opacity:0; } }
@keyframes dnaStatIn { from { opacity:0; transform:translateX(18px); } to { opacity:1; transform:translateX(0); } }
@keyframes dnaHeaderPulse { 0%,100% { text-shadow: 0 0 10px rgba(255,122,51,.4); } 50% { text-shadow: 0 0 20px rgba(255,122,51,.8), 0 0 40px rgba(255,107,0,.3); } }
@keyframes dnaGlowBorder { 0%,100% { box-shadow: 0 0 0 1px rgba(255,122,51,.3), inset 0 0 30px rgba(255,122,51,.03); } 50% { box-shadow: 0 0 0 1.5px rgba(255,122,51,.6), inset 0 0 40px rgba(255,122,51,.06), 0 0 40px rgba(255,107,0,.15); } }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spinSmooth { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(.93); } to { opacity: 1; transform: scale(1); } }
@keyframes toastIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes steamRise { 0%,100% { transform: translateY(0) scaleX(1); opacity: .9; } 50% { transform: translateY(-4px) scaleX(.8); opacity: .5; } }
.steam-1 { animation: steamRise 1.8s ease-in-out infinite; }
.steam-2 { animation: steamRise 1.8s ease-in-out .35s infinite; }
.steam-3 { animation: steamRise 1.8s ease-in-out .7s infinite; }

/* ═══════════════════════════════════════════
   TABLET — max-width 1024px
═══════════════════════════════════════════ */
@media (max-width: 1024px) {
  .cart-drawer.open { width: 320px; }
  .mgrid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
}

/* ═══════════════════════════════════════════
   MOBILE — max-width 768px
═══════════════════════════════════════════ */
@media (max-width: 768px) {
  /* Header */
  .mhdr-in { padding: .65rem 1rem; gap: .5rem; flex-wrap: nowrap; }
  .logo-sub { display: none; }
  .nav-right { gap: .3rem; flex-wrap: nowrap; }
  .nav-btn { padding: .45rem .6rem; font-size: 0; min-width: 38px; justify-content: center; }
  .nav-btn svg { display: block !important; }
  .user-name { max-width: 72px; font-size: .75rem; }
  .user-chip { padding: .35rem .6rem; }
  .loy-chip { display: none; }
  .cart-trigger { padding: .48rem .85rem; font-size: .82rem; }

  /* Loyalty banner */
  .loy-banner { padding: .75rem 1rem; }
  .loy-inner { gap: .6rem; flex-direction: column; align-items: flex-start; }

  /* Hero */
  .mhero { padding: 1.75rem 1rem; }
  .hero-title { font-size: 1.85rem; }
  .hero-sub { font-size: .82rem; }
  .hero-eye { font-size: .65rem; padding: .25rem .65rem; }

  /* Layout */
  .page-body { flex-direction: column; }
  .menu-area { width: 100%; }
  .mmain { padding: 1.25rem 1rem 5rem; }

  /* Category pills */
  .cat-row { gap: .4rem; margin-bottom: 1.25rem; overflow-x: auto; flex-wrap: nowrap; padding-bottom: .25rem; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .cat-row::-webkit-scrollbar { display: none; }
  .cat-pill { padding: .42rem .9rem; font-size: .78rem; flex-shrink: 0; }

  /* Section label */
  .sec-label { font-size: 1.1rem; margin-bottom: .85rem; }

  /* Menu grid — 2 columns on mobile */
  .mgrid { grid-template-columns: repeat(2, 1fr); gap: .75rem; }
  .mcard { border-radius: 13px; }
  .cbody { padding: .65rem .65rem .7rem; }
  .cname { font-size: .85rem; }
  .cdesc { font-size: .72rem; -webkit-line-clamp: 1; }
  .add-btn { font-size: .77rem; padding: .55rem .4rem; }
  .qty-ctrl { gap: .35rem; }

  /* Cart drawer — full screen on mobile */
  .cart-drawer.open {
    position: fixed !important; top: 0 !important; left: 0 !important;
    right: 0 !important; bottom: 0 !important;
    width: 100vw !important; height: 100% !important;
    z-index: 500 !important; border-left: none !important;
  }

  /* Modals — slide up from bottom on mobile */
  .modal-bg { padding: 0; align-items: flex-end; }
  .modal-box {
    width: 100% !important; max-width: 100% !important;
    border-radius: 22px 22px 0 0 !important;
    max-height: 94vh !important;
    animation: slideUpMobile .3s ease !important;
  }
  .receipt-modal-box {
    width: 100% !important; max-width: 100% !important;
    border-radius: 22px 22px 0 0 !important;
    max-height: 94vh !important;
    animation: slideUpMobile .3s ease !important;
  }

  /* Settings panel — full width */
  .settings-panel { width: 100% !important; max-width: 100% !important; }

  /* Payment method selector */
  .pm-grid { grid-template-columns: 1fr 1fr !important; }

  /* Checkout action buttons */
  .checkout-actions { flex-direction: column !important; }
  .action-btn-green, .action-btn-locked, .cancel-btn { width: 100% !important; }
}

/* ═══════════════════════════════════════════
   SMALL PHONES — max-width 400px
═══════════════════════════════════════════ */
@media (max-width: 400px) {
  .hero-title { font-size: 1.55rem; }
  .mgrid { grid-template-columns: 1fr 1fr; gap: .55rem; }
  .mhdr-in { padding: .55rem .75rem; }
  .logo-brand { font-size: 1rem; }
  .cart-trigger .cart-label { display: none; }
}

@keyframes slideUpMobile { from { transform: translateY(100%); } to { transform: translateY(0); } }
`;

// ─── DNA Helix Background SVG ─────────────────────────────────────────────────
function DNAHelixBG({ dark }) {
  const pts = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      {/* Primary helix — right side */}
      <svg viewBox="0 0 80 700" preserveAspectRatio="none"
        style={{ position:'absolute', right:-5, top:0, width:75, height:'110%',
          opacity: dark ? 0.08 : 0.04,
          animation:'dnaHelixFloat 9s ease-in-out infinite alternate' }}>
        <defs>
          <linearGradient id="hg1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5500" />
            <stop offset="50%" stopColor="#FF7A33" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>
        <path d="M40 0 C70 58 10 116 40 175 C70 233 10 291 40 350 C70 408 10 466 40 525 C70 583 10 641 40 700"
          fill="none" stroke="url(#hg1)" strokeWidth="2.5"/>
        <path d="M40 0 C10 58 70 116 40 175 C10 233 70 291 40 350 C10 408 70 466 40 525 C10 583 70 641 40 700"
          fill="none" stroke="url(#hg1)" strokeWidth="2.5"/>
        {pts.map(i => {
          const y = i * 50 + 12;
          const phase = (i * Math.PI) / 3.5;
          const x1 = 40 + 28 * Math.sin(phase);
          const x2 = 40 - 28 * Math.sin(phase);
          return <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="#FF7A33" strokeWidth="1.5" opacity="0.55"/>;
        })}
        {/* Nodes at strand intersections */}
        {[175, 350, 525].map(y => <circle key={y} cx={40} cy={y} r="4" fill="#FF7A33" opacity="0.7"/>)}
      </svg>

      {/* Secondary helix — left, faint */}
      <svg viewBox="0 0 60 500" preserveAspectRatio="none"
        style={{ position:'absolute', left:-8, top:'15%', width:55, height:'70%',
          opacity: dark ? 0.04 : 0.02,
          animation:'dnaHelixFloat 13s ease-in-out infinite alternate-reverse' }}>
        <path d="M30 0 C55 42 5 83 30 125 C55 167 5 208 30 250 C55 292 5 333 30 375 C55 417 5 458 30 500"
          fill="none" stroke="#FF7A33" strokeWidth="2"/>
        <path d="M30 0 C5 42 55 83 30 125 C5 167 55 208 30 250 C5 292 55 333 30 375 C5 417 55 458 30 500"
          fill="none" stroke="#FF7A33" strokeWidth="2"/>
      </svg>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position:'absolute',
          width: 3 + (i % 3),
          height: 3 + (i % 3),
          borderRadius:'50%',
          background: '#FF7A33',
          opacity: dark ? 0.12 : 0.07,
          left: `${10 + (i * 11) % 80}%`,
          top: `${8 + (i * 13) % 84}%`,
          animation: `dnaHelixFloat ${5 + i * 1.2}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.4}s`,
        }} />
      ))}
    </div>
  );
}

// ─── Food DNA Panel ───────────────────────────────────────────────────────────
function FoodDNAPanel({ item, dark, onClose }) {
  const panelRef = useRef(null);
  const [tilt, setTilt]           = useState({ x: 0, y: 0 });
  const [visible, setVisible]     = useState(false);
  const [barWidths, setBarWidths] = useState({ calories:0, spice:0, protein:0, popularity:0, freshness:0 });
  const [counts, setCounts]       = useState({ calories:0, spice:0, protein:0, popularity:0, freshness:0 });
  const [loadedStats, setLoadedStats] = useState([]);
  const [sparks, setSparks]       = useState({});
  const [hoveredStat, setHoveredStat] = useState(null);
  const [ripple, setRipple]       = useState(null);

  const DNA_STATS = [
    { key:'calories',   label:'Calories',    icon:'🔥', unit:'kcal', max:800,  value: Number(item.calories)   || 0 },
    { key:'spice',      label:'Spice Level', icon:'🌶️', unit:'/10',  max:10,   value: Number(item.spice)      || 0 },
    { key:'protein',    label:'Protein',     icon:'💪', unit:'g',    max:50,   value: Number(item.protein)    || 0 },
    { key:'popularity', label:'Popularity',  icon:'⭐', unit:'%',    max:100,  value: Number(item.popularity) || 0 },
    { key:'freshness',  label:'Freshness',   icon:'✨', unit:'/10',  max:10,   value: Number(item.freshness)  || 0 },
  ];

  const maxIdx = DNA_STATS.reduce((best, s, i) =>
    s.max > 0 && (s.value / s.max) > (DNA_STATS[best].value / DNA_STATS[best].max) ? i : best, 0);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    DNA_STATS.forEach((stat, i) => {
      setTimeout(() => {
        const pct = stat.max > 0 ? (stat.value / stat.max) * 100 : 0;
        setBarWidths(prev => ({ ...prev, [stat.key]: pct }));
        const dur = 1100; const start = Date.now();
        const tick = () => {
          const prog = Math.min((Date.now() - start) / dur, 1);
          const eased = 1 - Math.pow(1 - prog, 3);
          setCounts(prev => ({ ...prev, [stat.key]: stat.value * eased }));
          if (prog < 1) requestAnimationFrame(tick);
          else {
            setCounts(prev => ({ ...prev, [stat.key]: stat.value }));
            setLoadedStats(prev => [...prev, stat.key]);
            setSparks(prev => ({ ...prev, [stat.key]: true }));
            setTimeout(() => setSparks(prev => ({ ...prev, [stat.key]: false })), 700);
          }
        };
        requestAnimationFrame(tick);
      }, 350 + i * 270);
    });
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseMove = (e) => {
    if (!panelRef.current) return;
    const r = panelRef.current.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    const dy = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    setTilt({ x: dy * -5, y: dx * 5 });
  };

  const handleClose = () => { setVisible(false); setTimeout(onClose, 420); };

  const handleRipple = (e, key) => {
    const r = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - r.left, y: e.clientY - r.top, key, id: Date.now() });
    setTimeout(() => setRipple(null), 600);
  };

  const bgBase  = dark ? 'rgba(10,14,22,0.98)' : 'rgba(252,250,247,0.98)';
  const border  = dark ? '1px solid rgba(255,122,51,0.25)' : '1px solid rgba(255,122,51,0.18)';
  const panelShadow = dark
    ? '-24px 0 80px rgba(0,0,0,.7), inset 1px 0 0 rgba(255,122,51,.12)'
    : '-20px 0 60px rgba(0,0,0,.12), inset 1px 0 0 rgba(255,122,51,.08)';

  const SPARK_COLORS = ['#FF7A33','#FFD700','#FF5500','#FFAA55','#FF8C42','#fff'];

  return (
    <div onClick={e => e.target === e.currentTarget && handleClose()}
      style={{ position:'fixed', inset:0, zIndex:600,
        background: 'rgba(0,0,0,.45)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'stretch', justifyContent:'flex-end',
        animation:'fadeIn .22s ease' }}>

      <div ref={panelRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTilt({ x:0, y:0 })}
        style={{
          width: 400, maxWidth:'96vw',
          background: bgBase,
          backdropFilter: 'blur(24px)',
          borderLeft: border,
          boxShadow: panelShadow,
          overflowY:'auto', overflowX:'hidden',
          position:'relative',
          transform: visible
            ? `perspective(1400px) rotateY(${tilt.y}deg) rotateX(${tilt.x}deg) translateX(0)`
            : 'translateX(100%)',
          transition: visible
            ? 'transform .6s cubic-bezier(0.34,1.56,0.64,1)'
            : 'transform .35s ease-in',
          willChange:'transform',
          animation: visible ? 'dnaGlowBorder 3s ease-in-out 1.2s infinite' : 'none',
        }}>

        <DNAHelixBG dark={dark} />

        {/* ── CONTENT ── */}
        <div style={{ position:'relative', zIndex:1 }}>

          {/* Header gradient strip */}
          <div style={{
            background: 'linear-gradient(135deg,#1a0a00,#2d1500,#1a0f05)',
            padding:'1.5rem 1.5rem 1.25rem',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 20% 50%,rgba(255,122,51,.22),transparent 65%)' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              {/* Close */}
              <button onClick={handleClose} style={{
                position:'absolute', top:0, right:0,
                background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)',
                borderRadius:'50%', width:34, height:34, cursor:'pointer', color:'rgba(255,255,255,.7)',
                fontSize:'.95rem', display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all .2s',
              }}>✕</button>

              {/* DNA badge */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:'.4rem',
                background:'rgba(255,122,51,.2)', border:'1px solid rgba(255,122,51,.35)',
                borderRadius:999, padding:'.22rem .7rem', marginBottom:'.85rem',
                fontSize:'.6rem', fontWeight:800, color:'#FFAA77', letterSpacing:2,
                textTransform:'uppercase', animation:'dnaHeaderPulse 3s ease-in-out infinite',
              }}>
                🧬 FOOD DNA ANALYZER
              </div>

              {/* Item info */}
              <div style={{ display:'flex', alignItems:'center', gap:'.9rem' }}>
                <img src={item.imageUrl || `https://via.placeholder.com/60/2d1f0e/FF7A33?text=${encodeURIComponent(item.name[0])}`}
                  alt={item.name}
                  style={{ width:64, height:64, borderRadius:14, objectFit:'cover', flexShrink:0,
                    border:'2px solid rgba(255,122,51,.45)', boxShadow:'0 6px 20px rgba(255,107,0,.35)' }} />
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', fontWeight:800,
                    color:'white', lineHeight:1.2, marginBottom:3 }}>{item.name}</div>
                  <div style={{ fontSize:'.72rem', color:'rgba(255,255,255,.5)', display:'flex', gap:'.5rem', alignItems:'center' }}>
                    <span>{item.category}</span>
                    <span style={{ width:3, height:3, borderRadius:'50%', background:'rgba(255,255,255,.3)', display:'inline-block' }}/>
                    <span style={{ color:'#FFAA77', fontWeight:700 }}>₹{item.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats area */}
          <div style={{ padding:'1.35rem 1.5rem' }}>
            <div style={{ fontSize:'.62rem', fontWeight:800, color: dark ? '#4b5563' : '#c4c4c4',
              letterSpacing:2.5, textTransform:'uppercase', marginBottom:'1.1rem',
              display:'flex', alignItems:'center', gap:'.5rem' }}>
              <div style={{ flex:1, height:1, background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' }}/>
              NUTRITIONAL PROFILE
              <div style={{ flex:1, height:1, background: dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)' }}/>
            </div>

            {DNA_STATS.map((stat, i) => {
              const isTop    = i === maxIdx && stat.value > 0;
              const isLoaded = loadedStats.includes(stat.key);
              const hasSpark = sparks[stat.key];
              const isHov    = hoveredStat === stat.key;
              const pct      = barWidths[stat.key] || 0;
              const countVal = counts[stat.key] || 0;
              const displayVal = stat.unit === 'kcal' || stat.unit === 'g'
                ? Math.round(countVal)
                : Math.round(countVal * 10) / 10;

              return (
                <div key={stat.key}
                  onClick={e => handleRipple(e, stat.key)}
                  onMouseEnter={() => setHoveredStat(stat.key)}
                  onMouseLeave={() => setHoveredStat(null)}
                  style={{
                    marginBottom:'1.1rem', position:'relative', cursor:'pointer',
                    padding:'.65rem .85rem',
                    borderRadius:12,
                    background: isHov
                      ? dark ? 'rgba(255,122,51,.08)' : 'rgba(255,122,51,.05)'
                      : 'transparent',
                    border: `1px solid ${isHov ? 'rgba(255,122,51,.2)' : 'transparent'}`,
                    transition:'all .18s ease',
                    animation: `dnaStatIn .4s ease ${i * 0.08}s both`,
                    overflow:'hidden',
                  }}>

                  {/* Ripple effect */}
                  {ripple?.key === stat.key && (
                    <div style={{
                      position:'absolute', left: ripple.x, top: ripple.y,
                      width:8, height:8, marginLeft:-4, marginTop:-4,
                      borderRadius:'50%',
                      background:'rgba(255,122,51,.4)',
                      animation:'dnaRipple .55s ease-out forwards',
                      pointerEvents:'none',
                    }} />
                  )}

                  {/* Label row */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.45rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'.45rem' }}>
                      <span style={{ fontSize:'1.05rem', filter: isHov ? 'drop-shadow(0 0 6px rgba(255,122,51,.6))' : 'none', transition:'filter .2s' }}>{stat.icon}</span>
                      <span style={{ fontSize:'.82rem', fontWeight:700, color: dark ? '#d1d5db' : '#374151', transition:'color .18s',
                        ...(isHov ? { color:'#FF7A33' } : {}) }}>{stat.label}</span>
                      {isTop && (
                        <span style={{ fontSize:'.55rem', fontWeight:800, color:'#FF7A33',
                          background: dark ? 'rgba(255,122,51,.18)' : '#fff3ec',
                          border:'1px solid rgba(255,122,51,.35)',
                          borderRadius:999, padding:'.08rem .4rem', letterSpacing:1.2,
                          animation:'dnaHeaderPulse 2s ease-in-out infinite' }}>✦ PEAK</span>
                      )}
                    </div>
                    <div style={{ fontSize:'.9rem', fontWeight:800, color: stat.value > 0 ? '#FF7A33' : dark ? '#374151' : '#d1d5db',
                      fontFamily:"'DM Sans',sans-serif", minWidth:52, textAlign:'right',
                      transition:'color .2s',
                      ...(isHov && stat.value > 0 ? { color:'#FFD700' } : {}) }}>
                      {stat.value > 0
                        ? <>{displayVal}<span style={{ fontSize:'.62rem', color: dark ? '#6b7280' : '#9ca3af', marginLeft:2 }}>{stat.unit}</span></>
                        : <span style={{ fontSize:'.7rem', fontWeight:500 }}>—</span>}
                    </div>
                  </div>

                  {/* Bar track */}
                  <div style={{ position:'relative', height:9, background: dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)', borderRadius:999 }}>

                    {/* Pulse glow behind bar (top stat only) */}
                    {isTop && isLoaded && (
                      <div style={{ position:'absolute', inset:-3, borderRadius:999,
                        background:'rgba(255,122,51,.2)', filter:'blur(5px)',
                        animation:'dnaBarPulse 2.2s ease-in-out infinite' }} />
                    )}

                    {/* Bar fill — energy cell */}
                    <div style={{
                      height:'100%', borderRadius:999,
                      width:`${pct}%`,
                      background: stat.value > 0
                        ? isTop
                          ? 'linear-gradient(90deg,#FF5500 0%,#FF7A33 40%,#FFAA55 75%,#FFD700 100%)'
                          : 'linear-gradient(90deg,#FF5500 0%,#FF7A33 60%,#FFAA55 100%)'
                        : dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
                      boxShadow: isLoaded && stat.value > 0
                        ? isTop
                          ? '0 0 14px rgba(255,215,0,.7), 0 0 6px rgba(255,122,51,.9)'
                          : isHov ? '0 0 10px rgba(255,122,51,.7)' : '0 0 6px rgba(255,122,51,.45)'
                        : 'none',
                      transition:'width 1.15s cubic-bezier(0.34,1.2,0.64,1), box-shadow .3s',
                      position:'relative', overflow:'hidden',
                    }}>
                      {/* Shimmer sweep */}
                      {stat.value > 0 && (
                        <div style={{ position:'absolute', inset:0, borderRadius:999,
                          background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,.45) 50%,transparent 100%)',
                          backgroundSize:'200% 100%',
                          animation:'dnaShimmer 2.5s linear infinite' }} />
                      )}

                      {/* Glowing tip dot */}
                      {stat.value > 0 && pct > 6 && (
                        <div style={{ position:'absolute', right:-4, top:'50%', transform:'translateY(-50%)',
                          width:11, height:11, borderRadius:'50%', background:'white',
                          boxShadow:`0 0 8px rgba(255,122,51,1), 0 0 18px rgba(255,122,51,.6)`,
                          transition:'right .1s' }} />
                      )}
                    </div>

                    {/* Cell segment dividers */}
                    {[25,50,75].map(p => (
                      <div key={p} style={{ position:'absolute', top:0, left:`${p}%`,
                        width:1, height:'100%',
                        background: dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)',
                        pointerEvents:'none' }} />
                    ))}
                  </div>

                  {/* Spark particles */}
                  {hasSpark && stat.value > 0 && (
                    <div style={{ position:'absolute', left:`calc(${pct}% - 2px)`, top:'50%', pointerEvents:'none' }}>
                      {SPARK_COLORS.map((col, si) => (
                        <div key={si} style={{
                          position:'absolute', width:5, height:5, borderRadius:'50%',
                          background:col, top:0, left:0,
                          animation:`dnaSpark${si} .65s ease-out forwards`,
                          boxShadow:`0 0 4px ${col}`,
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Legend */}
            <div style={{ display:'flex', justifyContent:'space-between', margin:'0 .85rem',
              fontSize:'.6rem', color: dark ? '#374151' : '#d1d5db', marginBottom:'1.25rem' }}>
              <span>0</span><span>25%</span><span>50%</span><span>75%</span><span>MAX</span>
            </div>

            {/* No data state */}
            {DNA_STATS.every(s => s.value === 0) && (
              <div style={{ textAlign:'center', padding:'1rem',
                background: dark ? 'rgba(255,122,51,.05)' : '#fff8f3',
                border:`1px dashed rgba(255,122,51,.25)`,
                borderRadius:12, marginBottom:'1rem',
                fontSize:'.8rem', color: dark ? '#6b7280' : '#9ca3af' }}>
                🧬 DNA data not yet set by admin
              </div>
            )}

            {/* Info footer */}
            <div style={{
              background: dark ? 'rgba(255,122,51,.06)' : '#fff8f3',
              border:`1px solid ${dark ? 'rgba(255,122,51,.12)' : 'rgba(255,122,51,.18)'}`,
              borderRadius:12, padding:'.8rem 1rem',
              fontSize:'.7rem', color: dark ? '#6b7280' : '#9ca3af', lineHeight:1.65,
            }}>
              <span style={{ color:'#FF7A33', fontWeight:700 }}>🧬 Food DNA</span> — Nutritional stats curated by Annapurna Admin. Bars show values relative to recommended daily maxima.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle component ─────────────────────────────────────────────────────────
const Toggle = ({ on, onChange }) => (
  <div className={`toggle-track${on ? ' on' : ''}`} onClick={() => onChange(!on)}>
    <div className="toggle-thumb" />
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function MenuPage() {
  const [menu, setMenu]                         = useState([]);
  const [cart, setCart]                         = useState([]);
  const [isAdmin, setIsAdmin]                   = useState(false);
  const [activeCategory, setActiveCategory]     = useState('All');
  const [searchTerm, setSearchTerm]             = useState('');
  const [loading, setLoading]                   = useState(true);
  const [user, setUser]                         = useState(null);
  const [cartOpen, setCartOpen]                 = useState(false);
  const [checkoutOpen, setCheckoutOpen]         = useState(false);
  const [receiptData, setReceiptData]           = useState(null);
  const [placing, setPlacing]                   = useState(false);
  const [deliveryName, setDeliveryName]         = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [loyaltyPoints, setLoyaltyPoints]       = useState(0);
  const [toast, setToast]                       = useState(null);
  const [paymentMethod, setPaymentMethod]       = useState('cod');
  const [dnaItem, setDnaItem]                   = useState(null);

  // ── Settings state ────────────────────────────────────────────────────────
  const [settingsOpen, setSettingsOpen]         = useState(false);
  const [darkMode, setDarkMode]                 = useState(() => getLS('darkMode', false));
  const [largeFontSize, setLargeFontSize]       = useState(() => getLS('largeFontSize', false));
  const [soundEnabled, setSoundEnabled]         = useState(() => getLS('soundEnabled', true));
  const [savedName, setSavedName]               = useState(() => getLS('savedName', ''));
  const [savedLocation, setSavedLocation]       = useState(() => getLS('savedLocation', ''));
  const [autoFillDelivery, setAutoFillDelivery] = useState(() => getLS('autoFillDelivery', true));
  const [showEta, setShowEta]                   = useState(() => getLS('showEta', true));
  const [compactMode, setCompactMode]           = useState(() => getLS('compactMode', false));
  const [defaultPayment, setDefaultPayment]     = useState(() => getLS('defaultPayment', 'cod'));
  const [showPriceInHeader, setShowPriceInHeader] = useState(() => getLS('showPriceInHeader', true));
  // Temp settings (edited in panel, applied on save)
  const [tmpSavedName, setTmpSavedName]         = useState('');
  const [tmpSavedLocation, setTmpSavedLocation] = useState('');

  // ── Razorpay Payment Link state ───────────────────────────────────────────
  const [linkData, setLinkData]                 = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [linkExpired, setLinkExpired]           = useState(false);
  const [linkLoading, setLinkLoading]           = useState(false);
  const [manualChecking, setManualChecking]     = useState(false);
  const [manualCheckFailed, setManualCheckFailed] = useState(false);
  const pollingRef                               = useRef(null);
  const expireTimerRef                           = useRef(null);

  const navigate = useNavigate();

  // ── Persist settings ──────────────────────────────────────────────────────
  useEffect(() => { setLS('darkMode', darkMode); }, [darkMode]);
  useEffect(() => { setLS('largeFontSize', largeFontSize); }, [largeFontSize]);
  useEffect(() => { setLS('soundEnabled', soundEnabled); }, [soundEnabled]);
  useEffect(() => { setLS('showEta', showEta); }, [showEta]);
  useEffect(() => { setLS('compactMode', compactMode); }, [compactMode]);
  useEffect(() => { setLS('defaultPayment', defaultPayment); }, [defaultPayment]);
  useEffect(() => { setLS('showPriceInHeader', showPriceInHeader); }, [showPriceInHeader]);

  useEffect(() => { setCart(loadCart()); }, []);
  useEffect(() => { saveCart(cart); }, [cart]);

  useEffect(() => {
    return () => {
      if (pollingRef.current)     clearInterval(pollingRef.current);
      if (expireTimerRef.current) clearTimeout(expireTimerRef.current);
    };
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsAdmin(u.email === 'admin@canteen.edu.in');
        try {
          const res = await axios.get(`${API}/api/loyalty/${u.uid}`);
          setLoyaltyPoints(res.data.loyaltyPoints || 0);
        } catch (e) { console.error(e); }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    axios.get(`${API}/api/menu`)
      .then(r => setMenu(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // ── KEY FIX: Poll when user returns to the tab after paying on Razorpay ───
  const checkPaymentNow = useCallback(async (qrId) => {
    try {
      const statusRes = await axios.get(`${API}/api/payment-status/${qrId}`);
      if (statusRes.data.status === 'paid') {
        setPaymentConfirmed(true);
        stopPolling();
        if (soundEnabled) playSuccessSound();
        return true;
      }
    } catch (e) { console.error('Payment check error:', e); }
    return false;
  }, [soundEnabled]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && linkData && !paymentConfirmed && !linkExpired) {
        checkPaymentNow(linkData.qrId);
      }
    };
    // Also fire when the browser window gets focus (user switches back from Razorpay tab)
    const handleWindowFocus = () => {
      if (linkData && !paymentConfirmed && !linkExpired) {
        checkPaymentNow(linkData.qrId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [linkData, paymentConfirmed, linkExpired, checkPaymentNow]);

  // ── Auto-fill delivery details from saved settings ────────────────────────
  useEffect(() => {
    if (checkoutOpen && autoFillDelivery) {
      if (savedName && !deliveryName)     setDeliveryName(savedName);
      if (savedLocation && !deliveryLocation) setDeliveryLocation(savedLocation);
    }
    if (checkoutOpen) {
      setPaymentMethod(defaultPayment);
    }
  }, [checkoutOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const addToCart = (item) => {
    if (item.inStock === false) return;
    const exists  = cart.find(i => i.id === item.id);
    const newCart = exists
      ? cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...cart, { ...item, quantity: 1 }];
    setCart(newCart); saveCart(newCart); setCartOpen(true);
  };
  const updateQty = (id, delta) => {
    const newCart = cart.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0);
    setCart(newCart); saveCart(newCart);
    if (!newCart.length) setCartOpen(false);
  };
  const removeItem = (id) => {
    const newCart = cart.filter(i => i.id !== id);
    setCart(newCart); saveCart(newCart);
    if (!newCart.length) setCartOpen(false);
  };
  const clearCart = () => { setCart([]); saveCart([]); setCartOpen(false); };

  // ── Stop polling ──────────────────────────────────────────────────────────
  const stopPolling = () => {
    if (pollingRef.current)     { clearInterval(pollingRef.current);   pollingRef.current = null; }
    if (expireTimerRef.current) { clearTimeout(expireTimerRef.current); expireTimerRef.current = null; }
  };

  // ── Switch payment method ─────────────────────────────────────────────────
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method !== 'upi') {
      stopPolling();
      setLinkData(null);
      setPaymentConfirmed(false);
      setLinkExpired(false);
      setManualCheckFailed(false);
    }
  };

  // ── Generate Razorpay Payment Link ────────────────────────────────────────
  const generatePaymentLink = async () => {
    if (!deliveryName.trim() || !deliveryLocation.trim()) {
      alert('Please fill in your name and delivery location first');
      return;
    }
    stopPolling();
    setLinkData(null);
    setPaymentConfirmed(false);
    setLinkExpired(false);
    setManualCheckFailed(false);
    setLinkLoading(true);

    try {
      const tempOrderId = `ANNA_${Date.now()}`;
      const res = await axios.post(`${API}/api/create-payment-qr`, {
        amount:  totalPrice,
        orderId: tempOrderId,
      });

      setLinkData(res.data); // { qrId: "plink_xxx", paymentUrl: "https://rzp.io/..." }

      // Poll every 2 seconds for faster detection
      pollingRef.current = setInterval(async () => {
        const paid = await checkPaymentNow(res.data.qrId);
        if (paid) clearInterval(pollingRef.current);
      }, 2000);

      // Expire after 10 minutes
      expireTimerRef.current = setTimeout(() => {
        stopPolling();
        setLinkExpired(true);
        setPaymentConfirmed(false);
      }, 600000);

    } catch (err) {
      console.error('Payment link error:', err);
      alert('Failed to generate payment link. Please try again.');
    } finally {
      setLinkLoading(false);
    }
  };

  // ── Manual payment check — retries 6× with 1.5s delay, then shows self-confirm ──
  const handleManualCheck = async () => {
    if (!linkData) return;
    setManualChecking(true);
    setManualCheckFailed(false);
    let paid = false;
    // Try up to 6 times, 1.5 seconds apart — covers webhook delivery lag
    for (let attempt = 1; attempt <= 6; attempt++) {
      paid = await checkPaymentNow(linkData.qrId);
      if (paid) break;
      if (attempt < 6) await new Promise(r => setTimeout(r, 1500));
    }
    if (!paid) {
      // Webhook/backend didn't confirm — let user self-confirm
      setManualCheckFailed(true);
    }
    setManualChecking(false);
  };

  // ── Self-confirm: user manually asserts they paid ─────────────────────────
  const handleSelfConfirm = () => {
    stopPolling();
    setPaymentConfirmed(true);
    setManualCheckFailed(false);
    if (soundEnabled) playSuccessSound();
  };

  // ── Close checkout ────────────────────────────────────────────────────────
  const closeCheckout = () => {
    stopPolling();
    setCheckoutOpen(false);
    setLinkData(null);
    setPaymentConfirmed(false);
    setLinkExpired(false);
    setManualCheckFailed(false);
    setPaymentMethod('cod');
    setDeliveryName('');
    setDeliveryLocation('');
  };

  // ── Place Order ───────────────────────────────────────────────────────────
  const placeOrder = async () => {
    if (!deliveryName.trim() || !deliveryLocation.trim() || !paymentMethod) {
      alert('Please fill all details and select a payment method');
      return;
    }
    if (paymentMethod === 'upi' && !paymentConfirmed) {
      alert('Please complete UPI payment first.');
      return;
    }
    const uid    = auth.currentUser?.uid;
    const total  = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const eta    = calcETA(cart, menu);
    const earned = calcPoints(total);
    const now    = new Date();
    setPlacing(true);
    try {
      const orderRes = await axios.post(`${API}/api/orders`, {
        userId: uid,
        items:  cart.map(({ id, name, price, quantity }) => ({ foodId: id, name, price, quantity })),
        total, deliveryName, deliveryLocation, eta,
        pointsEarned: earned, paymentMethod,
        razorpayLinkId: linkData?.qrId || null,
        paymentStatus:  paymentMethod === 'upi' ? 'paid' : 'cod',
        status:         paymentMethod === 'upi' ? 'confirmed' : 'pending',
      });
      const orderId = orderRes.data.id || orderRes.data.orderId || `ORD${Date.now()}`;
      if (earned > 0) {
        const r = await axios.post(`${API}/api/loyalty/${uid}/add`, { points: earned });
        setLoyaltyPoints(r.data.loyaltyPoints);
        setToast({ pts: earned, newTotal: r.data.loyaltyPoints, tier: getTier(r.data.loyaltyPoints) });
        setTimeout(() => setToast(null), 5000);
      }
      setReceiptData({
        orderId, date: now,
        items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        total, deliveryName, deliveryLocation, eta, pointsEarned: earned, paymentMethod,
      });
      stopPolling();
      setCart([]); saveCart([]);
      setCheckoutOpen(false); setCartOpen(false);
      setDeliveryName(''); setDeliveryLocation('');
      setPaymentMethod('cod'); setLinkData(null);
      setPaymentConfirmed(false);
    } catch (e) {
      console.error(e); alert('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ── Settings handlers ─────────────────────────────────────────────────────
  const openSettings = () => {
    setTmpSavedName(savedName);
    setTmpSavedLocation(savedLocation);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    const n = tmpSavedName.trim();
    const l = tmpSavedLocation.trim();
    setSavedName(n); setLS('savedName', n);
    setSavedLocation(l); setLS('savedLocation', l);
    setAutoFillDelivery(autoFillDelivery); setLS('autoFillDelivery', autoFillDelivery);
    setSettingsOpen(false);
  };

  const handleLogout = async () => {
    await auth.signOut(); localStorage.removeItem('cart'); navigate('/login');
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const displayName  = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';
  const categories   = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Beverages', 'Desserts'];
  const filteredMenu = menu.filter(item => {
    const mc = activeCategory === 'All' || item.category === activeCategory;
    const ms = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return mc && ms;
  });
  const totalItems   = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice   = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const eta          = calcETA(cart, menu);
  const pointsToEarn = calcPoints(totalPrice);
  const tier         = getTier(loyaltyPoints);
  const nextAt       = loyaltyPoints < 200 ? 200 : loyaltyPoints < 500 ? 500 : null;
  const pct          = nextAt ? Math.min(100, (loyaltyPoints / nextAt) * 100) : 100;
  const cartQty      = (id) => cart.find(i => i.id === id)?.quantity || 0;

  const BowlSVG = ({ size = 44 }) => (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none">
      <path className="steam-1" d="M18 14 Q17 11 18 8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path className="steam-2" d="M26 13 Q25 10 26 7" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path className="steam-3" d="M34 14 Q33 11 34 8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z" fill="white"/>
      <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
      <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.18)"/>
      <circle cx="26" cy="34" r="2.5" fill="rgba(255,107,0,0.35)"/>
    </svg>
  );

  if (loading) return (
    <>
      <style>{makeStyles(darkMode, largeFontSize, compactMode)}</style>
      <div className="load-root">
        <div style={{ position:'relative', width:80, height:80 }}>
          <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:'2px dashed rgba(255,122,51,0.3)', animation:'spin 20s linear infinite' }} />
          <div style={{ width:80, height:80, background:'linear-gradient(145deg,#FF7A33,#FF5500)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(255,107,0,0.35)' }}>
            <BowlSVG />
          </div>
        </div>
        <p style={{ fontSize:'.9rem', color:'var(--text4)', fontWeight:500 }}>Loading the menu…</p>
      </div>
    </>
  );

  return (
    <>
      <style>{makeStyles(darkMode, largeFontSize, compactMode)}</style>

      {/* ── POINTS TOAST ── */}
      {toast && (
        <div className="pts-toast">
          <div className="toast-icon">{toast.tier.icon}</div>
          <div>
            <div className="toast-val">+{toast.pts} Points Earned!</div>
            <div className="toast-msg">Total: {toast.newTotal} pts · {toast.tier.name} tier</div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          SETTINGS PANEL
      ════════════════════════════════════════════════════════ */}
      {settingsOpen && (
        <>
          <div className="settings-overlay" onClick={() => setSettingsOpen(false)} />
          <div className="settings-panel">
            <div className="settings-hdr">
              <div className="settings-title">⚙️ Settings</div>
              <button className="modal-close" onClick={() => setSettingsOpen(false)}>✕</button>
            </div>
            <div className="settings-body">

              {/* APPEARANCE */}
              <div className="setting-group">
                <div className="setting-group-label">🎨 Appearance</div>

                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">🌙</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Dark Mode</div>
                      <div className="setting-row-desc">Easy on your eyes at night</div>
                    </div>
                  </div>
                  <Toggle on={darkMode} onChange={setDarkMode} />
                </div>

                <div className="setting-row" style={{ flexDirection:'column', alignItems:'stretch' }}>
                  <div className="setting-row-info" style={{ marginBottom:'.5rem' }}>
                    <div className="setting-row-icon">🔤</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Text Size</div>
                      <div className="setting-row-desc">Make text bigger for easier reading</div>
                    </div>
                  </div>
                  <div className="font-size-btns">
                    <button className={`font-size-btn${!largeFontSize ? ' active' : ''}`} onClick={() => setLargeFontSize(false)}>Normal</button>
                    <button className={`font-size-btn${largeFontSize ? ' active' : ''}`} onClick={() => setLargeFontSize(true)}>Large 🔍</button>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">📦</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Compact Cards</div>
                      <div className="setting-row-desc">Smaller food cards, see more items</div>
                    </div>
                  </div>
                  <Toggle on={compactMode} onChange={v => { setCompactMode(v); setLS('compactMode', v); }} />
                </div>
              </div>

              {/* NOTIFICATIONS */}
              <div className="setting-group">
                <div className="setting-group-label">🔔 Notifications & Display</div>

                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">🔊</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Payment Sound</div>
                      <div className="setting-row-desc">Plays a chime when payment is confirmed</div>
                    </div>
                  </div>
                  <Toggle on={soundEnabled} onChange={setSoundEnabled} />
                </div>

                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">⏱</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Show ETA</div>
                      <div className="setting-row-desc">Display estimated preparation time</div>
                    </div>
                  </div>
                  <Toggle on={showEta} onChange={setShowEta} />
                </div>

                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">💰</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Show Total in Cart Button</div>
                      <div className="setting-row-desc">Shows ₹ amount next to cart icon</div>
                    </div>
                  </div>
                  <Toggle on={showPriceInHeader} onChange={v => { setShowPriceInHeader(v); setLS('showPriceInHeader', v); }} />
                </div>
              </div>

              {/* PAYMENT */}
              <div className="setting-group">
                <div className="setting-group-label">💳 Payment Preference</div>
                <div style={{ padding:'.75rem 1rem', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:12, marginBottom:'.5rem' }}>
                  <div className="setting-row-title" style={{ marginBottom:'.5rem' }}>Default Payment Method</div>
                  <div className="font-size-btns">
                    <button className={`font-size-btn${defaultPayment === 'cod' ? ' active' : ''}`} onClick={() => { setDefaultPayment('cod'); setLS('defaultPayment','cod'); }}>💵 Cash on Delivery</button>
                    <button className={`font-size-btn${defaultPayment === 'upi' ? ' active' : ''}`} onClick={() => { setDefaultPayment('upi'); setLS('defaultPayment','upi'); }}>📱 UPI / Razorpay</button>
                  </div>
                  <div className="setting-row-desc" style={{ marginTop:'.4rem' }}>Auto-selects when you open checkout</div>
                </div>
              </div>

              {/* DELIVERY DEFAULTS */}
              <div className="setting-group">
                <div className="setting-group-label">📍 Saved Delivery Info</div>

                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">🚀</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Auto-fill on Checkout</div>
                      <div className="setting-row-desc">Pre-fill your saved name &amp; location</div>
                    </div>
                  </div>
                  <Toggle on={autoFillDelivery} onChange={v => { setAutoFillDelivery(v); setLS('autoFillDelivery', v); }} />
                </div>

                <div style={{ padding:'.75rem 1rem', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:12, marginBottom:'.5rem' }}>
                  <div className="setting-row-title" style={{ marginBottom:'.35rem' }}>👤 Default Name</div>
                  <input className="settings-input" placeholder="e.g. Rahul Sharma" value={tmpSavedName} onChange={e => setTmpSavedName(e.target.value)} />
                </div>

                <div style={{ padding:'.75rem 1rem', background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:12, marginBottom:'.5rem' }}>
                  <div className="setting-row-title" style={{ marginBottom:'.35rem' }}>📍 Default Location</div>
                  <input className="settings-input" placeholder="e.g. Room 204, Boys Hostel" value={tmpSavedLocation} onChange={e => setTmpSavedLocation(e.target.value)} />
                </div>
              </div>

              {/* ACCOUNT */}
              <div className="setting-group">
                <div className="setting-group-label">👤 Account</div>
                <div style={{ padding:'.75rem 1rem', background: darkMode ? 'rgba(255,122,51,.1)' : '#fff3ec', border:'1.5px solid rgba(255,122,51,.3)', borderRadius:12, marginBottom:'.5rem', display:'flex', alignItems:'center', gap:'.75rem' }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:'linear-gradient(135deg,#FF7A33,#FF5500)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:800, color:'white', flexShrink:0 }}>{avatarLetter}</div>
                  <div>
                    <div className="setting-row-title">{displayName}</div>
                    <div className="setting-row-desc" style={{ marginTop:2 }}>{user?.email}</div>
                    <div style={{ fontSize:'.68rem', color:'#FF7A33', fontWeight:700, marginTop:3 }}>{tier.icon} {tier.name} Member · {loyaltyPoints} pts</div>
                  </div>
                </div>
                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">📋</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">My Orders</div>
                      <div className="setting-row-desc">View your order history</div>
                    </div>
                  </div>
                  <button onClick={() => { setSettingsOpen(false); navigate('/orders'); }} style={{ padding:'.35rem .9rem', background:'linear-gradient(135deg,#FF7A33,#FF5500)', border:'none', color:'white', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', fontWeight:700, cursor:'pointer', boxShadow:'0 2px 8px rgba(255,107,0,.3)' }}>View</button>
                </div>
                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">🗑</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Clear Cart</div>
                      <div className="setting-row-desc">Remove all items from cart</div>
                    </div>
                  </div>
                  <button onClick={() => { clearCart(); setSettingsOpen(false); }} style={{ padding:'.35rem .9rem', background:'rgba(220,38,38,.12)', border:'1px solid rgba(220,38,38,.3)', color:'#dc2626', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>Clear</button>
                </div>
                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">🔄</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Reset All Settings</div>
                      <div className="setting-row-desc">Restore defaults (keeps account)</div>
                    </div>
                  </div>
                  <button onClick={() => {
                    setDarkMode(false); setLargeFontSize(false); setSoundEnabled(true);
                    setShowEta(true); setCompactMode(false); setDefaultPayment('cod');
                    setShowPriceInHeader(true); setAutoFillDelivery(true);
                    ['darkMode','largeFontSize','soundEnabled','showEta','compactMode','defaultPayment','showPriceInHeader','autoFillDelivery'].forEach(k => setLS(k, null));
                    setSettingsOpen(false);
                  }} style={{ padding:'.35rem .9rem', background:'rgba(107,114,128,.12)', border:'1px solid rgba(107,114,128,.3)', color:'var(--text3)', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>Reset</button>
                </div>
                <div className="setting-row">
                  <div className="setting-row-info">
                    <div className="setting-row-icon">🚪</div>
                    <div className="setting-row-text">
                      <div className="setting-row-title">Log Out</div>
                      <div className="setting-row-desc">Sign out of your account</div>
                    </div>
                  </div>
                  <button onClick={handleLogout} style={{ padding:'.35rem .9rem', background:'rgba(220,38,38,.12)', border:'1px solid rgba(220,38,38,.3)', color:'#dc2626', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', fontWeight:700, cursor:'pointer' }}>Logout</button>
                </div>
              </div>

              <button className="settings-save-btn" onClick={saveSettings}>
                💾 Save Settings
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          CHECKOUT MODAL
      ════════════════════════════════════════════════════════ */}
      {checkoutOpen && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && closeCheckout()}>
          <div className="modal-box">
            <div className="modal-hdr">
              <div className="modal-title">✅ Confirm Your Order</div>
              <button className="modal-close" onClick={closeCheckout}>✕</button>
            </div>

            <div className="modal-body">
              {/* Order Summary */}
              <div className="modal-summary">
                <div className="modal-sum-title">Order Summary</div>
                {cart.map(item => (
                  <div key={item.id} className="modal-item">
                    <span style={{ color:'var(--text2)' }}>{item.name} <span style={{ color:'var(--text4)' }}>×{item.quantity}</span></span>
                    <span style={{ fontWeight:700, color:'var(--text)' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="modal-total-row">
                  <span className="modal-total-lbl">Total</span>
                  <span className="modal-total-amt">₹{totalPrice.toFixed(2)}</span>
                </div>
                {showEta && eta && (
                  <div className="modal-eta-row">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Estimated: <strong>{eta}</strong>
                  </div>
                )}
              </div>

              {/* Delivery Details */}
              <div className="form-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Delivery Details
              </div>
              <div className="fld">
                <label>Recipient Name *</label>
                <input type="text" placeholder="Your full name" value={deliveryName} onChange={e => setDeliveryName(e.target.value)} />
              </div>
              <div className="fld">
                <label>Delivery Location *</label>
                <textarea rows="2" placeholder="Room, hostel, or location…" value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} />
              </div>

              {/* Payment Method */}
              <div className="form-section-title" style={{ marginTop:'1.5rem' }}>💳 Payment Method</div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:'1.25rem' }}>
                <button
                  onClick={() => handlePaymentMethodChange('upi')}
                  style={{ padding:'18px 14px', border: paymentMethod === 'upi' ? '2.5px solid #FF7A33' : '2px solid var(--border)', background: paymentMethod === 'upi' ? 'rgba(255,122,51,.1)' : 'var(--bg2)', borderRadius:14, textAlign:'left', cursor:'pointer', transition:'all .2s', position:'relative' }}
                >
                  {paymentMethod === 'upi' && (
                    <div style={{ position:'absolute', top:8, right:10, background:'#FF7A33', color:'white', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>✓</div>
                  )}
                  <div style={{ fontSize:26, marginBottom:8 }}>📱</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>Prepaid via UPI</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Pay via GPay, PhonePe, Paytm &amp; more</div>
                </button>

                <button
                  onClick={() => handlePaymentMethodChange('cod')}
                  style={{ padding:'18px 14px', border: paymentMethod === 'cod' ? '2.5px solid #FF7A33' : '2px solid var(--border)', background: paymentMethod === 'cod' ? 'rgba(255,122,51,.1)' : 'var(--bg2)', borderRadius:14, textAlign:'left', cursor:'pointer', transition:'all .2s', position:'relative' }}
                >
                  {paymentMethod === 'cod' && (
                    <div style={{ position:'absolute', top:8, right:10, background:'#FF7A33', color:'white', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800 }}>✓</div>
                  )}
                  <div style={{ fontSize:26, marginBottom:8 }}>💵</div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--text)' }}>Cash on Delivery</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:4 }}>Pay when food arrives at your location</div>
                </button>
              </div>

              {paymentMethod === 'cod' && (
                <div style={{ background: darkMode ? 'rgba(255,122,51,.1)' : '#fff7ed', border:'1px solid rgba(255,122,51,.25)', borderRadius:10, padding:'.65rem .9rem', marginBottom:'1rem', fontSize:'.8rem', color:'#d97706', display:'flex', gap:'.5rem' }}>
                  <span>💡</span>
                  <span>Please keep <strong>₹{totalPrice.toFixed(2)}</strong> ready. Carry exact change to help our delivery team.</span>
                </div>
              )}

              {/* ── UPI PAYMENT LINK SECTION ── */}
              {paymentMethod === 'upi' && (
                <div style={{ marginBottom:'1.25rem' }}>

                  {!linkData && !linkLoading && !linkExpired && (
                    <div style={{ textAlign:'center', background:'var(--bg4)', border:'2px dashed var(--border)', borderRadius:14, padding:'1.75rem 1rem' }}>
                      <div style={{ fontSize:'2.5rem', marginBottom:'.5rem' }}>📲</div>
                      <p style={{ fontSize:'.85rem', color:'var(--text3)', marginBottom:'1rem' }}>
                        Generate a <strong>secure Razorpay payment link</strong> for <strong style={{ color:'#FF7A33' }}>₹{totalPrice.toFixed(2)}</strong>
                      </p>
                      <button
                        onClick={generatePaymentLink}
                        disabled={!deliveryName.trim() || !deliveryLocation.trim()}
                        style={{ padding:'.75rem 1.75rem', background: (!deliveryName.trim() || !deliveryLocation.trim()) ? 'var(--bg3)' : 'linear-gradient(135deg,#FF7A33,#FF5500)', color: (!deliveryName.trim() || !deliveryLocation.trim()) ? 'var(--text4)' : 'white', border:'none', borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:'.9rem', fontWeight:700, cursor: (!deliveryName.trim() || !deliveryLocation.trim()) ? 'not-allowed' : 'pointer', boxShadow: (!deliveryName.trim() || !deliveryLocation.trim()) ? 'none' : '0 4px 14px rgba(255,107,0,.35)', display:'inline-flex', alignItems:'center', gap:'.45rem' }}
                      >
                        🔗 Generate Payment Link
                      </button>
                      {(!deliveryName.trim() || !deliveryLocation.trim()) && (
                        <p style={{ fontSize:'.72rem', color:'#f59e0b', marginTop:'.6rem' }}>⚠️ Fill in delivery details above first</p>
                      )}
                    </div>
                  )}

                  {linkLoading && (
                    <div style={{ textAlign:'center', padding:'2rem', background:'var(--bg4)', border:'2px dashed var(--border)', borderRadius:14 }}>
                      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTop:'3px solid #FF7A33', borderRadius:'50%', animation:'spinSmooth .8s linear infinite', margin:'0 auto .75rem' }} />
                      <p style={{ fontSize:'.85rem', color:'var(--text3)' }}>Generating payment link…</p>
                    </div>
                  )}

                  {linkExpired && (
                    <div style={{ background: darkMode ? 'rgba(220,38,38,.15)' : '#fff1f0', border:'1px solid rgba(220,38,38,.25)', borderRadius:14, padding:'1.25rem', textAlign:'center' }}>
                      <div style={{ fontSize:'1.75rem', marginBottom:'.4rem' }}>⏰</div>
                      <p style={{ fontSize:'.85rem', color:'#dc2626', fontWeight:600, marginBottom:'.75rem' }}>Payment link expired (10 min)</p>
                      <button onClick={generatePaymentLink} style={{ padding:'.6rem 1.25rem', background:'linear-gradient(135deg,#FF7A33,#FF5500)', color:'white', border:'none', borderRadius:9, fontFamily:"'DM Sans',sans-serif", fontSize:'.85rem', fontWeight:700, cursor:'pointer' }}>
                        🔗 Generate New Link
                      </button>
                    </div>
                  )}

                  {linkData && !linkExpired && (
                    <div style={{ background: darkMode ? 'rgba(255,122,51,.08)' : '#fffbeb', border:'1px solid #fcd34d', borderRadius:16, padding:'1.25rem', textAlign:'center' }}>

                      <div style={{ display:'inline-flex', alignItems:'center', background:'linear-gradient(135deg,#FF7A33,#FF5500)', color:'white', fontFamily:"'Playfair Display',serif", fontSize:'1.4rem', fontWeight:800, padding:'.45rem 1.2rem', borderRadius:999, boxShadow:'0 4px 14px rgba(255,107,0,.4)', marginBottom:'1rem' }}>
                        ₹{totalPrice.toFixed(2)}
                      </div>

                      {/* ── STEP 1: PAY BUTTON & UPI APPS ── */}
                      {!paymentConfirmed && (
                        <>
                          {/* BIG PAY BUTTON */}
                          <a
                            href={linkData.paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.6rem', background:'linear-gradient(135deg,#FF7A33,#FF5500)', color:'white', textDecoration:'none', padding:'1rem 1.5rem', borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:'1rem', fontWeight:700, boxShadow:'0 6px 20px rgba(255,107,0,.4)', marginBottom:'.5rem', width:'100%' }}
                          >
                            📱 Pay ₹{totalPrice.toFixed(2)} via UPI →
                          </a>
                          <p style={{ fontSize:'.75rem', color:'var(--text3)', marginBottom:'.5rem' }}>
                            Opens Razorpay → GPay, PhonePe, Paytm or any UPI app
                          </p>
                          <div style={{ display:'flex', justifyContent:'center', gap:6, flexWrap:'wrap', marginBottom:'1rem' }}>
                            {['GPay','PhonePe','Paytm','BHIM','Amazon Pay'].map(a => (
                              <span key={a} style={{ background:'var(--bg2)', border:'1.5px solid var(--border)', borderRadius:7, padding:'3px 9px', fontSize:'.7rem', fontWeight:700, color:'var(--text2)' }}>{a}</span>
                            ))}
                          </div>

                          {/* ── STEP 2: AFTER PAYING — check button ──
                          {!manualCheckFailed && (
                            <div style={{ background: darkMode ? 'rgba(22,163,74,.12)' : '#f0fdf4', border:'2px solid rgba(22,163,74,.35)', borderRadius:12, padding:'1rem', marginBottom:'.75rem' }}>
                              <p style={{ fontSize:'.8rem', color: darkMode ? '#86efac' : '#166534', fontWeight:600, marginBottom:'.6rem' }}>
                                ✅ After paying on Razorpay, tap below:
                              </p>
                              <button
                                onClick={handleManualCheck}
                                disabled={manualChecking}
                                style={{ padding:'.8rem 1.5rem', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', border:'none', borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:'.95rem', fontWeight:700, cursor: manualChecking ? 'not-allowed' : 'pointer', opacity: manualChecking ? .85 : 1, display:'inline-flex', alignItems:'center', gap:'.5rem', boxShadow:'0 4px 14px rgba(22,163,74,.35)', width:'100%', justifyContent:'center', transition:'all .2s' }}
                              >
                                {manualChecking
                                  ? <><span style={{ display:'inline-block', width:16, height:16, border:'2.5px solid rgba(255,255,255,.35)', borderTop:'2.5px solid white', borderRadius:'50%', animation:'spinSmooth .6s linear infinite', flexShrink:0 }} /> Checking payment… ({Math.ceil(9/1.5)}s)</>
                                  : <>✅ I've Paid — Verify Now</>}
                              </button>
                            </div>
                          )} */}

                          {/* ── STEP 3: Auto-detection FAILED → Self-confirm fallback ── */}
                          {manualCheckFailed && (
                            <div style={{ background: darkMode ? 'rgba(245,158,11,.12)' : '#fffbeb', border:'2px solid rgba(245,158,11,.5)', borderRadius:14, padding:'1.1rem', marginBottom:'.75rem' }}>
                              <div style={{ fontSize:'1.3rem', marginBottom:'.3rem' }}>⚠️</div>
                              <p style={{ fontSize:'.82rem', fontWeight:700, color:'#d97706', marginBottom:'.3rem' }}>
                                Payment not auto-detected
                              </p>
                              <p style={{ fontSize:'.75rem', color:'var(--text3)', marginBottom:'.9rem', lineHeight:1.5 }}>
                                This can happen if the webhook is delayed. If your UPI app shows the payment was <strong>deducted</strong>, tap below to proceed.
                              </p>
                              <div style={{ display:'flex', gap:'.6rem', flexDirection:'column' }}>
                                <button
                                  onClick={handleSelfConfirm}
                                  style={{ padding:'.85rem', background:'linear-gradient(135deg,#FF7A33,#FF5500)', color:'white', border:'none', borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:'.92rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(255,107,0,.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:'.4rem' }}
                                >
                                  ✅ Yes, I've Paid — Place My Order
                                </button>
                                <button
                                  onClick={handleManualCheck}
                                  disabled={manualChecking}
                                  style={{ padding:'.65rem', background:'var(--bg3)', color:'var(--text3)', border:'1.5px solid var(--border)', borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:'.82rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'.4rem' }}
                                >
                                  🔄 Try Auto-Detect Again
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Auto-polling status indicator */}
                          {!manualCheckFailed && (
                            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.45rem', padding:'.55rem .85rem', borderRadius:8, background: darkMode ? 'rgba(245,158,11,.08)' : '#fef9ec', border:'1px solid rgba(245,158,11,.25)', fontSize:'.75rem', fontWeight:600, color:'#d97706', marginBottom:'.6rem' }}>
                              <span style={{ display:'inline-block', width:10, height:10, border:'2px solid #d97706', borderTop:'2px solid transparent', borderRadius:'50%', animation:'spinSmooth .8s linear infinite', flexShrink:0 }} />
                              Auto-checking every 2 seconds in background…
                            </div>
                          )}
                        </>
                      )}

                      {/* ── PAYMENT CONFIRMED STATE ── */}
                      {paymentConfirmed && (
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'.6rem', padding:'1rem 1.25rem', borderRadius:12, background: darkMode ? 'rgba(255,122,51,.18)' : '#fff7f0', border:'2px solid rgba(255,122,51,.5)', fontSize:'.9rem', fontWeight:700, color: darkMode ? '#ffb380' : '#c2410c' }}>
                          <span style={{ fontSize:'1.4rem' }}>✅</span>
                          <div>
                            <div>Payment Confirmed!</div>
                            <div style={{ fontSize:'.75rem', fontWeight:500, opacity:.8, marginTop:2 }}>Tap "Confirm Order" below to place your order</div>
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop:'.6rem' }}>
                        <button onClick={generatePaymentLink} style={{ background:'none', border:'none', color:'var(--text3)', fontSize:'.72rem', fontWeight:600, cursor:'pointer', textDecoration:'underline' }}>
                          🔄 Generate new link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ACTION BUTTONS ── */}
              <div className="modal-actions">
                <button className="cancel-btn" onClick={closeCheckout}>← Edit Cart</button>

                {paymentMethod === 'cod' && (
                  <button
                    disabled={placing || !deliveryName.trim() || !deliveryLocation.trim()}
                    onClick={placeOrder}
                    className="action-btn-orange"
                    style={{ opacity: placing ? .7 : 1, cursor: placing ? 'not-allowed' : 'pointer' }}
                  >
                    {placing ? '⏳ Placing…' : `💵 Place COD Order · ₹${totalPrice.toFixed(2)}`}
                  </button>
                )}

                {paymentMethod === 'upi' && paymentConfirmed && (
                  <button disabled={placing} onClick={placeOrder} className="action-btn-green" style={{ opacity: placing ? .7 : 1, cursor: placing ? 'not-allowed' : 'pointer' }}>
                    {placing ? '⏳ Placing…' : <>✅ Confirm Order · ₹{totalPrice.toFixed(2)}</>}
                  </button>
                )}

                {paymentMethod === 'upi' && !paymentConfirmed && (
                  <div className="action-btn-locked">🔒 Waiting for Payment…</div>
                )}

                {!paymentMethod && (
                  <div className="action-btn-locked">Select Payment Method</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          RECEIPT SUCCESS MODAL
      ════════════════════════════════════════════════════════ */}
      {receiptData && (
        <div className="modal-bg">
          <div className="receipt-modal-box">
            <div className="rm-header">
              <div style={{ position:'relative', zIndex:1, textAlign:'center', padding:'1.5rem 0 0' }}>
                <div className="rm-glow-logo">
                  <div className="rm-logo-circle">
                    <svg width="50" height="50" viewBox="0 0 52 52" fill="none">
                      <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z" fill="white"/>
                      <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
                      <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.3)"/>
                    </svg>
                  </div>
                </div>
                <div className="rm-brand">Annapurna</div>
                <div className="rm-brand-sub">Smart Canteen</div>
              </div>
              <svg className="rm-wave" viewBox="0 0 520 36" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M0,18 C100,36 200,0 300,18 C400,36 450,8 520,18 L520,36 L0,36 Z" fill={darkMode ? '#1f2937' : 'white'}/>
              </svg>
            </div>
            <div className="rm-success">
              <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>✓</div>
              <div className="rm-success-text">Order Confirmed Successfully!</div>
            </div>
            <div className="rm-body">
              <div className="rm-order-meta">
                <div>
                  <div style={{ fontSize:'.68rem', fontWeight:600, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.5px' }}>Order ID</div>
                  <div className="rm-order-id">#{receiptData.orderId.slice(-8).toUpperCase()}</div>
                </div>
                <div style={{ textAlign:'right', fontSize:'.75rem', color:'var(--text3)', lineHeight:1.7 }}>
                  <div>{formatDate(receiptData.date)}</div>
                  <div>{formatTime(receiptData.date)}</div>
                </div>
              </div>
              <div className="rm-info-grid">
                <div className="rm-info-box"><div className="rm-info-lbl">👤 Recipient</div><div className="rm-info-val">{receiptData.deliveryName}</div></div>
                <div className="rm-info-box"><div className="rm-info-lbl">📍 Delivery To</div><div className="rm-info-val">{receiptData.deliveryLocation}</div></div>
              </div>
              <div className="rm-pay-row">
                <span style={{ fontSize:'.82rem', fontWeight:600, color:'var(--text2)' }}>💳 Payment</span>
                {receiptData.paymentMethod === 'upi' ? <span className="rm-upi-badge">📱 UPI Prepaid</span> : <span className="rm-cod-badge">💵 Cash on Delivery</span>}
              </div>
              {showEta && receiptData.eta && (
                <div style={{ display:'flex', alignItems:'center', gap:'.5rem', background: darkMode ? 'rgba(245,158,11,.12)' : '#fef3c7', border:'1px solid rgba(245,158,11,.3)', borderRadius:10, padding:'.65rem 1rem', marginBottom:'1.25rem', fontSize:'.82rem', fontWeight:600, color:'#d97706' }}>
                  ⏱ Estimated Delivery: <strong style={{ marginLeft:4 }}>{receiptData.eta}</strong>
                </div>
              )}
              <div style={{ fontSize:'.7rem', fontWeight:700, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'.7rem' }}>Items Ordered</div>
              {receiptData.items.map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.55rem 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.55rem' }}>
                    <div style={{ background:'linear-gradient(135deg,#FF7A33,#FF5500)', color:'white', fontSize:'.65rem', fontWeight:800, width:22, height:22, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{item.quantity}</div>
                    <div>
                      <div style={{ fontSize:'.85rem', fontWeight:600, color:'var(--text2)' }}>{item.name}</div>
                      <div style={{ fontSize:'.68rem', color:'var(--text4)', marginTop:1 }}>₹{item.price.toFixed(2)} each</div>
                    </div>
                  </div>
                  <div style={{ fontSize:'.88rem', fontWeight:700, color:'var(--text)' }}>₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div className="rm-totals">
                <div className="rm-total-line"><span>Subtotal</span><span>₹{receiptData.total.toFixed(2)}</span></div>
                <div className="rm-total-line"><span>Delivery</span><span style={{ color:'#16a34a', fontWeight:700 }}>FREE</span></div>
                <div className="rm-total-line grand">
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1rem', fontWeight:700, color:'var(--text)' }}>{receiptData.paymentMethod === 'upi' ? 'Total Paid' : 'Total to Pay'}</span>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem', fontWeight:800, color:'#FF7A33' }}>₹{receiptData.total.toFixed(2)}</span>
                </div>
              </div>
              {receiptData.pointsEarned > 0 && (
                <div style={{ background: darkMode ? 'rgba(255,122,51,.1)' : 'linear-gradient(135deg,#fff3ec,#fef9f5)', border:'1px solid rgba(255,122,51,.25)', borderRadius:12, padding:'.8rem 1rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:'.8rem', color:'var(--text3)' }}>You earned <strong style={{ color:'#FF7A33' }}>+{receiptData.pointsEarned} loyalty points</strong>!</div>
                  <div style={{ background:'linear-gradient(135deg,#FF7A33,#FF5500)', color:'white', fontSize:'.72rem', fontWeight:800, padding:'.28rem .75rem', borderRadius:999 }}>⭐ +{receiptData.pointsEarned} pts</div>
                </div>
              )}
              <div style={{ textAlign:'center', padding:'1rem 0 .5rem' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'.4rem' }}>{receiptData.paymentMethod === 'upi' ? '🎉' : '🙏'}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.4rem', fontWeight:800, color:'var(--text)', marginBottom:'.35rem' }}>Thank You!</div>
                <div style={{ fontSize:'.82rem', color:'var(--text3)', lineHeight:1.65 }}>
                  {receiptData.paymentMethod === 'upi'
                    ? <>Your payment was received. Food is being <strong style={{ color:'#FF7A33' }}>prepared with love.</strong></>
                    : <>Please keep <strong>₹{receiptData.total.toFixed(2)} ready</strong> for cash payment on delivery.</>}
                  <br/>We hope to see you again at Annapurna Smart Canteen!
                </div>
              </div>
            </div>
            <div className="rm-actions">
              <button className="rm-download-btn" onClick={() => downloadReceipt(receiptData)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                Download Receipt
              </button>
              <button className="rm-orders-btn" onClick={() => { setReceiptData(null); navigate('/orders'); }}>
                📋 View My Orders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="mhdr">
        <div className="mhdr-in">
          <div className="logo-wrap">
            <div className="logo-icon">
              <svg width="26" height="26" viewBox="0 0 52 52" fill="none">
                <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z" fill="white"/>
                <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
                <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.3)"/>
                <circle cx="26" cy="34" r="2" fill="rgba(255,107,0,0.5)"/>
              </svg>
            </div>
            <div><div className="logo-brand">Annapurna</div><div className="logo-sub">Smart Canteen</div></div>
          </div>
          <div className="nav-right">
            {/* ── Username chip ── */}
            <div className="user-chip">
              <div className="user-avatar">{avatarLetter}</div>
              <div>
                <div style={{ fontSize:'.65rem', color:'var(--text4)', fontWeight:500, lineHeight:1 }}>Welcome back</div>
                <div className="user-name">{displayName}</div>
              </div>
            </div>

            <div className="loy-chip">
              <span>{tier.icon}</span>
              <div><div className="loy-pts">{loyaltyPoints} pts</div><div className="loy-lbl">{tier.name}</div></div>
            </div>

            <button className="nav-btn active" onClick={() => navigate('/menu')}>🍽️ Menu</button>
            <button className="nav-btn" onClick={() => navigate('/orders')}>📄 Orders</button>
            {isAdmin && <button className="nav-btn" style={{ background:'rgba(255,122,51,.15)', color:'#FF7A33' }} onClick={() => navigate('/admin')}>⚙️ Admin</button>}

            {/* Settings button */}
            <button className="nav-btn settings-btn" onClick={openSettings}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Settings
            </button>

            <button className={`cart-trigger`} onClick={() => setCartOpen(o => !o)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
              {totalItems > 0 && showPriceInHeader ? `Cart · ₹${totalPrice.toFixed(0)}` : totalItems > 0 ? `Cart (${totalItems})` : 'Cart'}
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── LOYALTY BANNER ── */}
      <section className="loy-banner">
        <div className="loy-inner">
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <span style={{ fontSize:'1.75rem' }}>{tier.icon}</span>
            <div>
              <span className="loy-tier-badge" style={{ background:tier.bg, color:tier.color }}>{tier.name} Member</span>
              <div className="loy-pts-big" style={{ marginTop:4 }}>{loyaltyPoints.toLocaleString()}</div>
              <div className="loy-pts-lbl">Loyalty Points</div>
            </div>
          </div>
          {nextAt && (
            <div style={{ flex:1, maxWidth:280 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:'.68rem', color:'rgba(255,255,255,0.5)' }}>{loyaltyPoints} pts</span>
                <span style={{ fontSize:'.68rem', color:'rgba(255,255,255,0.5)' }}>{nextAt} pts → next tier</span>
              </div>
              <div className="loy-prog-bar"><div className="loy-prog-fill" style={{ width:`${pct}%` }} /></div>
            </div>
          )}
          <div>
            <div className="loy-tip">Earn <span>10 pts</span> for every ₹100 spent</div>
            <div className="loy-tip" style={{ marginTop:3 }}>🥈 <span>200 pts</span> = Silver &nbsp;·&nbsp; 🥇 <span>500 pts</span> = Gold</div>
          </div>
        </div>
      </section>

      {/* ── HERO ── */}
      <section className="mhero">
        <div className="hero-in">
          <div className="hero-eye"><span>✦</span> Fresh &amp; Vegetarian</div>
          <h1 className="hero-title">Today's <span>Menu</span></h1>
          <p className="hero-sub">Freshly prepared Indian dishes, made with love every day</p>
        </div>
      </section>

      {/* ── PAGE BODY ── */}
      <div className="page-body">
        <div className="menu-area">
          <div className="mmain">
            <div className="search-wrap">
              <span className="search-ico"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg></span>
              <input className="search-inp" type="text" placeholder="Search dishes…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="cat-row">
              {categories.map(cat => (
                <button key={cat} className={`cat-pill${activeCategory === cat ? ' active' : ''}`} onClick={() => setActiveCategory(cat)}>
                  <span>{CAT_ICONS[cat]}</span> {cat}
                </button>
              ))}
            </div>
            <div className="sec-label">
              {activeCategory === 'All' ? 'All Dishes' : activeCategory}
              {filteredMenu.length > 0 && <span style={{ fontSize:'.8rem', fontFamily:"'DM Sans',sans-serif", fontWeight:500, color:'var(--text4)', marginLeft:'.35rem' }}>({filteredMenu.length})</span>}
            </div>
            {filteredMenu.length === 0 ? (
              <div className="empty-st">
                <div style={{ fontSize:'3.5rem', marginBottom:'.75rem' }}>🍽️</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', color:'var(--text3)' }}>No dishes found</div>
              </div>
            ) : (
              <div className="mgrid">
                {filteredMenu.map(item => {
                  const oos  = item.inStock === false;
                  const qty  = cartQty(item.id);
                  const prep = item.prepTime || CATEGORY_PREP[item.category] || 10;
                  return (
                    <div key={item.id} className={`mcard${oos ? ' oos' : ''}`}>
                      <div className="cimg-wrap">
                        <img className="cimg" src={item.imageUrl || `https://via.placeholder.com/300x175/2d1f0e/FF7A33?text=${encodeURIComponent(item.name)}`} alt={item.name} />
                        {oos && <div className="oos-overlay"><span className="oos-tag">Out of Stock</span></div>}
                        <div className="cbadge">{item.category}</div>
                        <div className="cprice">₹{item.price.toFixed(2)}</div>
                      </div>
                      <div className="cbody">
                        <div className="cname">{item.name}</div>
                        <div className="cdesc">{item.description || 'A freshly prepared vegetarian delight.'}</div>
                        {showEta && (
                          <div className="prep-pill">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            ~{prep} min prep
                          </div>
                        )}
                        <div className="card-bottom">
                          {oos ? (
                            <button className="add-btn" disabled>❌ Out of Stock</button>
                          ) : qty === 0 ? (
                            <button className="add-btn" onClick={() => addToCart(item)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                              Add to Cart
                            </button>
                          ) : (
                            <div className="qty-ctrl">
                              <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                              <span className="qty-num">{qty}</span>
                              <button className="qty-btn" onClick={() => updateQty(item.id, +1)}>+</button>
                            </div>
                          )}
                          <button className="dna-btn" title="View Food DNA" onClick={() => setDnaItem(item)}>🧬</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── CART DRAWER ── */}
        <div className={`cart-drawer${cartOpen ? ' open' : ''}`}>
          <div className="drawer-inner">
            <div className="drawer-hdr">
              <div className="drawer-title">🛒 Your Cart {totalItems > 0 && <span className="drawer-cnt">{totalItems} item{totalItems > 1 ? 's' : ''}</span>}</div>
              <button className="drawer-close" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            {showEta && eta && (
              <div className="eta-strip">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Estimated delivery: <strong>{eta}</strong>
              </div>
            )}
            <div className="drawer-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <div style={{ fontSize:'3rem', opacity:.5 }}>🛒</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', color:'var(--text3)' }}>Your cart is empty</div>
                  <p style={{ fontSize:'.82rem', color:'var(--text4)' }}>Add dishes from the menu</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="ci-row">
                  <img className="ci-img" src={item.imageUrl || `https://via.placeholder.com/52/2d1f0e/FF7A33?text=${encodeURIComponent(item.name[0])}`} alt={item.name} />
                  <div className="ci-info">
                    <div className="ci-name">{item.name}</div>
                    <div className="ci-unit">₹{item.price.toFixed(2)} each</div>
                    <button className="ci-remove-btn" onClick={() => removeItem(item.id)}>Remove</button>
                  </div>
                  <div className="ci-right">
                    <div className="ci-price">₹{(item.price * item.quantity).toFixed(2)}</div>
                    <div className="ci-qty-ctrl">
                      <button className={`ci-qty-btn${item.quantity === 1 ? ' rem' : ''}`} onClick={() => updateQty(item.id, -1)}>{item.quantity === 1 ? '🗑' : '−'}</button>
                      <span className="ci-qty-num">{item.quantity}</span>
                      <button className="ci-qty-btn" onClick={() => updateQty(item.id, +1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="drawer-footer">
                {pointsToEarn > 0 && (
                  <div className="pts-preview">
                    <div className="pts-preview-l">Earn <span>+{pointsToEarn} pts</span> on this order</div>
                    <span className="pts-earn-badge">⭐ {pointsToEarn} pts</span>
                  </div>
                )}
                <div className="total-row">
                  <span className="total-lbl">Total</span>
                  <span className="total-amt">₹{totalPrice.toFixed(2)}</span>
                </div>
                <button className="clear-cart-btn" onClick={clearCart}>
                  🗑 Clear entire cart
                </button>
                <button className="checkout-btn" onClick={() => setCheckoutOpen(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Checkout · ₹{totalPrice.toFixed(2)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOD DNA PANEL ── */}
      {dnaItem && (
        <FoodDNAPanel
          item={dnaItem}
          dark={darkMode}
          onClose={() => setDnaItem(null)}
        />
      )}
    </>
  );
}