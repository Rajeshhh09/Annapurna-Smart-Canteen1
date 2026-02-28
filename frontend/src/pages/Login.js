import React, { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { GoogleLogin } from '@react-oauth/google';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'https://annapurna-smart-canteen1.onrender.com';

// ── Constants ────────────────────────────────────────────────────────────────
const FOOD_ICONS  = ['🍛','🥘','🫓','🍜','🥙','🧆','🍚','🫕','🥗','🍱','🌶️','🧅','🥚','🫙'];
const DEVANAGARI  = 'अआइईउकखगघचछजझटठडढनपफबभमयरलव';
const TARGET      = 'ANNAPURNA';
const SUBTITLE    = 'SMART  CANTEEN';             // two spaces = visual gap between words

// ── Easing functions ─────────────────────────────────────────────────────────
const easeOutElastic = (t) => {
  if (t === 0) return 0; if (t === 1) return 1;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
};
const easeOutQuart   = (t) => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;


const rndChar = () => DEVANAGARI[Math.floor(Math.random() * DEVANAGARI.length)];

// ── Background food SVG placements ───────────────────────────────────────────
// Scattered around the edges/corners — avoids center title area & form area
const BG_PLACEMENTS = [
  { icon:'samosa',   x:5,   y:14,  size:152, rot:-22, op:0.085, dur:14, del:0    },
  { icon:'chai',     x:88,  y:7,   size:118, rot:18,  op:0.075, dur:13, del:2    },
  { icon:'panipuri', x:2,   y:52,  size:162, rot:-10, op:0.095, dur:17, del:1    },
  { icon:'sandwich', x:88,  y:52,  size:148, rot:14,  op:0.085, dur:15, del:3    },
  { icon:'vadapav',  x:11,  y:82,  size:135, rot:-16, op:0.080, dur:14, del:0.5  },
  { icon:'chai',     x:83,  y:82,  size:108, rot:26,  op:0.070, dur:12, del:4.5  },
  { icon:'samosa',   x:44,  y:90,  size:118, rot:10,  op:0.075, dur:16, del:2.5  },
  { icon:'panipuri', x:94,  y:33,  size:130, rot:-14, op:0.085, dur:18, del:1.5  },
  { icon:'sandwich', x:2,   y:33,  size:118, rot:26,  op:0.070, dur:15, del:3.5  },
  { icon:'vadapav',  x:63,  y:1,   size:135, rot:-7,  op:0.075, dur:16, del:0.8  },
  { icon:'samosa',   x:79,  y:20,  size:98,  rot:34,  op:0.065, dur:13, del:5    },
  { icon:'chai',     x:20,  y:70,  size:112, rot:-28, op:0.075, dur:12, del:2.8  },
];

// ── Hand-drawn SVG icons: Samosa, Vada Pav, Pani Puri, Sandwich, Chai ────────
function FoodSVG({ icon }) {
  const base = { fill:'none', xmlns:'http://www.w3.org/2000/svg', width:'100%', height:'100%' };

  if (icon === 'samosa') return (
    <svg {...base} viewBox="0 0 100 110">
      {/* Puffed triangular body */}
      <path d="M50 8 C57 8 91 72 87 82 C83 91 17 91 13 82 C9 72 43 8 50 8Z"
            stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
      {/* Central fold seam – dashed */}
      <line x1="50" y1="12" x2="50" y2="86"
            stroke="currentColor" strokeWidth="1.3" strokeDasharray="4 3"/>
      {/* Left-edge crimp zigzags */}
      <path d="M33 57 L29 52 L25 57" stroke="currentColor" strokeWidth="1.3"
            fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M27 70 L23 65 L19 70" stroke="currentColor" strokeWidth="1.3"
            fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Right-edge crimp zigzags */}
      <path d="M67 57 L71 52 L75 57" stroke="currentColor" strokeWidth="1.3"
            fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M73 70 L77 65 L81 70" stroke="currentColor" strokeWidth="1.3"
            fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Surface spice-dot texture */}
      <circle cx="38" cy="52" r="2.5" fill="currentColor"/>
      <circle cx="62" cy="52" r="2.5" fill="currentColor"/>
      <circle cx="34" cy="68" r="2"   fill="currentColor"/>
      <circle cx="66" cy="68" r="2"   fill="currentColor"/>
      <circle cx="50" cy="42" r="2"   fill="currentColor"/>
      <circle cx="42" cy="76" r="1.5" fill="currentColor"/>
      <circle cx="58" cy="76" r="1.5" fill="currentColor"/>
      {/* Bottom curved seam */}
      <path d="M18 82 C28 88 40 86 50 88 C60 86 72 88 82 82"
            stroke="currentColor" strokeWidth="1" fill="none"/>
    </svg>
  );

  if (icon === 'vadapav') return (
    <svg {...base} viewBox="0 0 100 90">
      {/* Top bun dome */}
      <path d="M14 44 C14 19 86 19 86 44"
            stroke="currentColor" strokeWidth="2.2" fill="none"/>
      <line x1="14" y1="44" x2="86" y2="44" stroke="currentColor" strokeWidth="1.8"/>
      {/* Sesame seeds on top */}
      <ellipse cx="38" cy="30" rx="3.5" ry="1.6" stroke="currentColor" strokeWidth="1.2"/>
      <ellipse cx="54" cy="25" rx="3.5" ry="1.6" stroke="currentColor" strokeWidth="1.2"/>
      <ellipse cx="67" cy="33" rx="3"   ry="1.4" stroke="currentColor" strokeWidth="1.2"/>
      <ellipse cx="45" cy="22" rx="2.5" ry="1.2" stroke="currentColor" strokeWidth="1"/>
      <ellipse cx="29" cy="36" rx="2.5" ry="1.2" stroke="currentColor" strokeWidth="1"/>
      {/* Vada / crispy patty ellipse */}
      <ellipse cx="50" cy="54" rx="34" ry="10" stroke="currentColor" strokeWidth="2"/>
      {/* Vada surface texture */}
      <path d="M26 54 C32 50 40 56 50 52 C60 48 68 54 74 52"
            stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Chutney smear */}
      <path d="M16 61 C28 58 42 63 56 60 C70 57 82 61 84 59"
            stroke="currentColor" strokeWidth="1.4" fill="none" strokeDasharray="3 2"/>
      {/* Bottom bun */}
      <line x1="14" y1="64" x2="86" y2="64" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M14 64 C14 80 86 80 86 64"
            stroke="currentColor" strokeWidth="2.2" fill="none"/>
    </svg>
  );

  if (icon === 'panipuri') return (
    <svg {...base} viewBox="0 0 100 108">
      {/* Crispy sphere outline */}
      <circle cx="50" cy="60" r="40" stroke="currentColor" strokeWidth="2.2"/>
      {/* Hole/opening at top */}
      <ellipse cx="50" cy="22" rx="11" ry="5.5" stroke="currentColor" strokeWidth="1.8"/>
      <ellipse cx="50" cy="24" rx="8.5" ry="3.8" stroke="currentColor" strokeWidth="1"/>
      {/* Irregular crack / bump texture */}
      <path d="M26 44 L30 39 L28 45" stroke="currentColor" strokeWidth="1.3"
            fill="none" strokeLinecap="round"/>
      <path d="M70 42 L67 47 L73 47" stroke="currentColor" strokeWidth="1.3"
            fill="none" strokeLinecap="round"/>
      <path d="M34 72 L37 67 L41 72" stroke="currentColor" strokeWidth="1.3"
            fill="none" strokeLinecap="round"/>
      <path d="M62 74 L66 69 L69 74" stroke="currentColor" strokeWidth="1.3"
            fill="none" strokeLinecap="round"/>
      <path d="M44 50 L41 46 L45 48" stroke="currentColor" strokeWidth="1.2"
            fill="none"/>
      <path d="M58 48 L61 44 L64 48" stroke="currentColor" strokeWidth="1.2"
            fill="none"/>
      {/* Bump dots for crispy texture */}
      <circle cx="40" cy="78" r="2.2" fill="currentColor"/>
      <circle cx="60" cy="76" r="2"   fill="currentColor"/>
      <circle cx="74" cy="60" r="2"   fill="currentColor"/>
      <circle cx="26" cy="60" r="2"   fill="currentColor"/>
      <circle cx="50" cy="88" r="2.2" fill="currentColor"/>
      <circle cx="38" cy="50" r="1.5" fill="currentColor"/>
      <circle cx="64" cy="52" r="1.5" fill="currentColor"/>
      {/* Filling peek in hole */}
      <circle cx="46" cy="24" r="2"   fill="currentColor"/>
      <circle cx="55" cy="21" r="1.5" fill="currentColor"/>
    </svg>
  );

  if (icon === 'sandwich') return (
    <svg {...base} viewBox="0 0 120 90">
      {/* Left triangle half */}
      <path d="M8 78 L58 78 L58 17 Z"
            stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
      {/* Right triangle half */}
      <path d="M62 78 L112 78 L62 17 Z"
            stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
      {/* Bread grain – left */}
      <path d="M18 78 L58 38" stroke="currentColor" strokeWidth="1.2"/>
      {/* Wavy lettuce / filling – left */}
      <path d="M28 78 L54 52 C52 50 50 53 48 51 C46 49 44 53 42 51"
            stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* Filling 2nd layer – left */}
      <path d="M38 78 L58 58" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2"/>
      {/* Bread grain – right */}
      <path d="M102 78 L62 38" stroke="currentColor" strokeWidth="1.2"/>
      {/* Wavy lettuce / filling – right */}
      <path d="M92 78 L66 52 C68 50 70 53 72 51 C74 49 76 53 78 51"
            stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* Filling 2nd layer – right */}
      <path d="M82 78 L62 58" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2"/>
      {/* Wavy lettuce at cut-top edge */}
      <path d="M58 17 C59 14 61 18 63 16 C65 14 67 18 69 16 C70 15 62 13 58 17Z"
            stroke="currentColor" strokeWidth="1.3" fill="none"/>
      {/* Bottom crust hint */}
      <line x1="8"  y1="72" x2="58"  y2="72" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3"/>
      <line x1="62" y1="72" x2="112" y2="72" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3"/>
    </svg>
  );

  if (icon === 'chai') return (
    <svg {...base} viewBox="0 0 100 112">
      {/* Steam wisps */}
      <path d="M36 26 C34 19 38 13 36 5"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
      <path d="M50 22 C48 15 52 9 50 1"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
      <path d="M64 26 C62 19 66 13 64 5"
            stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
      {/* Kulhad body (tapering earthen clay cup) */}
      <path d="M18 32 L24 90 C24 92 76 92 76 90 L82 32 Z"
            stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
      {/* Top rim ellipse */}
      <ellipse cx="50" cy="32" rx="32" ry="7" stroke="currentColor" strokeWidth="2"/>
      {/* Tea surface inside */}
      <ellipse cx="50" cy="40" rx="26" ry="4.5" stroke="currentColor" strokeWidth="1.3"/>
      {/* Handle arc */}
      <path d="M76 44 C94 44 97 58 93 70 L76 70"
            stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Vertical clay-texture lines */}
      <line x1="36" y1="34" x2="30" y2="88" stroke="currentColor" strokeWidth="0.8"/>
      <line x1="50" y1="36" x2="50" y2="90" stroke="currentColor" strokeWidth="0.8"/>
      <line x1="64" y1="34" x2="70" y2="88" stroke="currentColor" strokeWidth="0.8"/>
      {/* Decorative band around body */}
      <path d="M20 58 C30 56 40 60 50 58 C60 56 70 60 80 58"
            stroke="currentColor" strokeWidth="1" fill="none"/>
      {/* Saucer */}
      <ellipse cx="50" cy="95" rx="38" ry="8" stroke="currentColor" strokeWidth="1.8"/>
      <ellipse cx="50" cy="95" rx="28" ry="5" stroke="currentColor" strokeWidth="1"/>
    </svg>
  );

  return null;
}

// ── Inline CSS ────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{overflow:hidden;height:100%;}

/* ── Root ── */
.lp{
  position:fixed;inset:0;
  background:#fdf7ef;
  background-image:
    radial-gradient(ellipse 100% 70% at 10% 10%, rgba(255,138,51,0.16) 0%,transparent 55%),
    radial-gradient(ellipse 80% 90% at 90% 90%, rgba(255,100,0,0.11) 0%,transparent 55%),
    radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,210,130,0.07) 0%,transparent 65%);
  font-family:'DM Sans',sans-serif;
  overflow:hidden;
}

/* Noise grain */
.lp-grain{
  position:fixed;inset:0;z-index:1;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.038'/%3E%3C/svg%3E");
  background-size:200px;opacity:0.6;
}
/* Radial vignette */
.lp-vig{position:fixed;inset:0;z-index:2;pointer-events:none;
  background:radial-gradient(ellipse 140% 120% at 50% 50%,transparent 50%,rgba(120,50,0,0.07) 100%);}

/* ── BG food SVG illustrations ── */
.bgf-outer{
  position:fixed;pointer-events:none;z-index:4;
  transform:translate(-50%,-50%);
}
.bgf-inner{
  width:100%;height:100%;
  animation:bgfloat var(--d) ease-in-out var(--dl) infinite alternate;
}
@keyframes bgfloat{
  0%  {transform:translateY(0)    scale(1);}
  100%{transform:translateY(-15px) scale(1.04);}
}

/* ── Floating emoji icons (subtle) ── */
.ff{position:fixed;pointer-events:none;z-index:3;user-select:none;filter:blur(0.4px);
  animation:ffloat var(--d) ease-in-out var(--dl) infinite alternate;}
@keyframes ffloat{
  0%{transform:translate(0,0) rotate(-7deg) scale(1);}
  100%{transform:translate(6px,-18px) rotate(8deg) scale(1.06);}
}

/* ── Title area ── */
/* ANNAPURNA: individual letters are absolutely positioned via JS */
.lp-letter{
  position:fixed;pointer-events:none;z-index:50;user-select:none;
  font-family:'Playfair Display',serif;
  font-size:clamp(2.6rem,5.2vw,4.8rem);
  font-weight:900;
  color:#2d1f0e;
  will-change:transform,opacity,filter;
  letter-spacing:-1px;
  line-height:1;
}

/* ── Shimmer wave on letters ── */
.lp-shimmer-overlay{
  position:fixed;pointer-events:none;z-index:52;
  top:0;height:100%;width:160px;
  background:linear-gradient(90deg,transparent 0%,rgba(255,200,80,0.55) 40%,rgba(255,230,120,0.7) 50%,rgba(255,200,80,0.55) 60%,transparent 100%);
  animation:shimSweep 0s linear forwards;
  opacity:0;
}
@keyframes shimSweep{
  0%{opacity:1;transform:translateX(-80px);}
  100%{opacity:0;transform:translateX(calc(100vw + 80px));}
}

/* ── Animated golden underline ── */
.lp-underline{
  position:fixed;left:50%;z-index:51;pointer-events:none;
  height:3px;width:0%;
  transform:translateX(-50%);
  background:linear-gradient(90deg,transparent,#FF9A33,#FFD060,#FF9A33,transparent);
  border-radius:2px;
  box-shadow:0 0 12px rgba(255,160,50,0.6),0 0 24px rgba(255,160,50,0.3);
  transition:width 0.75s cubic-bezier(0.34,1.4,0.64,1);
}
.lp-underline.draw{width:48%;}

/* ── Steam wisps ── */
.steam-wsp{
  position:fixed;pointer-events:none;z-index:49;
  width:6px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,200,100,0.55),transparent 70%);
  animation:steamRise var(--d) ease-in-out var(--dl) infinite;
}
@keyframes steamRise{
  0%{transform:translateY(0) scaleX(1);opacity:0.6;}
  40%{transform:translateY(-28px) scaleX(1.4);opacity:0.3;}
  100%{transform:translateY(-60px) scaleX(0.6);opacity:0;}
}

/* ── Subtitle letters ── */
.lp-sub-wrap{
  position:fixed;left:50%;z-index:53;
  transform:translateX(-50%);
  display:flex;align-items:center;gap:0;
  white-space:nowrap;
  pointer-events:none;
}
.lp-sub-letter{
  display:inline-block;
  font-family:'DM Sans',sans-serif;
  font-size:clamp(0.58rem,1.15vw,0.75rem);
  font-weight:800;
  letter-spacing:4.5px;
  text-transform:uppercase;
  color:#FF7A33;
  opacity:0;
  transform:translateY(-22px);
  transition:opacity 0.45s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1);
}
.lp-sub-letter.even{transform:translateY(22px);}
.lp-sub-letter.vis{opacity:1;transform:translateY(0) !important;}
.lp-sub-letter.spc{width:0.6em;flex-shrink:0;}

/* Decorative ✦ dots */
.lp-sub-dot{
  display:inline-block;
  font-size:0.5rem;color:rgba(255,122,51,0.55);
  opacity:0;
  transition:opacity 0.4s ease 0.9s;
  padding:0 0.55rem;
  transform:translateY(1px);
}
.lp-sub-dot.vis{opacity:1;}

/* Pulsing glow on subtitle row */
.lp-sub-wrap.glow-pulse{
  animation:subPulse 3.5s ease-in-out 1.2s infinite;
}
@keyframes subPulse{
  0%,100%{filter:drop-shadow(0 0 0px rgba(255,122,51,0));}
  50%{filter:drop-shadow(0 0 10px rgba(255,122,51,0.5));}
}

/* ── Particles ── */
.lp-pt{
  position:fixed;border-radius:50%;
  pointer-events:none;z-index:56;
  transform:translate(-50%,-50%);
  will-change:transform,opacity;
}

/* ── Form outer ── */
.lp-form-outer{
  position:fixed;left:50%;top:59%;
  transform:translate(-50%,-50%) translateY(36px);
  width:428px;max-width:93vw;
  z-index:65;
  opacity:0;pointer-events:none;
  transition:opacity 0.8s cubic-bezier(0.34,1.1,0.64,1),
              transform 0.8s cubic-bezier(0.34,1.1,0.64,1);
}
.lp-form-outer.show{
  opacity:1;pointer-events:auto;
  transform:translate(-50%,-50%) translateY(0);
}

/* ── Glassmorphism card ── */
.lp-card{
  background:rgba(255,252,247,0.86);
  backdrop-filter:blur(36px) saturate(1.6);
  -webkit-backdrop-filter:blur(36px) saturate(1.6);
  border-radius:26px;
  border:1px solid rgba(255,165,85,0.24);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.56) inset,
    0 32px 72px rgba(160,70,0,0.14),
    0 4px 20px rgba(0,0,0,0.07);
  padding:2.2rem 2.2rem 1.9rem;
  position:relative;overflow:hidden;
}
/* Shimmer top edge */
.lp-card::before{
  content:'';position:absolute;top:0;left:8%;right:8%;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,190,90,0.75),transparent);
}
/* Warm glow blob */
.lp-card::after{
  content:'';position:absolute;top:-65px;right:-65px;
  width:190px;height:190px;
  background:radial-gradient(circle,rgba(255,138,51,0.12),transparent 70%);
  border-radius:50%;pointer-events:none;
}

.lp-card-title{
  font-family:'Playfair Display',serif;
  font-size:1.42rem;font-weight:800;color:#2d1f0e;
  text-align:center;margin-bottom:0.28rem;letter-spacing:-0.3px;
}
.lp-card-sub{font-size:0.82rem;color:#a07850;text-align:center;margin-bottom:1.7rem;}

/* ── Error ── */
.lp-err{
  background:linear-gradient(135deg,#fff1f0,#ffe4e1);
  border:1px solid rgba(220,38,38,0.2);
  color:#dc2626;padding:.7rem 1rem;border-radius:11px;
  margin-bottom:1.1rem;font-size:0.82rem;text-align:center;
  animation:shk .4s ease;
}
@keyframes shk{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}

/* ── Google ── */
.lp-g-wrap{margin-bottom:1.25rem;display:flex;flex-direction:column;align-items:center;gap:.6rem;}
.lp-g-load{
  display:flex;align-items:center;justify-content:center;gap:.5rem;
  padding:.78rem 1rem;border:1.5px solid rgba(255,122,51,.22);
  border-radius:11px;font-size:.86rem;font-weight:600;color:#6b7280;
  background:rgba(255,255,255,.65);width:100%;
}
.lp-spin{
  width:16px;height:16px;flex-shrink:0;
  border:2px solid rgba(255,122,51,.2);border-top-color:#FF7A33;
  border-radius:50%;animation:_spin .7s linear infinite;
}
@keyframes _spin{to{transform:rotate(360deg)}}

/* ── Divider ── */
.lp-divider{display:flex;align-items:center;gap:.85rem;margin-bottom:1.25rem;}
.lp-dl{flex:1;height:1px;background:rgba(200,150,100,.2);}
.lp-dt{font-size:.67rem;color:#c8a070;font-weight:700;letter-spacing:1.5px;white-space:nowrap;}

/* ── Fields ── */
.lp-field{display:flex;flex-direction:column;gap:.38rem;margin-bottom:1rem;}
.lp-lbl{font-size:.77rem;font-weight:700;color:#6b4c2a;letter-spacing:.4px;}
.lp-inp{
  padding:.82rem 1rem;
  border:1.5px solid rgba(200,150,100,.27);
  border-radius:11px;font-size:.91rem;
  font-family:'DM Sans',sans-serif;color:#1f2937;
  background:rgba(255,252,248,.65);
  transition:border-color .2s,box-shadow .2s,background .2s;
  outline:none;width:100%;
}
.lp-inp:focus{
  border-color:#FF7A33;
  background:rgba(255,255,255,.95);
  box-shadow:0 0 0 3.5px rgba(255,122,51,.14);
}
.lp-inp::placeholder{color:#c8b090;}
.lp-pw{position:relative;}
.lp-pw .lp-inp{padding-right:3rem;}
.lp-eye{
  position:absolute;right:11px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;color:#b09070;
  padding:4px;transition:color .2s;
  display:flex;align-items:center;justify-content:center;
}
.lp-eye:hover{color:#FF7A33;}

/* ── Submit ── */
.lp-sub-btn{
  width:100%;padding:.9rem;
  background:linear-gradient(135deg,#FF7A33 0%,#FF4400 100%);
  color:white;border:none;border-radius:12px;
  font-weight:700;font-size:.95rem;font-family:'DM Sans',sans-serif;
  cursor:pointer;letter-spacing:.4px;margin-top:.3rem;
  box-shadow:0 4px 20px rgba(255,107,0,.38),0 1px 4px rgba(255,107,0,.2);
  transition:transform .15s,box-shadow .15s,opacity .15s;
  position:relative;overflow:hidden;
}
.lp-sub-btn::before{
  content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);
  transition:left .55s ease;
}
.lp-sub-btn:hover::before{left:150%;}
.lp-sub-btn:hover:not(:disabled){
  transform:translateY(-1.5px);
  box-shadow:0 8px 28px rgba(255,107,0,.48),0 2px 6px rgba(255,107,0,.25);
}
.lp-sub-btn:active:not(:disabled){transform:translateY(0);}
.lp-sub-btn:disabled{opacity:.65;cursor:not-allowed;}

/* ── Bottom ── */
.lp-bottom{text-align:center;font-size:.82rem;color:#a07850;margin-top:1.15rem;}
.lp-link{color:#FF7A33;font-weight:700;text-decoration:none;transition:color .2s;}
.lp-link:hover{color:#FF4400;}

/* ── Mobile ── */
@media(max-width:480px){
  .lp-card{padding:1.7rem 1.45rem 1.5rem;}
  .lp-card-title{font-size:1.28rem;}
  .lp-form-outer{top:62%;}
}
@media(max-width:380px){
  .lp-form-outer{top:64%;width:96vw;}
}
`;

// ═══════════════════════════════════════════════════════════════════════════
export default function Login() {
  // ── Animation state ──────────────────────────────────────────────────────
  const [letters,      setLetters]      = useState([]);
  const [particles,    setParticles]    = useState([]);
  const [floatIcons,   setFloatIcons]   = useState([]);
  const [subLetters,   setSubLetters]   = useState([]);      // SMART CANTEEN per-char
  const [underline,    setUnderline]    = useState(false);   // draw underline
  const [shimmerGo,    setShimmerGo]    = useState(false);   // shimmer wave
  const [steams,       setSteams]       = useState([]);      // steam wisps
  const [subGlow,      setSubGlow]      = useState(false);   // pulsing glow on sub
  const [formVis,      setFormVis]      = useState(false);
  const rafRef  = useRef(null);
  const mounted = useRef(true);

  // ── Form state ───────────────────────────────────────────────────────────
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [error,         setError]         = useState('');
  const [showPw,        setShowPw]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════════════════
  // MOUNT — build data + kick sequence
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    mounted.current = true;

    // Floating food icons
    setFloatIcons(Array.from({ length: 15 }, (_, i) => ({
      id:    i,
      emoji: FOOD_ICONS[i % FOOD_ICONS.length],
      x:     4 + Math.random() * 92,
      y:     4 + Math.random() * 92,
      size:  16 + Math.random() * 20,
      opacity: 0.04 + Math.random() * 0.07,
      dur:   7 + Math.random() * 7,
      delay: Math.random() * 6,
    })));

    // Steam wisps (will show after title settles)
    setSteams(Array.from({ length: 9 }, (_, i) => ({
      id:    i,
      dur:   1.6 + Math.random() * 1.2,
      delay: Math.random() * 2,
    })));

    // Build subtitle chars array
    setSubLetters(SUBTITLE.split('').map((ch, i) => ({
      id:    i,
      char:  ch,
      vis:   false,
      isEven: i % 2 === 0,
      isSpc: ch === ' ',
    })));

    // Scattered letters
    const initLts = TARGET.split('').map((char, i) => ({
      id:       i,
      char,
      display:  rndChar(),
      x:        10 + Math.random() * 80,
      y:        8  + Math.random() * 84,
      rot:      -55 + Math.random() * 110,
      scale:    0.45 + Math.random() * 0.7,
      opacity:  0,
      blur:     14,
      shadowY:  0,
      shadowBlur: 0,
      glow:     0,
      shimmer:  0,
    }));
    setLetters(initLts);

    setTimeout(() => runSequence(initLts), 250);

    return () => {
      mounted.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Fade in scattered
  // ═══════════════════════════════════════════════════════════════════════════
  const runSequence = (initLts) => {
    let lts = initLts.map(l => ({ ...l }));
    const t0  = performance.now();
    const dur = 650;

    const fadeIn = (now) => {
      if (!mounted.current) return;
      const p = Math.min((now - t0) / dur, 1);
      const e = easeOutQuart(p);
      lts = lts.map(l => ({ ...l, opacity: e * 0.88, blur: 14 * (1 - e) }));
      setLetters([...lts]);
      if (p < 1) { rafRef.current = requestAnimationFrame(fadeIn); }
      else        { setTimeout(() => jumpToCenter(lts), 380); }
    };
    rafRef.current = requestAnimationFrame(fadeIn);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Elastic jump to centre, one by one
  // ═══════════════════════════════════════════════════════════════════════════
  const jumpToCenter = (lts) => {
    if (!mounted.current) return;

    const n       = TARGET.length;
    const centX   = 50;
    const centY   = 44;     // vh — centre of screen during jump
    const dur     = 750;
    const spacing = 4.8;    // vw between letters

    const targets = TARGET.split('').map((_, i) => ({
      x: centX - (n * spacing) / 2 + i * spacing,
      y: centY,
    }));

    let done    = 0;
    const local = lts.map(l => ({ ...l }));

    TARGET.split('').forEach((_, i) => {
      const fromX = local[i].x;
      const fromY = local[i].y;
      const fromR = local[i].rot;
      const fromS = local[i].scale;
      let   t0    = null;

      const doJump = (now) => {
        if (!mounted.current) return;
        if (!t0) t0 = now;
        const p  = Math.min((now - t0) / dur, 1);
        const e  = easeOutElastic(p);
        const arc = -Math.sin(Math.min(p, 1) * Math.PI) * 18;  // height of arc

        local[i] = {
          ...local[i],
          x:       fromX + (targets[i].x - fromX) * e,
          y:       fromY + (targets[i].y - fromY) * e + arc,
          rot:     fromR  * (1 - e),
          scale:   fromS  + (1.2 - fromS) * e,
          opacity: 1,
          blur:    0,
          shadowY:    Math.sin(p * Math.PI) * 22,
          shadowBlur: Math.sin(p * Math.PI) * 28,
          display: p > 0.52 ? local[i].char : rndChar(),
        };
        setLetters([...local]);

        if (p < 1) {
          rafRef.current = requestAnimationFrame(doJump);
        } else {
          local[i].display = local[i].char;
          done++;
          if (done === n) setTimeout(() => scrambleSnap(local, targets), 160);
        }
      };

      setTimeout(() => { rafRef.current = requestAnimationFrame(doJump); }, i * 120);
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Scramble → snap
  // ═══════════════════════════════════════════════════════════════════════════
  const scrambleSnap = (lts, targets) => {
    if (!mounted.current) return;

    let   tick  = 0;
    const ticks = 24;
    const local = lts.map(l => ({ ...l }));

    const doScramble = () => {
      if (!mounted.current) return;
      tick++;
      const prog = tick / ticks;

      TARGET.split('').forEach((_, i) => {
        const jitter = (1 - prog) * 11;
        local[i] = {
          ...local[i],
          x:       targets[i].x + (Math.random() - 0.5) * jitter,
          y:       targets[i].y + (Math.random() - 0.5) * jitter,
          rot:     (Math.random() - 0.5) * 32 * (1 - prog),
          scale:   0.88 + Math.random() * 0.38,
          display: prog < 0.55 ? rndChar() : local[i].char,
          glow:    prog > 0.65 ? (prog - 0.65) / 0.35 * 0.7 : 0,
        };
      });
      setLetters([...local]);

      if (tick < ticks) {
        setTimeout(doScramble, 50);
      } else {
        // Final snap
        TARGET.split('').forEach((_, i) => {
          local[i] = { ...local[i],
            x: targets[i].x, y: targets[i].y,
            rot: 0, scale: 1.28, display: local[i].char, glow: 1, snapped: true,
          };
        });
        setLetters([...local]);

        fireParticles(targets);

        setTimeout(() => riseToTop(local, targets), 520);
      }
    };
    setTimeout(doScramble, 55);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Sparkle particles — burst at snap
  // ═══════════════════════════════════════════════════════════════════════════
  const fireParticles = (targets) => {
    const COLORS = ['#FF7A33','#FF5500','#FFAA55','#FFD700','#FF3D00','#FFC040','#FF6B35','#FFE066'];
    const pts = [];

    targets.forEach(pos => {
      for (let p = 0; p < 7; p++) {
        const ang = (Math.random() * Math.PI * 2);
        const spd = 1.8 + Math.random() * 3.8;
        pts.push({
          id:    `${pos.x}${p}${Math.random()}`,
          x: pos.x, y: pos.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 2.2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size:  3 + Math.random() * 6,
          life:  1,
        });
      }
    });
    setParticles(pts);

    const t0 = performance.now();
    const ap = (now) => {
      if (!mounted.current) return;
      setParticles(prev => prev
        .map(p => ({ ...p, x: p.x + p.vx * 0.09, y: p.y + p.vy * 0.09, vy: p.vy + 0.13, life: p.life - 0.022 }))
        .filter(p => p.life > 0)
      );
      if (now - t0 < 2400) rafRef.current = requestAnimationFrame(ap);
    };
    rafRef.current = requestAnimationFrame(ap);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4 — Rise to top
  //   Final y for ANNAPURNA letters: 7.5vh (centre of each letter)
  //   Subtitle band: 18.5vh  →  clear ~5.5vh gap below letters' bottom edge
  //   Underline:     15.5vh  →  just below letters
  //   Steam wisps:   13–16vh →  floating below letters, above subtitle
  // ═══════════════════════════════════════════════════════════════════════════
  const riseToTop = (lts, targets) => {
    if (!mounted.current) return;

    const t0    = performance.now();
    const dur   = 820;
    const fromY = 44;
    const toY   = 7.5;        // ← final settled position (vh, centre of letters)
    const local = lts.map(l => ({ ...l }));

    const doRise = (now) => {
      if (!mounted.current) return;
      const p = Math.min((now - t0) / dur, 1);
      const e = easeInOutCubic(p);

      TARGET.split('').forEach((_, i) => {
        local[i] = { ...local[i],
          y:     fromY + (toY - fromY) * e,
          scale: 1.28 - 0.23 * e,
          glow:  1 - e * 0.6,
        };
      });
      setLetters([...local]);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(doRise);
      } else {
        // ─ Trigger everything post-settle ─
        postSettle();
      }
    };
    rafRef.current = requestAnimationFrame(doRise);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // POST-SETTLE — underline, shimmer, subtitle chars, steam, form
  // ═══════════════════════════════════════════════════════════════════════════
  const postSettle = () => {
    if (!mounted.current) return;

    // 1. Draw underline
    setTimeout(() => { setUnderline(true); }, 60);

    // 2. Shimmer wave sweeps across letters
    setTimeout(() => { setShimmerGo(true); }, 160);

    // 3. Subtitle letters zipper in (odd from above, even from below)
    //    stagger each 65ms
    SUBTITLE.split('').forEach((_, i) => {
      setTimeout(() => {
        if (!mounted.current) return;
        setSubLetters(prev => prev.map((sl, idx) =>
          idx === i ? { ...sl, vis: true } : sl
        ));
      }, 280 + i * 70);
    });

    // 4. Subtitle starts pulsing glow after all letters visible
    const subDone = 280 + SUBTITLE.length * 70 + 200;
    setTimeout(() => { setSubGlow(true); }, subDone);

    // 5. Show form
    setTimeout(() => { setFormVis(true); }, subDone + 380);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Letter → inline style  (fixed positioned via vw/vh)
  // ═══════════════════════════════════════════════════════════════════════════
  const letterStyle = (l) => ({
    left:      `${l.x}vw`,
    top:       `${l.y}vh`,
    transform: `translate(-50%,-50%) rotate(${l.rot ?? 0}deg) scale(${l.scale ?? 1})`,
    opacity:   l.opacity ?? 0,
    filter:    buildFilter(l),
    textShadow: l.shadowY > 1
      ? `0 ${l.shadowY}px ${l.shadowBlur}px rgba(0,0,0,0.22), 0 ${l.shadowY * 0.4}px ${l.shadowBlur * 0.5}px rgba(160,50,0,0.15)`
      : '0 2px 5px rgba(0,0,0,0.09)',
  });

  const buildFilter = (l) => {
    const parts = [];
    if (l.blur  > 0.4) parts.push(`blur(${l.blur}px)`);
    if (l.glow  > 0)   parts.push(`drop-shadow(0 0 ${l.glow * 24}px rgba(255,122,51,${(l.glow * 0.72).toFixed(2)}))`);
    if (l.shimmer > 0) parts.push(`brightness(${1 + l.shimmer * 0.6}) saturate(${1 + l.shimmer * 0.4})`);
    return parts.join(' ') || 'none';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════════
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/menu');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (cr) => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/google`, { credential: cr.credential });
      await signInWithCustomToken(auth, res.data.customToken);
      navigate('/menu');
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Underline top — sits just below the bottom edge of the letters ─────────
  // Letters centred at 7.5vh, font ~4.8rem ≈ 77px on desktop.
  // Half that ≈ 38px. At 900px screen: 7.5vh = 67.5px. Bottom = 67.5+38 = 105px ≈ 11.7vh
  // Underline at 13.2vh → 1.5vh breathing room below letters.
  const underlineTop = '13.4vh';

  // Subtitle row centred at 17.8vh — well clear of 13.4vh underline
  const subtitleTop  = '17.8vh';

  // Steam wisps centred around 11–13vh (just below letter bases)
  const steamBaseTop = 11.5;

  return (
    <>
      <style>{CSS}</style>

      <div className="lp">
        <div className="lp-grain" />
        <div className="lp-vig" />

        {/* ── Background food SVG illustrations (faded B&W line-art) ──────── */}
        {BG_PLACEMENTS.map((p, i) => (
          <div
            key={i}
            className="bgf-outer"
            style={{
              left:    `${p.x}vw`,
              top:     `${p.y}vh`,
              width:   p.size,
              height:  p.size,
              opacity: p.op,
              color:   '#2d1f0e',
              transform: `translate(-50%,-50%) rotate(${p.rot}deg)`,
            }}
          >
            <div
              className="bgf-inner"
              style={{ '--d':`${p.dur}s`, '--dl':`${p.del}s` }}
            >
              <FoodSVG icon={p.icon} />
            </div>
          </div>
        ))}

        {/* ── Floating food icons ─────────────────────────────────────────── */}
        {floatIcons.map(ic => (
          <div key={ic.id} className="ff" style={{
            left: `${ic.x}vw`, top: `${ic.y}vh`,
            fontSize: `${ic.size}px`, opacity: ic.opacity,
            '--d': `${ic.dur}s`, '--dl': `${ic.delay}s`,
          }}>{ic.emoji}</div>
        ))}

        {/* ── Animated ANNAPURNA letters ──────────────────────────────────── */}
        {letters.map(l => (
          <div key={l.id} className="lp-letter" style={letterStyle(l)}>
            {l.display}
          </div>
        ))}

        {/* ── Shimmer wave sweeping across title ──────────────────────────── */}
        {shimmerGo && (
          <div
            className="lp-shimmer-overlay"
            style={{
              top:      '0',
              height:   '100%',
              animation: 'shimSweep 0.85s linear forwards',
            }}
          />
        )}

        {/* ── Golden underline drawing itself ─────────────────────────────── */}
        <div
          className={`lp-underline${underline ? ' draw' : ''}`}
          style={{ top: underlineTop }}
        />

        {/* ── Steam wisps rising from title base ──────────────────────────── */}
        {underline && steams.map((s, i) => (
          <div key={s.id} className="steam-wsp" style={{
            left:    `${38 + i * 3.2}vw`,
            top:     `${steamBaseTop}vh`,
            height:  `${8 + Math.random() * 6}px`,
            '--d':   `${s.dur}s`,
            '--dl':  `${s.delay}s`,
            opacity: 0,     // CSS animation handles opacity
            animationFillMode: 'both',
          }} />
        ))}

        {/* ── SMART CANTEEN — per-character zipper animation ──────────────── */}
        <div
          className={`lp-sub-wrap${subGlow ? ' glow-pulse' : ''}`}
          style={{ top: subtitleTop }}
        >
          <span className={`lp-sub-dot${subLetters.some(s => s.vis) ? ' vis' : ''}`}>✦</span>
          {subLetters.map((sl) =>
            sl.isSpc ? (
              <span key={sl.id} className="lp-sub-letter spc">&nbsp;</span>
            ) : (
              <span
                key={sl.id}
                className={`lp-sub-letter${sl.isEven ? ' even' : ''}${sl.vis ? ' vis' : ''}`}
              >
                {sl.char}
              </span>
            )
          )}
          <span className={`lp-sub-dot${subLetters.some(s => s.vis) ? ' vis' : ''}`}>✦</span>
        </div>

        {/* ── Sparkle particles ───────────────────────────────────────────── */}
        {particles.map(p => (
          <div key={p.id} className="lp-pt" style={{
            left:      `${p.x}vw`,
            top:       `${p.y}vh`,
            width:     p.size,
            height:    p.size,
            background: p.color,
            opacity:   Math.max(0, p.life),
            boxShadow: `0 0 ${p.size * 2.5}px ${p.color}90`,
          }} />
        ))}

        {/* ── Login card ──────────────────────────────────────────────────── */}
        <div className={`lp-form-outer${formVis ? ' show' : ''}`}>
          <div className="lp-card">
            <h2 className="lp-card-title">Welcome Back 🙏</h2>
            <p className="lp-card-sub">Sign in to order from the canteen</p>

            {error && <div className="lp-err">{error}</div>}

            {/* Google */}
            <div className="lp-g-wrap">
              {googleLoading ? (
                <div className="lp-g-load">
                  <div className="lp-spin" />
                  Signing in with Google…
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was cancelled. Please try again.')}
                  useOneTap={false}
                  width="384"
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  logo_alignment="left"
                />
              )}
            </div>

            <div className="lp-divider">
              <div className="lp-dl" />
              <span className="lp-dt">OR SIGN IN WITH EMAIL</span>
              <div className="lp-dl" />
            </div>

            <form onSubmit={handleLogin}>
              <div className="lp-field">
                <label className="lp-lbl">Email Address</label>
                <input
                  className="lp-inp" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required
                />
              </div>

              <div className="lp-field">
                <label className="lp-lbl">Password</label>
                <div className="lp-pw">
                  <input
                    className="lp-inp"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)} required
                  />
                  <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)}>
                    {showPw ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="lp-sub-btn" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            <div className="lp-bottom">
              Don't have an account?{' '}
              <a href="/register" className="lp-link">Create Account</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}