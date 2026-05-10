import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './notice.module.scss';

export type NoticeKind = 'success' | 'danger';

const PALETTES: Record<NoticeKind, { bg: string; fg: string; border: string }> = {
  success: { bg: '#064e3b', fg: '#a7f3d0', border: 'rgba(16,185,129,0.35)' },
  danger: { bg: '#7f1d1d', fg: '#fecaca', border: 'rgba(248,113,113,0.35)' },
};

export interface NoticeProps {
  kind?: NoticeKind;
  children: ReactNode;
  autoHideMs?: number;
  onClose?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function Notice({ kind = 'success', children, autoHideMs, onClose, style, className }: NoticeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!autoHideMs) return;
    const t = setTimeout(() => {
      setVisible(false);
      const t2 = setTimeout(() => onClose?.(), 220);
      return () => clearTimeout(t2);
    }, autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, onClose]);

  const pal = PALETTES[kind] ?? PALETTES.success;

  const close = () => {
    setVisible(false);
    setTimeout(() => onClose?.(), 200);
  };

  const inlineStyle: CSSProperties = {
    background: pal.bg,
    color: pal.fg,
    border: `1px solid ${pal.border}`,
    ...style,
  };

  return (
    <div
      role="alert"
      className={[styles.notice, visible ? styles.visible : styles.hidden, className].filter(Boolean).join(' ')}
      style={inlineStyle}
    >
      <div className={styles.content}>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar aviso"
          className={styles.closeBtn}
          style={{ color: pal.fg }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export function SuccessNotice(props: Omit<NoticeProps, 'kind'>) {
  return <Notice kind="success" {...props} />;
}

export function DangerNotice(props: Omit<NoticeProps, 'kind'>) {
  return <Notice kind="danger" {...props} />;
}
