import React, { useEffect } from 'react';
import './Modal.css';

// Modal compartido: antes cada página (Expedientes, ExpedienteDetalle) tenia
// su propia version inline (fondo plano, sin animacion, sombra minima).
export function Modal({ show, onClose, title, size, children }) {
  useEffect(() => {
    if (!show) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onClose]);

  if (!show) return null;
  return (
    <div className="kf-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className={`kf-modal-card${size === 'sm' ? ' kf-modal-card--sm' : ''}`}>
        {title != null && (
          <div className="kf-modal-header">
            <h3 className="kf-modal-title">{title}</h3>
            <button type="button" className="kf-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>
        )}
        <div className="kf-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ModalFooter({ onCancel, onConfirm, confirmLabel = 'Guardar', cancelLabel = 'Cancelar', confirmDisabled }) {
  return (
    <div className="kf-modal-footer">
      <button className="btn btn-secondary" onClick={onCancel} disabled={confirmDisabled}>{cancelLabel}</button>
      <button className="btn btn-primary" onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</button>
    </div>
  );
}

export function DeleteModal({ show, onClose, onConfirm, label, description }) {
  return (
    <Modal show={show} onClose={onClose} title="🗑️ Confirmar eliminación" size="sm">
      <p className="kf-modal-text">
        {description || (
          <>¿Eliminar <strong style={{ color: '#fc771c' }}>{label}</strong>?</>
        )}
      </p>
      <p className="kf-modal-warning">⚠️ Esta acción no se puede deshacer.</p>
      <div className="kf-modal-footer" style={{ padding: '20px 0 0' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-danger" onClick={onConfirm}>Eliminar</button>
      </div>
    </Modal>
  );
}
