import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../../../../styles/auth.css';
import logo from '../../../../Images/Koop Logo.png';
import { verifyEmailApi } from '../../../../api/auth';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Enlace inválido: falta el token de verificación.');
      return;
    }
    verifyEmailApi(token)
      .then((data) => {
        setStatus('ok');
        setMessage(data?.message || 'Tu correo fue verificado correctamente.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err?.message || 'No se pudo verificar el correo. El enlace puede haber expirado.');
      });
  }, [token]);

  return (
    <div className="auth-page">
      <video className="auth-bg-video" autoPlay muted loop playsInline preload="auto">
        <source src="/KoopCentroInternacional.mp4" type="video/mp4" />
      </video>
      <div className="auth-bg-overlay" />
      <div className="auth-card">
        <Link to="/"><img src={logo} alt="Logo KOOP" className="logo" /></Link>
        <h2>Verificación de cuenta</h2>
        {status === 'loading' && <p style={{ color: '#cbd5e1' }}>Verificando tu correo...</p>}
        {status === 'ok' && <div className="auth-info">✅ {message}</div>}
        {status === 'error' && <div className="auth-error">❌ {message}</div>}
        <div className="auth-actions" style={{ marginTop: 16 }}>
          <Link to="/login">Ir a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
