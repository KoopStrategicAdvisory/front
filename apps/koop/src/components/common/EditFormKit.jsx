import React from 'react';
import './EditFormKit.css';

export function EditForm({ children, style }) {
  return <div style={{ display: 'grid', gap: 16, ...(style || {}) }}>{children}</div>;
}

export function EditRow({ children, cols = 2, style }) {
  return (
    <div className="kf-row" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, ...(style || {}) }}>
      {children}
    </div>
  );
}

export function EditField({ label, type = 'text', value, onChange, placeholder, readOnly, inputProps, children }) {
  return (
    <label className="kf-field">
      {label != null && <span className="kf-label">{label}</span>}
      {children ? (
        children
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className="kf-input"
          {...(inputProps || {})}
        />
      )}
    </label>
  );
}

export function EditTextArea({ label, value, onChange, rows = 3, placeholder, textareaProps }) {
  return (
    <label className="kf-field">
      {label != null && <span className="kf-label">{label}</span>}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="kf-textarea"
        {...(textareaProps || {})}
      />
    </label>
  );
}

export function EditSelect({ label, value, onChange, options = [], placeholder = 'Seleccione una opción', selectProps }) {
  return (
    <label className="kf-field">
      {label != null && <span className="kf-label">{label}</span>}
      <select value={value} onChange={onChange} className="kf-select" {...(selectProps || {})}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={String(opt.value ?? opt.id)} value={String(opt.value ?? opt.id)}>
            {String(opt.label ?? opt.name ?? opt.id)}
          </option>
        ))}
      </select>
    </label>
  );
}

// Casilla de verificación con estilo consistente (usada por "Es hito preclusivo",
// "Visible para el cliente", etc. — antes cada pantalla la estilaba a mano).
export function EditCheckbox({ label, checked, onChange }) {
  return (
    <label className="kf-checkbox-label">
      <input type="checkbox" checked={!!checked} onChange={onChange} />
      {label}
    </label>
  );
}

// Zona de carga de archivo con estilo de "dropzone" en vez del input nativo feo.
export function EditFileField({ label, file, onChange, accept, helperText = 'Haz clic o arrastra un archivo aquí' }) {
  return (
    <label className="kf-field">
      {label != null && <span className="kf-label">{label}</span>}
      <div className="kf-file-drop">
        <span className="kf-file-drop-icon">📎</span>
        <span className="kf-file-drop-text">
          <strong>Selecciona un archivo</strong> — {helperText}
        </span>
        <input type="file" accept={accept} onChange={onChange} />
      </div>
      {file && (
        <span className="kf-file-selected">
          📄 {file.name} · {file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
        </span>
      )}
    </label>
  );
}
