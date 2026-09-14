import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../../../styles/auth.css';
import logo from '../../../../Images/Koop Logo.png';
import { useAuth } from '../../../../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', tipoDocumento: 'CC', numeroDocumento: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await register(form.name, form.email, form.password, {
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
      });
      if (res.ok) {
        const payload = res.data || { ok: true };
        if (payload?.accessToken) {
          navigate('/dashboard');
        } else {
          setSuccess('Registro recibido. Revisa tu correo para continuar con la activación de tu cuenta.');
          setForm({ name: '', email: '', password: '', tipoDocumento: 'CC', numeroDocumento: '' });
        }
      } else {
        setError(res.error || 'Error en registro');
      }
    } catch (err) {
      const msg = err?.message || 'Error en registro';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  return (
    <div className="auth-page">
      <video
        className="auth-bg-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/KoopCentroInternacional.mp4" type="video/mp4" />
      </video>
      <div className="auth-bg-overlay" />

      <div className="auth-card">
        <img src={logo} alt="Logo KOOP" className="logo" />
        <h2>Crear Cuenta</h2>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-info">{success}</div>}

        <form onSubmit={onSubmit}>
          <div className="input-group">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Tu nombre"
              value={form.name}
              onChange={onChange}
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="numeroDocumento">Documento de identidad</label>
            <div className="input-row">
              <select id="tipoDocumento" name="tipoDocumento" value={form.tipoDocumento} onChange={onChange}>
                <option value="CC">CC</option>
                <option value="CE">CE</option>
                <option value="PA">Pasaporte</option>
                <option value="NIT">NIT</option>
              </select>
              <input
                id="numeroDocumento"
                name="numeroDocumento"
                type="text"
                placeholder="Número de documento"
                value={form.numeroDocumento}
                onChange={onChange}
              />
            </div>
            <small style={{ color: '#9fb3cc', display: 'block', marginTop: 6, fontSize: 12 }}>
              Si ya eres cliente de la firma, con esto vinculamos tu cuenta a tu expediente.
            </small>
          </div>
          <div className="input-group">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Minimo 8 caracteres"
              value={form.password}
              onChange={onChange}
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Creando...' : 'Registrarme'}
          </button>
        </form>

        <div className="auth-actions">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </div>
      </div>
    </div>
  );
}


