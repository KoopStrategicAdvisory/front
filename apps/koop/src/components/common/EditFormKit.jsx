import React, { useState } from 'react';
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

function fmtFileSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Zona de carga de archivo con estilo de "dropzone" — arrastrar y soltar de
// verdad (antes solo se veia como dropzone pero solo funcionaba el click).
// `multiple` permite seleccionar/soltar varios archivos a la vez (subida
// masiva de documentos) — `files` es siempre un array, incluso con un solo
// archivo, para no tener dos formas distintas de leer la selección.
export function EditFileField({ label, files = [], onFilesChange, onRemove, accept, helperText, multiple = false }) {
  const [dragging, setDragging] = useState(false);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    onFilesChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  };

  return (
    <label className="kf-field">
      {label != null && <span className="kf-label">{label}</span>}
      <div
        className={`kf-file-drop${dragging ? ' kf-file-drop--active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <span className="kf-file-drop-icon">📎</span>
        <span className="kf-file-drop-text">
          <strong>Selecciona {multiple ? 'uno o varios archivos' : 'un archivo'}</strong> — {helperText || (multiple ? 'haz clic o arrastra varios archivos aquí' : 'haz clic o arrastra un archivo aquí')}
        </span>
        <input type="file" accept={accept} multiple={multiple} onChange={(e) => addFiles(e.target.files)} />
      </div>
      {files.length > 0 && (
        <div className="kf-file-selected-list">
          {files.map((f, i) => (
            <span key={`${f.name}-${f.size}-${i}`} className="kf-file-selected">
              <span>📄 {f.name} · {fmtFileSize(f.size)}</span>
              {onRemove && (
                <button type="button" className="kf-file-remove" onClick={() => onRemove(i)} title="Quitar">✕</button>
              )}
            </span>
          ))}
        </div>
      )}
    </label>
  );
}
