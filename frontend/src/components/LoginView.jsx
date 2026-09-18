import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Film, 
  Sparkles, 
  CheckCircle2, 
  Compass, 
  ArrowRight 
} from 'lucide-react';

export default function LoginView() {
  const { login, register, loading } = useAuth();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (isLoginMode) {
      if (!email || !password) {
        setErrorMessage('Please provide both email and password.');
        return;
      }
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.message);
      }
    } else {
      if (!name || !email || !password) {
        setErrorMessage('Please fill in all fields.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      const res = await register(name, email, password);
      if (!res.success) {
        setErrorMessage(res.message);
      } else {
        setSuccessMessage('Account created successfully! Logging you in...');
      }
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
    }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'absolute',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
        top: '10%',
        left: '15%',
        filter: 'blur(50px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
        bottom: '10%',
        right: '15%',
        filter: 'blur(50px)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '1020px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        alignItems: 'center',
        zIndex: 1,
      }}>
        {/* Left Side: Brand Showcase */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }} className="badge badge-primary">
            <Sparkles size={14} /> Personal Anime Hub
          </div>

          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '18px',
            background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            AniVault
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '32px',
          }}>
            Your dedicated portal to search any anime, organize your personalized <strong>Watchlist</strong>, and celebrate your <strong>Completed</strong> journeys with custom ratings & reviews.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99,102,241,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0,
              }}>
                <Compass size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>Live Anime Search</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Instant cover art, MAL ratings, episode counts, and summaries.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(6,182,212,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan)',
                flexShrink: 0,
              }}>
                <Film size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>Dual List Tracking</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Easily move anime from "Plan to Watch" to "Completed" with 1-click.</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245,158,11,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold)',
                flexShrink: 0,
              }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>Personal Scores & Notes</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Log your personal rating out of 10 and keep your memory notes safe.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="glass-panel" style={{ padding: '36px', maxWidth: '460px', margin: '0 auto', width: '100%' }}>
          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '28px',
          }}>
            <button
              type="button"
              onClick={() => { setIsLoginMode(true); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: isLoginMode ? 'var(--primary)' : 'transparent',
                color: isLoginMode ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginMode(false); setErrorMessage(''); setSuccessMessage(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: !isLoginMode ? 'var(--primary)' : 'transparent',
                color: !isLoginMode ? '#fff' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
              {isLoginMode ? 'Welcome back, Otaku!' : 'Join the AniVault Guild'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              {isLoginMode 
                ? 'Enter your credentials to manage your anime database.' 
                : 'Create your account to start tracking your watchlists.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="alert-box alert-error">
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="alert-box alert-success">
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLoginMode && (
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <div className="input-field-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Satish / Spike Spiegel"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-field-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  className="input-field"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-field-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px', marginTop: '10px' }}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>{isLoginMode ? 'Signing in...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <span>{isLoginMode ? 'Sign In to AniVault' : 'Create My Account'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
