import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../../../styles/auth.css';
import logo from '../../../../Images/Koop Logo.png';
import { forgotPasswordApi } from '../../../../api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPasswordApi({ email });
      setSent(true);
    } catch (err) {
      setError(err?.message || 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <video className="auth-bg-video" autoPlay muted loop playsInline preload="auto">
        <source src="/KoopCentroInternacional.mp4" type="video/mp4" />
      </video>
      <div className="auth-bg-overlay" />
      <div className="auth-card">
        <Link to="/"><img src={logo} alt="Logo KOOP" className="logo" /></Link>
        <h2>Recuperar contraseña</h2>
        {error && <div className="auth-error">{error}</div>}
        {sent ? (
          <div className="auth-info">
            Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="input-group">
              <label htmlFor="email">Correo</label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
        <div className="auth-actions" style={{ marginTop: 16 }}>
          <Link to="/login">Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
