import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../../../../styles/auth.css';
import logo from '../../../../Images/Koop Logo.png';
import { resetPasswordApi } from '../../../../api/auth';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) { setError('Enlace inválido: falta el token.'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    try {
      await resetPasswordApi({ token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err?.message || 'No se pudo restablecer la contraseña');
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
        <h2>Restablecer contraseña</h2>
        {error && <div className="auth-error">{error}</div>}
        {done ? (
          <div className="auth-info">✅ Contraseña actualizada. Redirigiendo al login...</div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="input-group">
              <label htmlFor="password">Nueva contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirm">Confirmar contraseña</label>
              <input
                id="confirm"
                type="password"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
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
