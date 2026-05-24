"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "./LoginForm";

const DESTINATIONS = [
  { label: "Wayanad", state: "Kerala", color: "#22c55e", emoji: "🌿" },
  { label: "Coorg", state: "Karnataka", color: "#f59e0b", emoji: "☕" },
  { label: "Munnar", state: "Kerala", color: "#06b6d4", emoji: "🍃" },
  { label: "Kabini", state: "Karnataka", color: "#8b5cf6", emoji: "🐘" },
];

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    document.title = "Sign In · Packuptrip";
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: -dy * 3, y: dx * 3 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <main className="login-root" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* ─── Animated gradient orbs background ─── */}
      <div className="login-orbs" aria-hidden>
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ─── Main Card ─── */}
      <div
        className="login-card"
        style={{
          transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.45s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* ══ LEFT: Form Panel ══ */}
        <div className="form-panel">
          {/* Top bar */}
          <div className="form-top-bar fade-in" style={{ animationDelay: "0.05s" }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="back-btn"
              title="Back"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="region-pill">
              <span>📍</span>
              <span>Thalavadi, TN</span>
            </div>
          </div>

          {/* Brand + headline */}
          <div className="brand-block fade-in" style={{ animationDelay: "0.12s" }}>
            <div className="brand-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" opacity="0.25" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="white" opacity="0.9" />
              </svg>
            </div>
            <h1 className="headline">Welcome back</h1>
            <p className="subheadline">Sign in to continue your journey</p>
          </div>

          {/* Toggle pills */}
          <div className="auth-toggle fade-in" style={{ animationDelay: "0.2s" }}>
            <Link href="/signup" className="toggle-opt">Register</Link>
            <span className="toggle-active">Login</span>
          </div>

          {/* Form */}
          <div className="fade-in" style={{ animationDelay: "0.28s" }}>
            <Suspense fallback={
              <div className="form-loading">Preparing your journey...</div>
            }>
              <LoginForm />
            </Suspense>
          </div>

          {/* Footer */}
          <div className="form-footer fade-in" style={{ animationDelay: "0.38s" }}>
            <span>Packuptrip · v2.8</span>
            <span>·</span>
            <Link href="/privacy" className="footer-link">Privacy</Link>
          </div>
        </div>

        {/* ══ RIGHT: Video + Floating Cards ══ */}
        <div className="media-panel">
          {/* Video background */}
          <div className="video-wrap">
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=85"
              className="media-video"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-winding-forest-road-in-autumn-41315-large.mp4" type="video/mp4" />
            </video>
            {/* Gradient overlays */}
            <div className="video-gradient-top" />
            <div className="video-gradient-bottom" />
            <div className="video-vignette" />
          </div>

          {/* ── Floating Card: Location badge top-right ── */}
          {mounted && (
            <div className="float-card float-card--location slide-in" style={{ top: 28, right: 28, animationDelay: "0.5s" }}>
              <div className="location-dot" />
              <div>
                <div className="location-name">Western Ghats Reserve</div>
                <div className="location-sub">📍 Thalavadi, Tamil Nadu</div>
              </div>
            </div>
          )}

          {/* ── Floating Card: Photo collage top-left ── */}
          {mounted && (
            <div className="float-card float-card--collage slide-in" style={{ top: 28, left: 28, animationDelay: "0.85s" }}>
              <div className="collage-grid">
                <div className="collage-img collage-main">
                  <Image
                    src="https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=300&q=80"
                    alt="Camper van in winter"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="collage-img">
                  <Image
                    src="https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&w=150&q=80"
                    alt="Forest road"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="collage-img">
                  <Image
                    src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=150&q=80"
                    alt="Camping landscape"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="collage-caption">🚐 Vintage Boler · 1975</div>
            </div>
          )}

          {/* ── Center overlay text ── */}
          <div className="media-tagline">
            <h2 className="tagline-heading">
              Your next adventure<br />
              starts <span className="tagline-accent">here</span>
            </h2>
            <p className="tagline-sub">
              Discover RV &amp; camper van rentals across Kerala &amp; Karnataka
            </p>
          </div>

          {/* ── Floating Card: Destinations bar bottom ── */}
          {mounted && (
            <div className="float-card float-card--destinations slide-up" style={{ animationDelay: "1.2s" }}>
              <div className="dest-label">🧭 Destinations</div>
              {DESTINATIONS.map((d) => (
                <div key={d.label} className="dest-badge" style={{ "--badge-color": d.color } as React.CSSProperties}>
                  <span className="dest-dot" style={{ background: d.color }} />
                  <span className="dest-emoji">{d.emoji}</span>
                  <span className="dest-name">{d.label}</span>
                  <span className="dest-state">{d.state}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── All scoped styles ─── */}
      <style>{`
        /* === ROOT === */
        .login-root {
          position: relative;
          display: flex;
          min-height: 100svh;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: #0c0a09;
          overflow: hidden;
        }

        /* === ORBS === */
        .login-orbs { position: absolute; inset: 0; pointer-events: none; }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          animation: orbFloat 18s ease-in-out infinite;
        }
        .orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #854d0e, #92400e); top: -180px; left: -180px; animation-duration: 22s; }
        .orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #065f46, #047857); bottom: -150px; right: -100px; animation-duration: 18s; animation-delay: -8s; }
        .orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, #1e3a5f, #1e40af); top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.2; animation-duration: 26s; animation-delay: -4s; }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }

        /* === CARD === */
        .login-card {
          position: relative;
          z-index: 10;
          display: flex;
          width: 100%;
          max-width: 1040px;
          min-height: 640px;
          border-radius: 2rem;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.06),
            0 40px 80px -20px rgba(0,0,0,0.7),
            0 8px 24px -8px rgba(0,0,0,0.4);
          animation: cardRise 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
          opacity: 0;
        }

        @keyframes cardRise {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* === FORM PANEL === */
        .form-panel {
          display: flex;
          flex-direction: column;
          width: 44%;
          padding: 2.25rem 2.5rem;
          background: #fafaf9;
          gap: 0.1rem;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .login-card { flex-direction: column; max-width: 440px; }
          .form-panel { width: 100%; padding: 2rem 1.75rem; }
          .media-panel { display: none; }
        }

        /* Top bar */
        .form-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 999px;
          background: #f3f2f0;
          color: #44403c;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .back-btn:hover { background: #e7e5e4; transform: scale(1.05); }
        .back-btn:active { transform: scale(0.95); }

        .region-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.875rem;
          border-radius: 999px;
          background: #f3f2f0;
          border: 1px solid #e7e5e4;
          font-size: 0.65rem;
          font-weight: 700;
          color: #57534e;
          letter-spacing: 0.04em;
        }

        /* Brand */
        .brand-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.25rem 0 0.75rem;
        }
        .brand-icon {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 0.875rem;
          background: #1c1917;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.875rem;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        }
        .headline {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #1c1917;
          line-height: 1.15;
          margin: 0 0 0.3rem;
        }
        .subheadline {
          font-size: 0.72rem;
          color: #a8a29e;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        /* Toggle */
        .auth-toggle {
          display: inline-flex;
          align-self: center;
          align-items: center;
          background: #f3f2f0;
          border: 1px solid #e7e5e4;
          border-radius: 999px;
          padding: 0.2rem;
          margin: 0.5rem 0;
        }
        .toggle-opt {
          padding: 0.3rem 1.2rem;
          font-size: 0.68rem;
          font-weight: 700;
          color: #a8a29e;
          border-radius: 999px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .toggle-opt:hover { color: #57534e; }
        .toggle-active {
          padding: 0.3rem 1.2rem;
          font-size: 0.68rem;
          font-weight: 800;
          color: #1c1917;
          background: white;
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e7e5e4;
        }

        /* Form loading */
        .form-loading {
          height: 12rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          color: #a8a29e;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* Footer */
        .form-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.6rem;
          color: #d4ccc8;
          font-weight: 600;
          letter-spacing: 0.06em;
          margin-top: auto;
          padding-top: 0.75rem;
        }
        .footer-link {
          color: #a8a29e;
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-link:hover { color: #57534e; }

        /* === MEDIA PANEL === */
        .media-panel {
          position: relative;
          flex: 1;
          overflow: hidden;
          background: #0c0a09;
        }

        .video-wrap {
          position: absolute;
          inset: 0;
        }
        .media-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.85;
          animation: videoScale 30s ease-in-out infinite alternate;
        }
        @keyframes videoScale {
          from { transform: scale(1.0); }
          to   { transform: scale(1.06); }
        }

        .video-gradient-top {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 35%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent);
        }
        .video-gradient-bottom {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 50%;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        }
        .video-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%);
        }

        /* ── Float Cards ── */
        .float-card {
          position: absolute;
          z-index: 20;
          background: rgba(255,255,255,0.97);
          border-radius: 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.9);
        }

        /* Location badge */
        .float-card--location {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
        }
        .location-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: #38bdf8;
          flex-shrink: 0;
          margin-top: 0.3rem;
          animation: locPulse 2.5s ease-in-out infinite;
        }
        @keyframes locPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.5); }
          50% { box-shadow: 0 0 0 5px rgba(56,189,248,0); }
        }
        .location-name {
          font-size: 0.68rem;
          font-weight: 800;
          color: #1c1917;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .location-sub {
          font-size: 0.6rem;
          font-weight: 600;
          color: #a8a29e;
          margin-top: 0.15rem;
          white-space: nowrap;
        }

        /* Collage card */
        .float-card--collage {
          padding: 0.5rem;
          width: 10.5rem;
        }
        .collage-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 3px;
          border-radius: 0.75rem;
          overflow: hidden;
          height: 8.5rem;
        }
        .collage-img {
          position: relative;
          overflow: hidden;
        }
        .collage-main {
          grid-row: 1 / 3;
        }
        .collage-caption {
          font-size: 0.6rem;
          font-weight: 800;
          color: #1c1917;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.5rem 0.25rem 0.2rem;
        }

        /* Destinations bar */
        .float-card--destinations {
          left: 1.5rem;
          right: 1.5rem;
          bottom: 1.5rem;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem;
          padding: 0.6rem 0.875rem;
          border-radius: 1rem;
          background: rgba(255,255,255,0.95);
        }
        .dest-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: #57534e;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.2rem 0.75rem 0.2rem 0;
          border-right: 1px solid #e7e5e4;
          white-space: nowrap;
        }
        .dest-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          background: #f3f2f0;
          border: 1px solid #e7e5e4;
          font-size: 0.6rem;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }
        .dest-badge:hover { transform: scale(1.08); background: #eae8e6; }
        .dest-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .dest-emoji { font-size: 0.65rem; }
        .dest-name {
          font-weight: 800;
          color: #1c1917;
          white-space: nowrap;
        }
        .dest-state {
          font-weight: 500;
          color: #a8a29e;
          font-size: 0.55rem;
          white-space: nowrap;
        }

        /* ── Media tagline (center-bottom of video) ── */
        .media-tagline {
          position: absolute;
          bottom: 6.5rem;
          left: 1.75rem;
          right: 1.75rem;
          z-index: 10;
        }
        .tagline-heading {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          line-height: 1.2;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 16px rgba(0,0,0,0.5);
          margin: 0 0 0.5rem;
        }
        .tagline-accent {
          display: inline-block;
          background: rgba(20, 120, 80, 0.75);
          color: #d1fae5;
          padding: 0.1em 0.5em;
          border-radius: 999px;
          font-style: italic;
          font-size: 0.88em;
          transform: rotate(-1.5deg);
          border: 1px solid rgba(52,211,153,0.25);
        }
        .tagline-sub {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.65);
          max-width: 20rem;
          line-height: 1.5;
          font-weight: 500;
        }

        /* === FADE IN ANIMATIONS === */
        .fade-in {
          opacity: 0;
          animation: fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .slide-in {
          opacity: 0;
          animation: slideIn 0.65s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .slide-up {
          opacity: 0;
          animation: slideUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
