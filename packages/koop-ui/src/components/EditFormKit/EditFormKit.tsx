import React from 'react';

const baseInputStyle: React.CSSProperties = {
  background: '#1b263b',
  color: '#e2e8f0',
  border: '1px solid rgba(148,163,184,0.35)',
  borderRadius: 8,
  padding: '8px 10px',
};

interface EditFormProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function EditForm({ children, style }: EditFormProps) {
  return <div style={{ display: 'grid', gap: 10, ...style }}>{children}</div>;
}

interface EditRowProps {
  children: React.ReactNode;
  cols?: number;
  style?: React.CSSProperties;
}

export function EditRow({ children, cols = 2, style }: EditRowProps) {
  return (
    <div style={{ display: 'grid', gap: 10, gridTemplateColumns: `repeat(${cols}, 1fr)`, ...style }}>
      {children}
    </div>
  );
}

interface EditFieldProps {
  label?: React.ReactNode;
  type?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  readOnly?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  children?: React.ReactNode;
}

export function EditField({ label, type = 'text', value, onChange, placeholder, readOnly, inputProps, children }: EditFieldProps) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      {label != null && <span>{label}</span>}
      {children ?? (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          style={baseInputStyle}
          {...inputProps}
        />
      )}
    </label>
  );
}

interface EditTextAreaProps {
  label?: React.ReactNode;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  rows?: number;
  placeholder?: string;
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export function EditTextArea({ label, value, onChange, rows = 3, placeholder, textareaProps }: EditTextAreaProps) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      {label != null && <span>{label}</span>}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...baseInputStyle, resize: 'vertical' }}
        {...textareaProps}
      />
    </label>
  );
}

interface SelectOption {
  value?: string | number;
  id?: string | number;
  label?: string;
  name?: string;
}

interface EditSelectProps {
  label?: React.ReactNode;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  options?: SelectOption[];
  placeholder?: string;
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
}

export function EditSelect({ label, value, onChange, options = [], placeholder = 'Seleccione una opción', selectProps }: EditSelectProps) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      {label != null && <span>{label}</span>}
      <select value={value} onChange={onChange} style={baseInputStyle} {...selectProps}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={String(opt.value ?? opt.id)} value={String(opt.value ?? opt.id)}>
            {String(opt.label ?? opt.name ?? opt.id)}
          </option>
        ))}
      </select>
    </label>
  );
}
