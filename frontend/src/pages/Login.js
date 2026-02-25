import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { GoogleLogin } from '@react-oauth/google';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'https://annapurna-smart-canteen1.onrender.com';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
    background-color: #faf9f6;
    background-image:
      radial-gradient(ellipse at 20% 20%, rgba(255,122,51,0.07) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 80%, rgba(255,107,0,0.05) 0%, transparent 60%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    padding: 2rem 1rem;
  }

  .brand-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
    animation: fadeDown 0.6s ease both;
  }

  .logo-wrap {
    position: relative;
    width: 88px;
    height: 88px;
    margin-bottom: 1rem;
  }

  .logo-ring {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px dashed rgba(255,122,51,0.3);
    animation: spin 20s linear infinite;
  }

  .logo-circle {
    width: 88px;
    height: 88px;
    background: linear-gradient(145deg, #FF7A33, #FF5500);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(255,107,0,0.35), 0 2px 8px rgba(255,107,0,0.2);
    position: relative;
    z-index: 1;
  }

  .brand-name {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    font-weight: 800;
    color: #2d1f0e;
    letter-spacing: -0.5px;
    line-height: 1;
    margin-bottom: 4px;
  }

  .brand-tagline {
    font-size: 0.78rem;
    color: #FF7A33;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  .card {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
    padding: 2.5rem 2.25rem;
    width: 420px;
    max-width: 95vw;
    animation: fadeUp 0.7s ease 0.15s both;
    border: 1px solid rgba(255,122,51,0.08);
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d1f0e;
    text-align: center;
    margin-bottom: 0.35rem;
  }

  .card-sub {
    font-size: 0.85rem;
    color: #9ca3af;
    text-align: center;
    margin-bottom: 1.75rem;
    font-weight: 400;
  }

  .error-box {
    background: #fff1f0;
    border: 1px solid #fca5a5;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    margin-bottom: 1.25rem;
    font-size: 0.85rem;
    text-align: center;
  }

  /* ── Google Button Wrapper ── */
  .google-btn-wrap {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.65rem;
  }

  .google-btn-wrap > div {
    width: 100% !important;
  }

  /* Force Google button to full width */
  .google-btn-wrap iframe {
    width: 100% !important;
  }

  .google-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.8rem 1rem;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 600;
    color: #6b7280;
    background: #fafafa;
    width: 100%;
  }

  .spin-sm {
    width: 16px;
    height: 16px;
    border: 2px solid #e5e7eb;
    border-top-color: #FF7A33;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* ── Divider ── */
  .divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: #f0f0f0;
  }

  .divider-text {
    font-size: 0.72rem;
    color: #c4c4c4;
    font-weight: 600;
    letter-spacing: 1px;
  }

  /* ── Fields ── */
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-bottom: 1.25rem;
  }

  .field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
    letter-spacing: 0.3px;
  }

  .field-input {
    padding: 0.8rem 1rem;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: 0.95rem;
    font-family: 'DM Sans', sans-serif;
    color: #1f2937;
    background: #fafafa;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    outline: none;
    width: 100%;
  }

  .field-input:focus {
    border-color: #FF7A33;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(255,122,51,0.12);
  }

  .password-wrap {
    position: relative;
  }

  .password-wrap .field-input {
    padding-right: 3rem;
  }

  .eye-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.2s ease;
  }

  .eye-btn:hover { color: #FF7A33; }

  .submit-btn {
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(135deg, #FF7A33 0%, #FF5500 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.95rem;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    letter-spacing: 0.5px;
    margin-top: 0.5rem;
    box-shadow: 0 4px 16px rgba(255,107,0,0.35);
    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s;
    position: relative;
    overflow: hidden;
  }

  .submit-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    pointer-events: none;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(255,107,0,0.45);
  }

  .submit-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .bottom-divider {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0 1.25rem;
  }

  .signup-row {
    text-align: center;
    font-size: 0.85rem;
    color: #9ca3af;
  }

  .signup-link {
    color: #FF7A33;
    font-weight: 700;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .signup-link:hover { color: #FF5500; }

  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes steamRise {
    0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.9; }
    50% { transform: translateY(-4px) scaleX(0.8); opacity: 0.5; }
  }

  .steam-1 { animation: steamRise 1.8s ease-in-out infinite; }
  .steam-2 { animation: steamRise 1.8s ease-in-out 0.35s infinite; }
  .steam-3 { animation: steamRise 1.8s ease-in-out 0.7s infinite; }

  @media (max-width: 480px) {
    .login-root { padding: 1.25rem 0.9rem; justify-content: flex-start; padding-top: 2rem; }
    .login-card { padding: 1.5rem 1.25rem 1.75rem; border-radius: 18px; }
    .brand-name { font-size: 1.65rem; }
    .login-title { font-size: 1.45rem; }
    .logo-wrap { width: 72px; height: 72px; }
    .logo-circle { width: 72px; height: 72px; }
    .brand-block { margin-bottom: 1.5rem; }
  }

  @media (max-width: 360px) {
    .login-card { padding: 1.25rem 1rem 1.5rem; }
    .field-input { font-size: 0.9rem; }
  }
`;

export default function Login() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [error, setError]               = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // ── Email / Password login ─────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/menu');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Google login ───────────────────────────────────────────────────────
  // Flow: Google gives us an ID token → send to backend → backend verifies
  // with google-auth-library → creates Firebase custom token → we sign in
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/google`, {
        credential: credentialResponse.credential,
      });
      await signInWithCustomToken(auth, res.data.customToken);
      navigate('/menu');
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in was cancelled or failed. Please try again.');
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">

        {/* Brand Block */}
        <div className="brand-block">
          <div className="logo-wrap">
            <div className="logo-ring" />
            <div className="logo-circle">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <path className="steam-1" d="M18 14 Q17 11 18 8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path className="steam-2" d="M26 13 Q25 10 26 7" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path className="steam-3" d="M34 14 Q33 11 34 8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <ellipse cx="26" cy="33" rx="16" ry="4.5" fill="rgba(255,255,255,0.25)"/>
                <path d="M10 29 Q10 42 26 42 Q42 42 42 29 Z" fill="white"/>
                <path d="M15 29 Q15 39 26 39 Q37 39 37 29 Z" fill="rgba(255,122,51,0.12)"/>
                <ellipse cx="26" cy="29" rx="16" ry="3.5" fill="white"/>
                <ellipse cx="26" cy="29" rx="14" ry="2.5" fill="rgba(255,107,0,0.18)"/>
                <circle cx="26" cy="34" r="2.5" fill="rgba(255,107,0,0.35)"/>
                <circle cx="20" cy="32.5" r="1.5" fill="rgba(255,107,0,0.25)"/>
                <circle cx="32" cy="32.5" r="1.5" fill="rgba(255,107,0,0.25)"/>
                <ellipse cx="26" cy="42.5" rx="18" ry="2.5" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
          </div>
          <h1 className="brand-name">Annapurna</h1>
          <p className="brand-tagline">Smart Canteen</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="card-title">Welcome Back</h2>
          <p className="card-sub">Sign in to your account to continue</p>

          {error && <div className="error-box">{error}</div>}

          {/* ── Google Sign-In Button ── */}
          <div className="google-btn-wrap">
            {googleLoading ? (
              <div className="google-loading">
                <div className="spin-sm" />
                Signing in with Google…
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                width="372"
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
              />
            )}
          </div>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">OR SIGN IN WITH EMAIL</span>
            <div className="divider-line" />
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="field-group">
              <label className="field-label">Email Address</label>
              <input
                className="field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="field-group">
              <label className="field-label">Password</label>
              <div className="password-wrap">
                <input
                  className="field-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>

            <div className="bottom-divider">
              <div className="divider-line" />
              <span className="divider-text">OR</span>
              <div className="divider-line" />
            </div>

            <div className="signup-row">
              Don't have an account?{' '}
              <a href="/register" className="signup-link">Create Account</a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}