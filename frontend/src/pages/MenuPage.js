import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const API = 'http://localhost:5000';

// ─── Helpers ────────────────────────────────────────────────────────────────
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
const CAT_ICONS = { All: '🍽️', Breakfast: '🌅', Lunch: '🍱', Snacks: '🥨', Beverages: '🥤', Desserts: '🍮' };
const formatDate = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });


// ─── Receipt Download ────────────────────────────────────────────────────────
// Generates a beautiful full-page HTML receipt, opens it in a hidden iframe,
// triggers the browser print dialog (Save as PDF works in all modern browsers).
// ─── UPDATED RECEIPT DOWNLOAD FUNCTION ───────────────────────────────────────
// Replace your existing downloadReceipt function with this one.
// This version creates a clean, light-themed receipt that **exactly matches** the screenshot you provided.
// - Logo now has a soft orange glow (just like your image)
// - Uses the exact SVG from the logo you pasted (steam bowl in orange circle)
// - Light modern design, perfect spacing, green "FREE", orange accents, Inter font for clean look
// - Fully responsive for print → Save as PDF looks beautiful

function downloadReceipt(order) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Receipt – Annapurna Smart Canteen</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: 'Inter', system-ui, sans-serif; 
    background: #f8f6f2; 
    display: flex; 
    justify-content: center; 
    padding: 20px 10px; 
    min-height: 100vh;
  }
  .receipt {
    width: 390px;
    max-width: 100%;
    background: white;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.09);
    border: 1px solid #f0ede8;
  }
  /* Top bar */
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 22px;
    font-size: 13px;
    color: #666;
    border-bottom: 1px solid #f0ede8;
  }
  /* Logo Section */
.logo-section {
  padding: 32px 20px 20px;
  text-align: center;
}

.glow-logo {
  width: 118px;
  height: 118px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 
    0 0 35px rgba(255, 122, 51, 0.85),
    0 0 60px rgba(255, 122, 51, 0.45);
}

.logo-circle {
  width: 88px;
  height: 88px;
  background: #FF7A33;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    inset 0 4px 12px rgba(0,0,0,0.18),
    0 8px 20px rgba(0,0,0,0.15);
}

.brand {
  font-family: 'Playfair Display', serif;
  font-size: 29px;
  font-weight: 800;
  color: #2d1f0e;
  line-height: 1;
  margin-bottom: 3px;
}

.brand-sub {
  font-size: 11.8px;
  font-weight: 700;
  letter-spacing: 3.2px;
  color: #FF7A33;
  text-transform: uppercase;
}
  /* Success */
  .success {
    background: #f0fdf4;
    color: #166534;
    padding: 16px;
    text-align: center;
    font-weight: 600;
    font-size: 15.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
  }
  .check {
    width: 28px;
    height: 28px;
    background: #4ade80;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    flex-shrink: 0;
  }
  /* Order Meta */
  .order-meta {
    display: flex;
    justify-content: space-between;
    padding: 22px 22px 18px;
    border-bottom: 2px dashed #e5e7eb;
  }
  .order-left .label {
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .order-id {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    letter-spacing: 1.2px;
    margin-top: 3px;
  }
  .order-right {
    text-align: right;
    font-size: 13.5px;
    color: #6b7280;
    line-height: 1.5;
  }
  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    padding: 0 22px 22px;
  }
  .info-box {
    background: #faf9f6;
    border: 1px solid #ede8e0;
    border-radius: 14px;
    padding: 14px 16px;
  }
  .info-label {
    font-size: 11px;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 5px;
  }
  .info-val {
    font-size: 14.5px;
    font-weight: 500;
    color: #374151;
    line-height: 1.45;
  }
  /* ETA */
  .eta-box {
    margin: 0 22px 22px;
    background: linear-gradient(90deg, #fef3c7, #fffbeb);
    border: 1px solid #fcd34d;
    border-radius: 14px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14.5px;
    font-weight: 600;
    color: #d97706;
  }
  /* Items */
  .items-section {
    padding: 0 22px;
  }
  .items-title {
    font-size: 12px;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f3f4f6;
  }
  .item-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px 0;
    border-bottom: 1px solid #f3f4f6;
  }
  .item-row:last-child { border-bottom: none; }
  .item-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
  }
  .item-qty {
    font-size: 17px;
    font-weight: 700;
    color: #FF7A33;
    min-width: 22px;
  }
  .item-name {
    font-weight: 600;
    color: #1f2937;
  }
  .item-unit {
    font-size: 12.5px;
    color: #9ca3af;
  }
  .item-price {
    font-size: 15.5px;
    font-weight: 700;
    color: #1f2937;
  }
  /* Totals */
  .totals {
    margin: 22px;
    background: #faf9f6;
    border: 1px solid #ede8e0;
    border-radius: 16px;
    padding: 18px 20px;
  }
  .total-line {
    display: flex;
    justify-content: space-between;
    font-size: 14.5px;
    color: #6b7280;
    padding: 7px 0;
  }
  .total-line.grand {
    border-top: 2px solid #fed7aa;
    margin-top: 8px;
    padding-top: 14px;
    font-size: 17.5px;
    color: #2d1f0e;
  }
  .total-line.grand .grand-val {
    color: #FF7A33;
    font-weight: 800;
  }
  /* Loyalty */
  .pts-box {
    margin: 0 22px 22px;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  /* Thank You */
  .thankyou {
    text-align: center;
    padding: 30px 22px 40px;
    color: #6b7280;
    font-size: 15px;
  }
  .thankyou strong { color: #FF7A33; }
  /* Footer */
  .footer {
    text-align: center;
    padding: 18px 22px;
    font-size: 11.5px;
    color: #9ca3af;
    border-top: 1px solid #f3f4f6;
    line-height: 1.6;
  }
  @media print {
    body { background: white; padding: 0; }
    .receipt { box-shadow: none; border-radius: 0; width: 100%; }
  }
</style>
</head>
<body>
<div class="receipt">
  <!-- Top bar -->
  <div class="top-bar">
    <div>2/20/26, 11:22 AM</div>
    <div style="font-weight:600;color:#1f2937">Receipt – Annapurna Smart Canteen</div>
  </div>

 <!-- Logo -->
<div class="logo-section">
  <div class="glow-logo">
    <div class="logo-circle">
      <svg width="88" height="88" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Soft outer glow ring (exact dashed look from your logo) -->
        <circle 
          cx="26" 
          cy="26" 
          r="25.5" 
          fill="none" 
          stroke="#FFEDD5" 
          stroke-width="2" 
          stroke-dasharray="1.5,3"/>

        <!-- Main vibrant orange circle -->
        <circle 
          cx="26" 
          cy="26" 
          r="23" 
          fill="#FF7A33"/>

        <!-- Steam lines (exactly matching your logo) -->
        <path 
          d="M14.5 13.5 Q13 9.5 15.5 7.5" 
          stroke="#FFFFFF" 
          stroke-width="2.6" 
          stroke-linecap="round"/>
        <path 
          d="M26 11.8 Q25 7.5 27.8 6" 
          stroke="#FFFFFF" 
          stroke-width="2.6" 
          stroke-linecap="round"/>
        <path 
          d="M37.5 13.5 Q39 9.5 36.5 7.5" 
          stroke="#FFFFFF" 
          stroke-width="2.6" 
          stroke-linecap="round"/>

        <!-- Bowl body (clean white bowl just like your image) -->
        <path 
          d="M10 29 Q10 40.5 26 40.5 Q42 40.5 42 29" 
          fill="#FAFAFA" 
          stroke="#F5F5F5" 
          stroke-width="1.5"/>

        <!-- Bowl rim highlight -->
        <ellipse 
          cx="26" 
          cy="29.2" 
          rx="15.2" 
          ry="3.6" 
          fill="#F8F8F8"/>

        <!-- Subtle inner bowl shading -->
        <ellipse 
          cx="26" 
          cy="29.8" 
          rx="12.8" 
          ry="2.4" 
          fill="#FFAA77" 
          opacity="0.22"/>

        <!-- Bowl base shadow -->
        <ellipse 
          cx="26" 
          cy="40.8" 
          rx="13.5" 
          ry="1.8" 
          fill="#E5E5E5" 
          opacity="0.65"/>
      </svg>
    </div>
  </div>
  
  <div class="brand">Annapurna</div>
  <div class="brand-sub">SMART CANTEEN</div>
</div>

  <!-- Success -->
  <div class="success">
    <div class="check">✓</div>
    Order Confirmed Successfully!
  </div>

  <!-- Order ID + Date -->
  <div class="order-meta">
    <div class="order-left">
      <div class="label">ORDER ID</div>
      <div class="order-id">#${order.orderId.slice(-8).toUpperCase()}</div>
    </div>
    <div class="order-right">
      <div>${formatDate(order.date)}</div>
      <div>${formatTime(order.date)}</div>
    </div>
  </div>

  <!-- Recipient + Delivery -->
  <div class="info-grid">
    <div class="info-box">
      <div class="info-label">👤 RECIPIENT</div>
      <div class="info-val">${order.deliveryName}</div>
    </div>
    <div class="info-box">
      <div class="info-label">📍 DELIVERY TO</div>
      <div class="info-val">${order.deliveryLocation}</div>
    </div>
  </div>

  <!-- ETA -->
  ${order.eta ? `
  <div class="eta-box">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.75">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
    Estimated Delivery Time: <strong>${order.eta}</strong>
  </div>` : ''}

  <!-- Items -->
  <div class="items-section">
    <div class="items-title">ITEMS ORDERED</div>
    ${order.items.map(item => `
    <div class="item-row">
      <div class="item-left">
        <div class="item-qty">${item.quantity}</div>
        <div>
          <div class="item-name">${item.name}</div>
          <div class="item-unit">₹${item.price.toFixed(2)} each</div>
        </div>
      </div>
      <div class="item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
    </div>`).join('')}
  </div>

  <!-- Totals -->
  <div class="totals">
    <div class="total-line"><span>Subtotal</span><span>₹${order.total.toFixed(2)}</span></div>
    <div class="total-line"><span>Delivery</span><span style="color:#15803d;font-weight:700">FREE</span></div>
    <div class="total-line grand">
      <span style="font-weight:700">Total Paid</span>
      <span class="grand-val">₹${order.total.toFixed(2)}</span>
    </div>
  </div>

  <!-- Loyalty Points -->
  ${order.pointsEarned > 0 ? `
  <div class="pts-box">
    <div style="font-size:14.5px;color:#9ca3af">You earned <strong style="color:#c2410c">+${order.pointsEarned} loyalty points</strong>!</div>
    <div style="background:#FF7A33;color:white;padding:6px 18px;border-radius:9999px;font-size:13px;font-weight:700">⭐ ${order.pointsEarned} pts</div>
  </div>` : ''}

  <!-- Thank You -->
  <div class="thankyou">
    🙏 <strong>Thank You!</strong><br>
    Your delicious food is being prepared with love.<br>
    <strong>Sit back and relax</strong> — we'll have it ready for you soon.
  </div>

  <!-- Footer -->
  <div class="footer">
    Annapurna Smart Canteen • SURAT, Gujarat<br>
    Support: Annapurna@canteen.edu.in<br>
    © ${new Date().getFullYear()} All rights reserved
  </div>
</div>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=650,height=920');
  w.document.write(html);
  w.document.close();
  w.onload = () => {
    setTimeout(() => {
      w.focus();
      w.print();
    }, 700);
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'DM Sans', sans-serif; background: #faf9f6; }

/* HEADER */
.mhdr { position: sticky; top: 0; z-index: 200; background: rgba(255,255,255,0.95); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,122,51,0.1); box-shadow: 0 2px 24px rgba(0,0,0,0.07); }
.mhdr-in { max-width: 1400px; margin: 0 auto; padding: .8rem 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.logo-wrap { display: flex; align-items: center; gap: .75rem; }
.logo-icon { width: 42px; height: 42px; background: linear-gradient(145deg,#FF7A33,#FF5500); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(255,107,0,.35); flex-shrink: 0; }
.logo-brand { font-family: 'Playfair Display',serif; font-size: 1.2rem; font-weight: 800; color: #2d1f0e; line-height: 1; }
.logo-sub { font-size: .62rem; color: #FF7A33; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; }
.nav-right { display: flex; align-items: center; gap: .45rem; flex-wrap: wrap; }
.nav-btn { display: flex; align-items: center; gap: .4rem; padding: .48rem .95rem; background: #f5f5f0; border: 1.5px solid transparent; border-radius: 10px; font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 600; color: #374151; cursor: pointer; transition: all .2s; white-space: nowrap; }
.nav-btn:hover { background: #fff; border-color: rgba(255,122,51,.3); color: #FF7A33; }
.nav-btn.active { background: #fff3ec; border-color: rgba(255,122,51,.4); color: #FF7A33; }
.nav-btn.logout { background: #fff1f0; color: #dc2626; border-color: rgba(220,38,38,.2); }
.loy-chip { display: flex; align-items: center; gap: .5rem; background: white; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: .4rem .85rem; }
.loy-pts { font-size: .85rem; font-weight: 800; color: #2d1f0e; }
.loy-lbl { font-size: .68rem; color: #9ca3af; font-weight: 500; }
.cart-trigger { position: relative; display: flex; align-items: center; gap: .5rem; padding: .5rem 1.15rem; background: linear-gradient(135deg,#FF7A33,#FF5500); border: none; border-radius: 10px; font-family: 'DM Sans',sans-serif; font-size: .85rem; font-weight: 700; color: white; cursor: pointer; box-shadow: 0 4px 14px rgba(255,107,0,.35); transition: all .2s; }
.cart-trigger:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(255,107,0,.45); }
.cart-badge { position: absolute; top: -8px; right: -8px; background: #2d1f0e; color: white; font-size: .68rem; font-weight: 800; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid white; }

/* LOYALTY BANNER */
.loy-banner { background: linear-gradient(135deg,#2d1f0e,#3d2a14,#4a3020); padding: 1rem 2rem; position: relative; overflow: hidden; }
.loy-banner::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 15% 50%,rgba(255,122,51,.2),transparent 55%), radial-gradient(ellipse at 85% 50%,rgba(255,107,0,.12),transparent 55%); }
.loy-inner { max-width: 1400px; margin: 0 auto; position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
.loy-tier-badge { padding: .28rem .75rem; border-radius: 999px; font-size: .72rem; font-weight: 800; letter-spacing: .5px; }
.loy-pts-big { font-family: 'Playfair Display',serif; font-size: 1.4rem; font-weight: 800; color: white; line-height: 1; }
.loy-pts-lbl { font-size: .7rem; color: rgba(255,255,255,.5); font-weight: 500; }
.loy-prog-bar { height: 5px; background: rgba(255,255,255,.15); border-radius: 999px; overflow: hidden; margin-top: 5px; }
.loy-prog-fill { height: 100%; background: linear-gradient(90deg,#FF7A33,#FF5500); border-radius: 999px; transition: width .8s ease; }
.loy-tip { font-size: .7rem; color: rgba(255,255,255,.55); }
.loy-tip span { color: #FFAA77; font-weight: 700; }

/* HERO */
.mhero { background: linear-gradient(135deg,#2d1f0e,#3d2a14,#4a3020); padding: 2.75rem 2rem; text-align: center; position: relative; overflow: hidden; }
.mhero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 50%,rgba(255,122,51,.15),transparent 60%); }
.hero-in { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
.hero-eye { display: inline-flex; align-items: center; gap: .5rem; background: rgba(255,122,51,.2); border: 1px solid rgba(255,122,51,.35); color: #FFAA77; font-size: .72rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: .3rem .8rem; border-radius: 999px; margin-bottom: .85rem; }
.hero-title { font-family: 'Playfair Display',serif; font-size: 2.6rem; font-weight: 800; color: white; line-height: 1.1; margin-bottom: .6rem; }
.hero-title span { color: #FF7A33; }
.hero-sub { font-size: .95rem; color: rgba(255,255,255,.55); }

/* PAGE BODY */
.page-body { display: flex; align-items: flex-start; }
.menu-area { flex: 1; min-width: 0; }
.mmain { padding: 2rem 2rem 3rem; }

/* SEARCH */
.search-wrap { position: relative; margin-bottom: 1.5rem; }
.search-ico { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
.search-inp { width: 100%; padding: .85rem 1rem .85rem 2.75rem; border: 1.5px solid #e5e7eb; border-radius: 12px; font-family: 'DM Sans',sans-serif; font-size: .95rem; color: #1f2937; background: white; outline: none; box-shadow: 0 2px 8px rgba(0,0,0,.04); transition: border-color .2s,box-shadow .2s; }
.search-inp:focus { border-color: #FF7A33; box-shadow: 0 0 0 3px rgba(255,122,51,.12); }
.search-inp::placeholder { color: #c4c4c4; }

/* CATEGORY */
.cat-row { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 2rem; }
.cat-pill { padding: .48rem 1.1rem; background: white; border: 1.5px solid #e5e7eb; border-radius: 999px; font-family: 'DM Sans',sans-serif; font-size: .82rem; font-weight: 600; color: #6b7280; cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: .3rem; }
.cat-pill:hover { border-color: rgba(255,122,51,.4); color: #FF7A33; }
.cat-pill.active { background: linear-gradient(135deg,#FF7A33,#FF5500); border-color: transparent; color: white; box-shadow: 0 4px 12px rgba(255,107,0,.3); }
.sec-label { font-family: 'Playfair Display',serif; font-size: 1.3rem; font-weight: 700; color: #2d1f0e; margin-bottom: 1.1rem; display: flex; align-items: center; gap: .6rem; }
.sec-label::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }

/* GRID */
.mgrid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 1.25rem; }

/* CARD */
.mcard { background: white; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,.06); border: 1px solid rgba(0,0,0,.05); overflow: hidden; display: flex; flex-direction: column; transition: transform .22s,box-shadow .22s; }
.mcard:not(.oos):hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,.1); }
.mcard.oos { opacity: .7; }
.cimg-wrap { position: relative; height: 175px; overflow: hidden; }
.cimg { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
.mcard:not(.oos):hover .cimg { transform: scale(1.06); }
.oos-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; }
.oos-tag { background: #ef4444; color: white; font-size: .78rem; font-weight: 800; padding: .35rem .9rem; border-radius: 999px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(239,68,68,.4); }
.cbadge { position: absolute; top: .55rem; left: .55rem; background: rgba(20,12,0,.78); backdrop-filter: blur(6px); color: white; font-size: .65rem; font-weight: 700; padding: .22rem .55rem; border-radius: 5px; letter-spacing: .5px; text-transform: uppercase; }
.cprice { position: absolute; top: .55rem; right: .55rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; font-size: .85rem; font-weight: 800; padding: .28rem .62rem; border-radius: 7px; box-shadow: 0 3px 10px rgba(255,107,0,.4); }
.cbody { padding: .9rem 1rem 1rem; flex: 1; display: flex; flex-direction: column; }
.cname { font-size: .97rem; font-weight: 700; color: #1f2937; margin-bottom: .25rem; line-height: 1.3; }
.cdesc { font-size: .78rem; color: #9ca3af; line-height: 1.45; flex: 1; margin-bottom: .55rem; }
.prep-pill { display: inline-flex; align-items: center; gap: .28rem; font-size: .7rem; font-weight: 600; color: #6b7280; background: #f5f5f0; padding: .22rem .55rem; border-radius: 5px; margin-bottom: .7rem; }
.card-bottom { display: flex; align-items: center; gap: .55rem; }
.add-btn { flex: 1; padding: .62rem .5rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; border: none; border-radius: 9px; font-family: 'DM Sans',sans-serif; font-size: .83rem; font-weight: 700; cursor: pointer; box-shadow: 0 3px 10px rgba(255,107,0,.25); transition: transform .15s,box-shadow .15s; display: flex; align-items: center; justify-content: center; gap: .35rem; }
.add-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(255,107,0,.4); }
.add-btn:disabled { background: #e5e7eb; color: #9ca3af; box-shadow: none; transform: none; cursor: not-allowed; }
.qty-ctrl { display: flex; align-items: center; gap: .3rem; background: #f5f5f0; border-radius: 9px; padding: .3rem .4rem; flex: 1; justify-content: center; }
.qty-btn { width: 28px; height: 28px; border: none; border-radius: 7px; background: white; color: #374151; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,.1); transition: all .15s; line-height: 1; }
.qty-btn:hover { background: #FF7A33; color: white; }
.qty-num { font-size: .9rem; font-weight: 800; color: #FF7A33; min-width: 22px; text-align: center; }

/* CART DRAWER */
.cart-drawer { width: 0; overflow: hidden; position: sticky; top: 73px; height: calc(100vh - 73px); transition: width .35s cubic-bezier(.4,0,.2,1); flex-shrink: 0; background: white; border-left: 1px solid #ede8e0; box-shadow: -4px 0 24px rgba(0,0,0,.07); display: flex; flex-direction: column; }
.cart-drawer.open { width: 400px; }
.drawer-inner { width: 400px; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.drawer-hdr { background: linear-gradient(135deg,#2d1f0e,#3d2a14); padding: 1.1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.drawer-title { font-family: 'Playfair Display',serif; font-size: 1.1rem; font-weight: 700; color: white; display: flex; align-items: center; gap: .5rem; }
.drawer-cnt { background: rgba(255,122,51,.35); color: #FFAA77; font-size: .72rem; font-weight: 800; padding: .18rem .5rem; border-radius: 999px; }
.drawer-close { background: rgba(255,255,255,.12); border: none; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; color: rgba(255,255,255,.7); font-size: 1.1rem; display: flex; align-items: center; justify-content: center; }
.drawer-close:hover { background: rgba(255,255,255,.22); color: white; }
.eta-strip { background: rgba(255,122,51,.08); border-bottom: 1px solid rgba(255,122,51,.12); padding: .55rem 1.25rem; display: flex; align-items: center; gap: .5rem; font-size: .78rem; font-weight: 600; color: #FF7A33; flex-shrink: 0; }
.drawer-items { flex: 1; overflow-y: auto; padding: .75rem 1.25rem; }
.drawer-items::-webkit-scrollbar { width: 4px; }
.drawer-items::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
.cart-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: .75rem; color: #9ca3af; text-align: center; }
.cart-empty-icon { font-size: 3rem; opacity: .5; }
.ci-row { display: flex; align-items: flex-start; gap: .75rem; padding: .85rem 0; border-bottom: 1px solid #f5f5f0; animation: fadeUp .25s ease; }
.ci-row:last-child { border-bottom: none; }
.ci-img { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; flex-shrink: 0; border: 1px solid #f0f0f0; }
.ci-info { flex: 1; min-width: 0; }
.ci-name { font-size: .88rem; font-weight: 700; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: .2rem; }
.ci-unit { font-size: .72rem; color: #9ca3af; }
.ci-remove-btn { font-size: .68rem; color: #9ca3af; background: none; border: none; cursor: pointer; padding: 0; text-decoration: underline; margin-top: 3px; display: block; }
.ci-remove-btn:hover { color: #ef4444; }
.ci-right { display: flex; flex-direction: column; align-items: flex-end; gap: .45rem; }
.ci-price { font-size: .92rem; font-weight: 800; color: #FF7A33; }
.ci-qty-ctrl { display: flex; align-items: center; gap: .3rem; }
.ci-qty-btn { width: 26px; height: 26px; border-radius: 7px; border: 1.5px solid #e5e7eb; background: white; font-size: .9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; color: #374151; }
.ci-qty-btn:hover { border-color: #FF7A33; color: #FF7A33; }
.ci-qty-btn.rem { border-color: #fecaca; color: #ef4444; }
.ci-qty-btn.rem:hover { background: #ef4444; color: white; border-color: #ef4444; }
.ci-qty-num { font-size: .88rem; font-weight: 800; color: #2d1f0e; min-width: 20px; text-align: center; }
.drawer-footer { flex-shrink: 0; border-top: 1px solid #ede8e0; padding: 1rem 1.25rem 1.25rem; }
.pts-preview { background: linear-gradient(135deg,#fff3ec,#fef9f5); border: 1px solid rgba(255,122,51,.2); border-radius: 10px; padding: .65rem 1rem; margin-bottom: .85rem; display: flex; align-items: center; justify-content: space-between; }
.pts-preview-l { font-size: .78rem; color: #6b7280; }
.pts-preview-l span { font-weight: 700; color: #FF7A33; }
.pts-earn-badge { background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; font-size: .72rem; font-weight: 800; padding: .25rem .65rem; border-radius: 999px; }
.total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: .85rem; }
.total-lbl { font-family: 'Playfair Display',serif; font-size: 1.05rem; font-weight: 700; color: #2d1f0e; }
.total-amt { font-family: 'Playfair Display',serif; font-size: 1.3rem; font-weight: 800; color: #FF7A33; }
.clear-cart-btn { width: 100%; padding: .55rem; background: #fff1f0; border: 1.5px solid rgba(220,38,38,.2); border-radius: 9px; color: #dc2626; font-family: 'DM Sans',sans-serif; font-size: .8rem; font-weight: 700; cursor: pointer; margin-bottom: .65rem; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: .4rem; }
.clear-cart-btn:hover { background: #dc2626; color: white; }
.checkout-btn { width: 100%; padding: .85rem; background: linear-gradient(135deg,#16a34a,#15803d); color: white; border: none; border-radius: 11px; font-family: 'DM Sans',sans-serif; font-size: .95rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(22,163,74,.3); transition: all .15s; display: flex; align-items: center; justify-content: center; gap: .5rem; }
.checkout-btn:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(22,163,74,.4); }

/* ── CHECKOUT MODAL ── */
.modal-bg { position: fixed; inset: 0; background: rgba(20,10,0,.55); backdrop-filter: blur(5px); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 1.5rem; animation: fadeIn .2s ease; }
.modal-box { background: white; border-radius: 22px; box-shadow: 0 24px 70px rgba(0,0,0,.2); width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto; animation: scaleIn .25s ease; }
.modal-hdr { background: linear-gradient(135deg,#2d1f0e,#3d2a14); padding: 1.35rem 1.75rem; display: flex; align-items: center; justify-content: space-between; border-radius: 22px 22px 0 0; }
.modal-title { font-family: 'Playfair Display',serif; font-size: 1.25rem; font-weight: 700; color: white; }
.modal-close { background: rgba(255,255,255,.12); border: none; border-radius: 9px; width: 32px; height: 32px; cursor: pointer; color: white; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; }
.modal-close:hover { background: rgba(255,255,255,.22); }
.modal-body { padding: 1.5rem 1.75rem; }
.modal-summary { background: #faf9f6; border: 1px solid #ede8e0; border-radius: 12px; padding: 1rem 1.1rem; margin-bottom: 1.25rem; }
.modal-sum-title { font-size: .8rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: .65rem; }
.modal-item { display: flex; justify-content: space-between; padding: .35rem 0; font-size: .85rem; border-bottom: 1px solid #f0ede8; }
.modal-item:last-child { border-bottom: none; }
.modal-total-row { display: flex; justify-content: space-between; margin-top: .85rem; padding-top: .85rem; border-top: 2px solid #FF7A33; }
.modal-total-lbl { font-family: 'Playfair Display',serif; font-size: 1rem; font-weight: 700; color: #2d1f0e; }
.modal-total-amt { font-family: 'Playfair Display',serif; font-size: 1.2rem; font-weight: 800; color: #FF7A33; }
.modal-eta-row { display: flex; align-items: center; gap: .5rem; background: #fef3c7; border-radius: 8px; padding: .5rem .85rem; margin-top: .65rem; font-size: .8rem; font-weight: 600; color: #d97706; }
.modal-pts-row { display: flex; align-items: center; justify-content: space-between; background: #fff3ec; border-radius: 8px; padding: .5rem .85rem; margin-top: .5rem; font-size: .8rem; }
.form-section-title { font-size: .88rem; font-weight: 700; color: #374151; margin-bottom: .75rem; display: flex; align-items: center; gap: .4rem; margin-top: 1.25rem; }
.fld { margin-bottom: .75rem; }
.fld label { font-size: .78rem; font-weight: 600; color: #6b7280; display: block; margin-bottom: .3rem; }
.fld input, .fld textarea { width: 100%; padding: .75rem 1rem; border: 1.5px solid #e5e7eb; border-radius: 10px; font-family: 'DM Sans',sans-serif; font-size: .9rem; color: #1f2937; background: white; outline: none; transition: border-color .2s,box-shadow .2s; }
.fld input:focus, .fld textarea:focus { border-color: #FF7A33; box-shadow: 0 0 0 3px rgba(255,122,51,.12); }
.fld input::placeholder, .fld textarea::placeholder { color: #c4c4c4; }
.fld textarea { resize: none; }
.modal-actions { display: flex; gap: .75rem; margin-top: 1.25rem; }
.place-btn { flex: 1; padding: .9rem; background: linear-gradient(135deg,#16a34a,#15803d); color: white; border: none; border-radius: 11px; font-family: 'DM Sans',sans-serif; font-size: .95rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(22,163,74,.3); transition: all .15s; display: flex; align-items: center; justify-content: center; gap: .4rem; }
.place-btn:hover { transform: translateY(-1px); }
.place-btn:disabled { background: #9ca3af; box-shadow: none; transform: none; cursor: not-allowed; }
.cancel-btn { padding: .9rem 1.35rem; background: #f5f5f0; border: 1.5px solid #e5e7eb; border-radius: 11px; font-family: 'DM Sans',sans-serif; font-size: .9rem; font-weight: 600; color: #6b7280; cursor: pointer; }
.cancel-btn:hover { border-color: #d1d5db; }

/* ── RECEIPT SUCCESS MODAL ── */
.receipt-modal-box {
  background: white; border-radius: 24px;
  box-shadow: 0 30px 80px rgba(0,0,0,.25);
  width: 520px; max-width: 95vw; max-height: 92vh;
  overflow-y: auto; animation: scaleIn .3s ease;
}
.receipt-modal-box::-webkit-scrollbar { width: 4px; }
.receipt-modal-box::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

/* Receipt header */
.rm-header { background: linear-gradient(145deg,#2d1f0e,#3d2a14,#4a3020); padding: 2rem 2rem 0; text-align: center; position: relative; overflow: hidden; border-radius: 24px 24px 0 0; }
.rm-header::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 50%,rgba(255,122,51,.22),transparent 60%); }
.rm-header-in { position: relative; z-index: 1; }
.rm-logo { width: 70px; height: 70px; background: linear-gradient(145deg,#FF7A33,#FF5500); border-radius: 50%; margin: 0 auto .7rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(255,107,0,.5); }
.rm-brand { font-family: 'Playfair Display',serif; font-size: 1.5rem; font-weight: 800; color: white; }
.rm-brand-sub { font-size: .65rem; color: rgba(255,255,255,.5); font-weight: 600; letter-spacing: 3px; text-transform: uppercase; margin: 3px 0 1.25rem; }
.rm-wave { display: block; width: 100%; margin-bottom: -2px; }

/* Success strip */
.rm-success { background: linear-gradient(135deg,#15803d,#16a34a); padding: .85rem 2rem; display: flex; align-items: center; justify-content: center; gap: .65rem; }
.rm-success-icon { width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
.rm-success-text { color: white; font-size: .95rem; font-weight: 700; }

/* Receipt body */
.rm-body { padding: 1.5rem 1.75rem; }
.rm-order-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 2px dashed #ede8e0; }
.rm-order-id-lbl { font-size: .68rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; }
.rm-order-id { font-family: 'Playfair Display',serif; font-size: 1.1rem; font-weight: 800; color: #2d1f0e; margin-top: 3px; }
.rm-date { text-align: right; font-size: .75rem; color: #6b7280; line-height: 1.7; }
.rm-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: 1.25rem; }
.rm-info-box { background: #faf9f6; border: 1px solid #ede8e0; border-radius: 10px; padding: .7rem .85rem; }
.rm-info-lbl { font-size: .63rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 3px; }
.rm-info-val { font-size: .85rem; font-weight: 600; color: #1f2937; line-height: 1.4; }
.rm-eta-box { display: flex; align-items: center; gap: .5rem; background: #fef3c7; border: 1px solid rgba(245,158,11,.3); border-radius: 10px; padding: .65rem 1rem; margin-bottom: 1.25rem; font-size: .82rem; font-weight: 600; color: #d97706; }
.rm-items-title { font-size: .7rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: .7rem; display: flex; align-items: center; gap: .5rem; }
.rm-items-title::after { content: ''; flex: 1; height: 1px; background: #ede8e0; }
.rm-item { display: flex; justify-content: space-between; align-items: center; padding: .55rem 0; border-bottom: 1px solid #f5f5f0; }
.rm-item:last-child { border-bottom: none; }
.rm-item-l { display: flex; align-items: center; gap: .55rem; }
.rm-item-qty { background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; font-size: .65rem; font-weight: 800; width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rm-item-name { font-size: .85rem; font-weight: 600; color: #374151; }
.rm-item-unit { font-size: .68rem; color: #9ca3af; margin-top: 1px; }
.rm-item-price { font-size: .88rem; font-weight: 700; color: #1f2937; }
.rm-totals { background: #faf9f6; border: 1px solid #ede8e0; border-radius: 12px; padding: .9rem 1rem; margin-top: .85rem; margin-bottom: 1rem; }
.rm-total-line { display: flex; justify-content: space-between; font-size: .8rem; color: #6b7280; padding: .25rem 0; }
.rm-total-line.grand { border-top: 2px solid #FF7A33; margin-top: .55rem; padding-top: .65rem; }
.rm-total-line.grand span:first-child { font-family: 'Playfair Display',serif; font-size: 1rem; font-weight: 700; color: #2d1f0e; }
.rm-total-line.grand span:last-child { font-family: 'Playfair Display',serif; font-size: 1.15rem; font-weight: 800; color: #FF7A33; }
.rm-pts-box { background: linear-gradient(135deg,#fff3ec,#fef9f5); border: 1px solid rgba(255,122,51,.25); border-radius: 12px; padding: .8rem 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; }
.rm-pts-l { font-size: .8rem; color: #6b7280; }
.rm-pts-l strong { color: #FF7A33; }
.rm-pts-badge { background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; font-size: .72rem; font-weight: 800; padding: .28rem .75rem; border-radius: 999px; }
.rm-thankyou { text-align: center; padding: 1rem 0 .5rem; }
.rm-ty-emoji { font-size: 2.5rem; margin-bottom: .4rem; }
.rm-ty-title { font-family: 'Playfair Display',serif; font-size: 1.4rem; font-weight: 800; color: #2d1f0e; margin-bottom: .35rem; }
.rm-ty-sub { font-size: .82rem; color: #9ca3af; line-height: 1.65; }
.rm-ty-sub strong { color: #FF7A33; }

/* Action buttons */
.rm-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; padding: 0 1.75rem 1.75rem; }
.rm-download-btn { padding: .88rem; background: linear-gradient(135deg,#FF7A33,#FF5500); color: white; border: none; border-radius: 12px; font-family: 'DM Sans',sans-serif; font-size: .9rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(255,107,0,.35); transition: all .15s; display: flex; align-items: center; justify-content: center; gap: .5rem; }
.rm-download-btn:hover { transform: translateY(-1px); box-shadow: 0 7px 22px rgba(255,107,0,.45); }
.rm-orders-btn { padding: .88rem; background: #2d1f0e; color: white; border: none; border-radius: 12px; font-family: 'DM Sans',sans-serif; font-size: .9rem; font-weight: 700; cursor: pointer; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: .5rem; }
.rm-orders-btn:hover { background: #3d2a14; transform: translateY(-1px); }

/* TOAST */
.pts-toast { position: fixed; bottom: 2rem; right: 2rem; z-index: 999; background: linear-gradient(135deg,#2d1f0e,#3d2a14); border: 1px solid rgba(255,122,51,.3); border-radius: 16px; padding: 1rem 1.5rem; display: flex; align-items: center; gap: .85rem; box-shadow: 0 16px 40px rgba(0,0,0,.2); animation: toastIn .4s ease; }
.toast-icon { font-size: 1.75rem; }
.toast-val { font-family: 'Playfair Display',serif; font-size: 1.1rem; font-weight: 800; color: #FF7A33; }
.toast-msg { font-size: .8rem; color: rgba(255,255,255,.65); }

/* EMPTY / LOADING */
.empty-st { text-align: center; padding: 4rem 2rem; }
.load-root { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; background: #faf9f6; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(.93); } to { opacity: 1; transform: scale(1); } }
@keyframes toastIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes steamRise { 0%,100% { transform: translateY(0) scaleX(1); opacity: .9; } 50% { transform: translateY(-4px) scaleX(.8); opacity: .5; } }
.steam-1 { animation: steamRise 1.8s ease-in-out infinite; }
.steam-2 { animation: steamRise 1.8s ease-in-out .35s infinite; }
.steam-3 { animation: steamRise 1.8s ease-in-out .7s infinite; }
`;

// ─── Component ───────────────────────────────────────────────────────────────
export default function MenuPage() {
  const [menu, setMenu]                     = useState([]);
  const [cart, setCart]                     = useState([]);
  const [isAdmin, setIsAdmin]               = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm]         = useState('');
  const [loading, setLoading]               = useState(true);
  const [user, setUser]                     = useState(null);
  const [cartOpen, setCartOpen]             = useState(false);
  const [checkoutOpen, setCheckoutOpen]     = useState(false);
  const [receiptData, setReceiptData]       = useState(null); // ← receipt modal
  const [placing, setPlacing]               = useState(false);
  const [deliveryName, setDeliveryName]     = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [loyaltyPoints, setLoyaltyPoints]   = useState(0);
  const [toast, setToast]                   = useState(null);
  const [paymentMethod, setPaymentMethod]   = useState('cod');
  const navigate = useNavigate();

  useEffect(() => { setCart(loadCart()); }, []);
  useEffect(() => { saveCart(cart); }, [cart]);

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

  // ── Cart ──────────────────────────────────────────────────────────────────
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

  // ── Place Order ──────────────────────────────────────────────────────────
  const placeOrder = async () => {
    if (!deliveryName.trim() || !deliveryLocation.trim() || !paymentMethod) {
      alert('Please fill all details and select a payment method');
      return;
    }

    const uid = auth.currentUser?.uid;
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const eta = calcETA(cart, menu);
    const earned = calcPoints(total);
    const now = new Date();

    setPlacing(true);

    try {
      const orderRes = await axios.post(`${API}/api/orders`, {
        userId: uid,
        items: cart.map(({ id, name, price, quantity }) => ({ foodId: id, name, price, quantity })),
        total,
        deliveryName,
        deliveryLocation,
        eta,
        pointsEarned: earned,
        paymentMethod,                    // ← NEW
        status: paymentMethod === 'upi' ? 'pending_payment' : 'confirmed'   // ← optional, for your backend
      });

      const orderId = orderRes.data.id || orderRes.data.orderId || `ORD${Date.now()}`;

      // Loyalty points
      if (earned > 0) {
        const r = await axios.post(`${API}/api/loyalty/${uid}/add`, { points: earned });
        setLoyaltyPoints(r.data.loyaltyPoints);
        setToast({ pts: earned, newTotal: r.data.loyaltyPoints, tier: getTier(r.data.loyaltyPoints) });
        setTimeout(() => setToast(null), 5000);
      }

      // Receipt data
      setReceiptData({
        orderId,
        date: now,
        items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        total,
        deliveryName,
        deliveryLocation,
        eta,
        pointsEarned: earned,
        paymentMethod   // ← NEW (you can show in receipt later)
      });

      setCart([]); saveCart([]);
      setCheckoutOpen(false); setCartOpen(false);
      setDeliveryName(''); setDeliveryLocation('');
      setPaymentMethod('cod');
    } catch (e) {
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut(); localStorage.removeItem('cart'); navigate('/login');
  };

  // ── Derived ───────────────────────────────────────────────────────────────
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
      <ellipse cx="26" cy="42.5" rx="18" ry="2.5" fill="rgba(255,255,255,0.4)"/>
    </svg>
  );

  if (loading) return (
    <>
      <style>{styles}</style>
      <div className="load-root">
        <div style={{ position:'relative', width:80, height:80 }}>
          <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:'2px dashed rgba(255,122,51,0.3)', animation:'spin 20s linear infinite' }} />
          <div style={{ width:80, height:80, background:'linear-gradient(145deg,#FF7A33,#FF5500)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(255,107,0,0.35)' }}>
            <BowlSVG />
          </div>
        </div>
        <p style={{ fontSize:'.9rem', color:'#9ca3af', fontWeight:500 }}>Loading the menu…</p>
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>

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

      {/* ── CHECKOUT MODAL ── */}
      {checkoutOpen && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setCheckoutOpen(false)}>
          <div className="modal-box">
            <div className="modal-hdr">
              <div className="modal-title">✅ Confirm Your Order</div>
              <button className="modal-close" onClick={() => setCheckoutOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Order Summary (unchanged) */}
              <div className="modal-summary">
                <div className="modal-sum-title">Order Summary</div>
                {cart.map(item => (
                  <div key={item.id} className="modal-item">
                    <span style={{ color:'#374151' }}>{item.name} <span style={{ color:'#9ca3af' }}>×{item.quantity}</span></span>
                    <span style={{ fontWeight:700, color:'#1f2937' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="modal-total-row">
                  <span className="modal-total-lbl">Total</span>
                  <span className="modal-total-amt">₹{totalPrice.toFixed(2)}</span>
                </div>
                {eta && <div className="modal-eta-row"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Estimated: <strong>{eta}</strong></div>}
              </div>

              {/* Delivery Details (unchanged) */}
              <div className="form-section-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Delivery Details
              </div>
              <div className="fld"><label>Recipient Name *</label><input type="text" placeholder="Your full name" value={deliveryName} onChange={e => setDeliveryName(e.target.value)} /></div>
              <div className="fld"><label>Delivery Location *</label><textarea rows="2" placeholder="Room, hostel, or location…" value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} /></div>

              {/* ── NEW: PAYMENT METHOD SELECTION ── */}
              <div className="form-section-title" style={{marginTop: '1.5rem'}}>
                💳 Payment Method
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '1.5rem' }}>
                {/* Prepaid UPI Button */}
                <button
                  onClick={() => setPaymentMethod('upi')}
                  style={{
                    padding: '18px 14px',
                    border: paymentMethod === 'upi' ? '2.5px solid #FF7A33' : '2px solid #e5e7eb',
                    background: paymentMethod === 'upi' ? '#fff7ed' : '#fff',
                    borderRadius: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📱</div>
                  <div style={{ fontWeight: '700', fontSize: '15.5px', color: '#1f2937' }}>Prepaid via UPI</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Scan QR • Pay now • Canteen Wale Bhaiya will verify
                  </div>
                </button>

                {/* COD Button */}
                <button
                  onClick={() => setPaymentMethod('cod')}
                  style={{
                    padding: '18px 14px',
                    border: paymentMethod === 'cod' ? '2.5px solid #FF7A33' : '2px solid #e5e7eb',
                    background: paymentMethod === 'cod' ? '#fff7ed' : '#fff',
                    borderRadius: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>💵</div>
                  <div style={{ fontWeight: '700', fontSize: '15.5px', color: '#1f2937' }}>Cash on Delivery</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    Pay when food is delivered
                  </div>
                </button>
              </div>

              {/* UPI QR CODE (shows only when Prepaid is selected) */}
              {paymentMethod === 'upi' && (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fcd34d',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#d97706', marginBottom: '14px' }}>
                    Scan to pay ₹{totalPrice.toFixed(2)}
                  </div>
                  
                  <img 
                    src="/upi-qr.png" 
                    alt="UPI QR Code" 
                    style={{ 
                      width: '245px', 
                      height: '245px', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                      margin: '0 auto 16px auto',
                      border: '6px solid white'
                    }} 
                  />

                  <div style={{ fontSize: '13.5px', color: '#374151', fontWeight: '600' }}>
                    UPI ID: <span style={{ color: '#15803d' }}>rajeshmali8900@okicici</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#15803d', marginTop: '6px', fontWeight: '500' }}>
                    Pay EXACTLY ₹{totalPrice.toFixed(2)} • Any UPI app
                  </div>
                </div>
              )}

              {/* Place Order Button */}
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setCheckoutOpen(false)}>← Edit Cart</button>
                <button 
                  className="place-btn" 
                  disabled={placing || !paymentMethod} 
                  onClick={placeOrder}
                >
                  {placing ? '⏳ Placing…' : 
                    paymentMethod === 'upi' 
                      ? `Confirm & Pay ₹${totalPrice.toFixed(2)} via UPI` 
                      : `Place COD Order • ₹${totalPrice.toFixed(2)}`
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RECEIPT SUCCESS MODAL ── */}
      {receiptData && (
        <div className="modal-bg">
          <div className="receipt-modal-box">

            {/* Header with logo */}
            <div className="rm-header">
              <div className="rm-header-in">
                <div className="rm-logo">
                  <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
                    <path d="M13 14 Q12 10 13 6" stroke="rgba(255,255,255,0.8)" strokeWidth="2.2" strokeLinecap="round"/>
                    <path d="M26 13 Q25 9 26 5"  stroke="rgba(255,255,255,0.8)" strokeWidth="2.2" strokeLinecap="round"/>
                    <path d="M39 14 Q38 10 39 6" stroke="rgba(255,255,255,0.8)" strokeWidth="2.2" strokeLinecap="round"/>
                    <path d="M10 29 Q10 43 26 43 Q42 43 42 29 Z" fill="white"/>
                    <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
                    <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.2)"/>
                    <circle cx="20" cy="34" r="2.2" fill="rgba(255,107,0,0.4)"/>
                    <circle cx="30" cy="36" r="1.6" fill="rgba(255,107,0,0.3)"/>
                    <ellipse cx="26" cy="43" rx="18" ry="2.5" fill="rgba(255,255,255,0.35)"/>
                  </svg>
                </div>
                <div className="rm-brand">Annapurna</div>
                <div className="rm-brand-sub">Smart Canteen</div>
              </div>
              <svg className="rm-wave" viewBox="0 0 520 36" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M0,18 C100,36 200,0 300,18 C400,36 450,8 520,18 L520,36 L0,36 Z" fill="white"/>
              </svg>
            </div>

            {/* Success strip */}
            <div className="rm-success">
              <div className="rm-success-icon">✓</div>
              <div className="rm-success-text">Order Confirmed Successfully!</div>
            </div>

            {/* Receipt body */}
            <div className="rm-body">
              {/* Order ID + date */}
              <div className="rm-order-meta">
                <div>
                  <div className="rm-order-id-lbl">Order ID</div>
                  <div className="rm-order-id">#{receiptData.orderId.slice(-8).toUpperCase()}</div>
                </div>
                <div className="rm-date">
                  <div>{formatDate(receiptData.date)}</div>
                  <div>{formatTime(receiptData.date)}</div>
                </div>
              </div>

              {/* Delivery info */}
              <div className="rm-info-grid">
                <div className="rm-info-box">
                  <div className="rm-info-lbl">👤 Recipient</div>
                  <div className="rm-info-val">{receiptData.deliveryName}</div>
                </div>
                <div className="rm-info-box">
                  <div className="rm-info-lbl">📍 Delivery To</div>
                  <div className="rm-info-val">{receiptData.deliveryLocation}</div>
                </div>
              </div>

              {/* ETA */}
              {receiptData.eta && (
                <div className="rm-eta-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Estimated Delivery: <strong style={{ marginLeft:4 }}>{receiptData.eta}</strong>
                </div>
              )}

              {/* Items */}
              <div className="rm-items-title">Items Ordered</div>
              {receiptData.items.map((item, i) => (
                <div key={i} className="rm-item">
                  <div className="rm-item-l">
                    <div className="rm-item-qty">{item.quantity}</div>
                    <div>
                      <div className="rm-item-name">{item.name}</div>
                      <div className="rm-item-unit">₹{item.price.toFixed(2)} each</div>
                    </div>
                  </div>
                  <div className="rm-item-price">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}

              {/* Totals */}
              <div className="rm-totals">
                <div className="rm-total-line"><span>Subtotal</span><span>₹{receiptData.total.toFixed(2)}</span></div>
                <div className="rm-total-line"><span>Delivery</span><span style={{ color:'#16a34a', fontWeight:700 }}>FREE</span></div>
                <div className="rm-total-line grand"><span>Total Paid</span><span>₹{receiptData.total.toFixed(2)}</span></div>
              </div>

              {/* Loyalty points */}
              {receiptData.pointsEarned > 0 && (
                <div className="rm-pts-box">
                  <div className="rm-pts-l">You earned <strong>+{receiptData.pointsEarned} loyalty points</strong>!</div>
                  <div className="rm-pts-badge">⭐ +{receiptData.pointsEarned} pts</div>
                </div>
              )}

              {/* Thank you */}
              <div className="rm-thankyou">
                <div className="rm-ty-emoji">🙏</div>
                <div className="rm-ty-title">Thank You!</div>
                <div className="rm-ty-sub">
                  Your delicious food is being prepared with love.<br/>
                  <strong>Sit back and relax</strong> — we'll have it ready soon!
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="rm-actions">
              <button className="rm-download-btn" onClick={() => downloadReceipt(receiptData)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                Download Receipt
              </button>
              <button className="rm-orders-btn" onClick={() => { setReceiptData(null); navigate('/orders'); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
                View My Orders
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
                <ellipse cx="26" cy="42.5" rx="18" ry="2.5" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
            <div><div className="logo-brand">Annapurna</div><div className="logo-sub">Smart Canteen</div></div>
          </div>
          <div className="nav-right">
            <div className="loy-chip">
              <span>{tier.icon}</span>
              <div><div className="loy-pts">{loyaltyPoints} pts</div><div className="loy-lbl">{tier.name} tier</div></div>
            </div>
            <button className="nav-btn active" onClick={() => navigate('/menu')}>🍽️ Menu</button>
            <button className="nav-btn" onClick={() => navigate('/orders')}>📄 My Orders</button>
            {isAdmin && <button className="nav-btn" style={{ background:'#fff3ec', color:'#FF7A33' }} onClick={() => navigate('/admin')}>⚙️ Admin</button>}
            <button className={`cart-trigger${totalItems > 0 ? ' has-items' : ''}`} onClick={() => setCartOpen(o => !o)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
              {totalItems > 0 ? `Cart · ₹${totalPrice.toFixed(0)}` : 'Cart'}
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </button>
            <button className="nav-btn logout" onClick={handleLogout}>→ Logout</button>
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
              {filteredMenu.length > 0 && <span style={{ fontSize:'.8rem', fontFamily:"'DM Sans',sans-serif", fontWeight:500, color:'#9ca3af', marginLeft:'.35rem' }}>({filteredMenu.length})</span>}
            </div>
            {filteredMenu.length === 0 ? (
              <div className="empty-st"><div style={{ fontSize:'3.5rem', marginBottom:'.75rem' }}>🍽️</div><div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', color:'#6b7280' }}>No dishes found</div></div>
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
                        <div className="prep-pill">
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          ~{prep} min prep
                        </div>
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
            {eta && (
              <div className="eta-strip">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Estimated delivery: <strong>{eta}</strong>
              </div>
            )}
            <div className="drawer-items">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon">🛒</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', color:'#6b7280' }}>Your cart is empty</div>
                  <p style={{ fontSize:'.82rem', color:'#b0b8c1' }}>Add dishes from the menu</p>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                  Clear entire cart
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
    </>
  );
}