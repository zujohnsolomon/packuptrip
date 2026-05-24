"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { SignupForm } from "./SignupForm";

const DESTINATIONS = [
  { label: "Wayanad", state: "Kerala", color: "#22c55e", emoji: "🌿" },
  { label: "Coorg", state: "Karnataka", color: "#f59e0b", emoji: "☕" },
  { label: "Munnar", state: "Kerala", color: "#06b6d4", emoji: "🍃" },
  { label: "Kabini", state: "Karnataka", color: "#8b5cf6", emoji: "🐘" },
];

export default function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
    document.title = "Create Account · Packuptrip";
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
    <main className="signup-root" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      {/* ─── Animated gradient orbs background ─── */}
      <div className="signup-orbs" aria-hidden>
        <div className="s-orb s-orb-1" />
        <div className="s-orb s-orb-2" />
        <div className="s-orb s-orb-3" />
      </div>

      {/* ─── Main Card ─── */}
      <div
        className="signup-card"
        style={{
          transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.45s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* ══ LEFT: Form Panel ══ */}
        <div className="s-form-panel">
          {/* Top bar */}
          <div className="s-form-top-bar s-fade-in" style={{ animationDelay: "0.05s" }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="s-back-btn"
              title="Back"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="s-region-pill">
              <span>📍</span>
              <span>Thalavadi, TN</span>
            </div>
          </div>

          {/* Brand + headline */}
          <div className="s-brand-block s-fade-in" style={{ animationDelay: "0.12s" }}>
            <div className="s-brand-icon">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" opacity="0.25" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88" fill="white" opacity="0.9" />
              </svg>
            </div>
            <h1 className="s-headline">Start your journey</h1>
            <p className="s-subheadline">Create a free account and explore</p>
          </div>

          {/* Toggle pills */}
          <div className="s-auth-toggle s-fade-in" style={{ animationDelay: "0.2s" }}>
            <span className="s-toggle-active">Register</span>
            <Link href="/login" className="s-toggle-opt">Login</Link>
          </div>

          {/* Form */}
          <div className="s-fade-in" style={{ animationDelay: "0.28s" }}>
            <Suspense fallback={
              <div className="s-form-loading">Enrolling your passport...</div>
            }>
              <SignupForm />
            </Suspense>
          </div>

          {/* Footer */}
          <div className="s-form-footer s-fade-in" style={{ animationDelay: "0.38s" }}>
            <span>Packuptrip · v2.8</span>
            <span>·</span>
            <Link href="/privacy" className="s-footer-link">Privacy</Link>
          </div>
        </div>

        {/* ══ RIGHT: Video + Floating Cards ══ */}
        <div className="s-media-panel">
          {/* Video background */}
          <div className="s-video-wrap">
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=85"
              className="s-media-video"
            >
              <source src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-winding-forest-road-in-autumn-41315-large.mp4" type="video/mp4" />
            </video>
            <div className="s-video-gradient-top" />
            <div className="s-video-gradient-bottom" />
            <div className="s-video-vignette" />
          </div>

          {/* ── Floating Card: Location badge top-right ── */}
          {mounted && (
            <div className="s-float-card s-float-card--location s-slide-in" style={{ top: 28, right: 28, animationDelay: "0.5s" }}>
              <div className="s-location-dot" />
              <div>
                <div className="s-location-name">Brahmagiri Wildlife Sanctuary</div>
                <div className="s-location-sub">📍 Wayanad, Kerala</div>
              </div>
            </div>
          )}

          {/* ── Floating Card: Stats card top-left ── */}
          {mounted && (
            <div className="s-float-card s-float-card--stats s-slide-in" style={{ top: 28, left: 28, animationDelay: "0.85s" }}>
              <div className="s-stats-title">🗺️ Popular Trips</div>
              <div className="s-stats-row">
                <div className="s-stat-item">
                  <div className="s-stat-number">48</div>
                  <div className="s-stat-label">Routes</div>
                </div>
                <div className="s-stat-divider" />
                <div className="s-stat-item">
                  <div className="s-stat-number">12</div>
                  <div className="s-stat-label">Vehicles</div>
                </div>
                <div className="s-stat-divider" />
                <div className="s-stat-item">
                  <div className="s-stat-number">4.9</div>
                  <div className="s-stat-label">Rating</div>
                </div>
              </div>
              <div className="s-stats-img-row">
                <div className="s-avatar-img">
                  <Image src="https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=60&q=80" alt="Trip" fill className="object-cover" />
                </div>
                <div className="s-avatar-img">
                  <Image src="https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&w=60&q=80" alt="Trip" fill className="object-cover" />
                </div>
                <div className="s-avatar-img">
                  <Image src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=60&q=80" alt="Trip" fill className="object-cover" />
                </div>
                <div className="s-avatar-more">+9</div>
              </div>
            </div>
          )}

          {/* ── Center overlay text ── */}
          <div className="s-media-tagline">
            <h2 className="s-tagline-heading">
              Kerala &amp; Karnataka<br />
              await <span className="s-tagline-accent">you</span>
            </h2>
            <p className="s-tagline-sub">
              Join hundreds of adventurers exploring the Western Ghats by road
            </p>
          </div>

          {/* ── Floating Card: Destinations bar bottom ── */}
          {mounted && (
            <div className="s-float-card s-float-card--destinations s-slide-up" style={{ animationDelay: "1.2s" }}>
              <div className="s-dest-label">🧭 Destinations</div>
              {DESTINATIONS.map((d) => (
                <div key={d.label} className="s-dest-badge">
                  <span className="s-dest-dot" style={{ background: d.color }} />
                  <span className="s-dest-emoji">{d.emoji}</span>
                  <span className="s-dest-name">{d.label}</span>
                  <span className="s-dest-state">{d.state}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── All scoped styles ─── */}
      <style>{`
        .signup-root {
          position: relative;
          display: flex;
          min-height: 100svh;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: #0c0a09;
          overflow: hidden;
        }

        .signup-orbs { position: absolute; inset: 0; pointer-events: none; }
        .s-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          animation: sOrbFloat 18s ease-in-out infinite;
        }
        .s-orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, #1e3a5f, #1e40af); top: -180px; right: -180px; animation-duration: 24s; }
        .s-orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, #065f46, #047857); bottom: -150px; left: -100px; animation-duration: 19s; animation-delay: -9s; }
        .s-orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, #713f12, #92400e); top: 40%; left: 40%; opacity: 0.22; animation-duration: 28s; animation-delay: -5s; }

        @keyframes sOrbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 30px) scale(1.05); }
          66% { transform: translate(20px, -20px) scale(0.97); }
        }

        .signup-card {
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
          animation: sCardRise 0.8s cubic-bezier(0.16,1,0.3,1) forwards;
          opacity: 0;
        }

        @keyframes sCardRise {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .s-form-panel {
          display: flex;
          flex-direction: column;
          width: 44%;
          padding: 2.25rem 2.5rem;
          background: #fafaf9;
          gap: 0.1rem;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .signup-card { flex-direction: column; max-width: 440px; }
          .s-form-panel { width: 100%; padding: 2rem 1.75rem; }
          .s-media-panel { display: none; }
        }

        .s-form-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }
        .s-back-btn {
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
        .s-back-btn:hover { background: #e7e5e4; transform: scale(1.05); }
        .s-back-btn:active { transform: scale(0.95); }

        .s-region-pill {
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

        .s-brand-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.25rem 0 0.75rem;
        }
        .s-brand-icon {
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
        .s-headline {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #1c1917;
          line-height: 1.15;
          margin: 0 0 0.3rem;
        }
        .s-subheadline {
          font-size: 0.72rem;
          color: #a8a29e;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .s-auth-toggle {
          display: inline-flex;
          align-self: center;
          align-items: center;
          background: #f3f2f0;
          border: 1px solid #e7e5e4;
          border-radius: 999px;
          padding: 0.2rem;
          margin: 0.5rem 0;
        }
        .s-toggle-opt {
          padding: 0.3rem 1.2rem;
          font-size: 0.68rem;
          font-weight: 700;
          color: #a8a29e;
          border-radius: 999px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .s-toggle-opt:hover { color: #57534e; }
        .s-toggle-active {
          padding: 0.3rem 1.2rem;
          font-size: 0.68rem;
          font-weight: 800;
          color: #1c1917;
          background: white;
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border: 1px solid #e7e5e4;
        }

        .s-form-loading {
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

        .s-form-footer {
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
        .s-footer-link {
          color: #a8a29e;
          text-decoration: none;
          transition: color 0.2s;
        }
        .s-footer-link:hover { color: #57534e; }

        /* Media panel */
        .s-media-panel {
          position: relative;
          flex: 1;
          overflow: hidden;
          background: #0c0a09;
        }
        .s-video-wrap { position: absolute; inset: 0; }
        .s-media-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.85;
          animation: sVideoScale 30s ease-in-out infinite alternate;
        }
        @keyframes sVideoScale {
          from { transform: scale(1.0); }
          to   { transform: scale(1.06); }
        }
        .s-video-gradient-top {
          position: absolute; top: 0; left: 0; right: 0; height: 35%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent);
        }
        .s-video-gradient-bottom {
          position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
        }
        .s-video-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%);
        }

        /* Float cards */
        .s-float-card {
          position: absolute;
          z-index: 20;
          background: rgba(255,255,255,0.97);
          border-radius: 1.25rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.9);
        }

        /* Location badge */
        .s-float-card--location {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          padding: 0.75rem 1rem;
        }
        .s-location-dot {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 50%;
          background: #fb923c;
          flex-shrink: 0;
          margin-top: 0.3rem;
          animation: sLocPulse 2.5s ease-in-out infinite;
        }
        @keyframes sLocPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,146,60,0.5); }
          50% { box-shadow: 0 0 0 5px rgba(251,146,60,0); }
        }
        .s-location-name {
          font-size: 0.68rem;
          font-weight: 800;
          color: #1c1917;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .s-location-sub {
          font-size: 0.6rem;
          font-weight: 600;
          color: #a8a29e;
          margin-top: 0.15rem;
          white-space: nowrap;
        }

        /* Stats card */
        .s-float-card--stats {
          padding: 0.875rem 1rem;
          width: 11rem;
        }
        .s-stats-title {
          font-size: 0.62rem;
          font-weight: 800;
          color: #57534e;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.625rem;
        }
        .s-stats-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .s-stat-item { text-align: center; flex: 1; }
        .s-stat-number {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1c1917;
          line-height: 1;
        }
        .s-stat-label {
          font-size: 0.55rem;
          font-weight: 600;
          color: #a8a29e;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: 0.1rem;
        }
        .s-stat-divider {
          width: 1px;
          height: 1.75rem;
          background: #e7e5e4;
          flex-shrink: 0;
        }
        .s-stats-img-row {
          display: flex;
          align-items: center;
          gap: -0.375rem;
        }
        .s-avatar-img {
          position: relative;
          width: 1.875rem;
          height: 1.875rem;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid white;
          margin-left: -0.375rem;
          flex-shrink: 0;
        }
        .s-avatar-img:first-child { margin-left: 0; }
        .s-avatar-more {
          width: 1.875rem;
          height: 1.875rem;
          border-radius: 50%;
          background: #f3f2f0;
          border: 2px solid white;
          margin-left: -0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.55rem;
          font-weight: 800;
          color: #57534e;
          flex-shrink: 0;
        }

        /* Destinations */
        .s-float-card--destinations {
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
        .s-dest-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: #57534e;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 0.2rem 0.75rem 0.2rem 0;
          border-right: 1px solid #e7e5e4;
          white-space: nowrap;
        }
        .s-dest-badge {
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
        .s-dest-badge:hover { transform: scale(1.08); background: #eae8e6; }
        .s-dest-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .s-dest-emoji { font-size: 0.65rem; }
        .s-dest-name {
          font-weight: 800;
          color: #1c1917;
          white-space: nowrap;
        }
        .s-dest-state {
          font-weight: 500;
          color: #a8a29e;
          font-size: 0.55rem;
          white-space: nowrap;
        }

        /* Tagline */
        .s-media-tagline {
          position: absolute;
          bottom: 6.5rem;
          left: 1.75rem;
          right: 1.75rem;
          z-index: 10;
        }
        .s-tagline-heading {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          line-height: 1.2;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 16px rgba(0,0,0,0.5);
          margin: 0 0 0.5rem;
        }
        .s-tagline-accent {
          display: inline-block;
          background: rgba(6, 78, 59, 0.75);
          color: #d1fae5;
          padding: 0.1em 0.5em;
          border-radius: 999px;
          font-style: italic;
          font-size: 0.88em;
          transform: rotate(-1.5deg);
          border: 1px solid rgba(52,211,153,0.25);
        }
        .s-tagline-sub {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.65);
          max-width: 20rem;
          line-height: 1.5;
          font-weight: 500;
        }

        /* Animations */
        .s-fade-in {
          opacity: 0;
          animation: sFadeUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes sFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .s-slide-in {
          opacity: 0;
          animation: sSlideIn 0.65s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes sSlideIn {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .s-slide-up {
          opacity: 0;
          animation: sSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes sSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
