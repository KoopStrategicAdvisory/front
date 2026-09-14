import React from 'react';
import './Wizard.css';

// Header de progreso: circulos numerados conectados por una linea. Un paso
// es clickeable si ya se alcanzo antes (maxReached) — asi el usuario puede
// volver atras sin perder lo que lleva escrito.
export function WizardSteps({ steps, current, maxReached, onJump }) {
  return (
    <div className="kf-wizard-steps">
      {steps.map((label, i) => {
        const state = i === current ? 'active' : i < current ? 'done' : '';
        const reachable = i <= maxReached;
        return (
          <React.Fragment key={label}>
            <div className={`kf-wizard-step${state ? ` kf-wizard-step--${state}` : ''}`}>
              <button
                type="button"
                className="kf-wizard-step-btn"
                disabled={!reachable}
                onClick={() => reachable && onJump(i)}
              >
                <span className="kf-wizard-circle">{i < current ? '✓' : i + 1}</span>
                <span className="kf-wizard-label">{label}</span>
              </button>
            </div>
            {i < steps.length - 1 && (
              <div className={`kf-wizard-line${i < current ? ' kf-wizard-line--done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Envuelve el contenido del paso actual; al cambiar `stepKey` se remonta y
// dispara la animacion de entrada (con direccion segun se avance/retroceda).
export function WizardPanel({ stepKey, direction = 1, children }) {
  return (
    <div key={stepKey} className="kf-wizard-panel" style={{ '--kf-dir': direction }}>
      {children}
    </div>
  );
}

// Envuelve un campo/grupo que aparece condicionalmente (p.ej. subtipo tras
// elegir tipo de proceso) para que se desvanezca en vez de aparecer de golpe.
// `revealKey` debe cambiar cuando el contenido cambia, para re-disparar la animacion.
export function Reveal({ revealKey, children }) {
  return (
    <div key={revealKey} className="kf-reveal">
      {children}
    </div>
  );
}

export function WizardFooter({ children }) {
  return <div className="kf-wizard-footer">{children}</div>;
}
