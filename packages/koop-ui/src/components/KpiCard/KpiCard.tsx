import React from 'react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
}

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <div className="dash-item">
      <div style={{ fontSize: 12, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, opacity: 0.7 }}>{hint}</div>}
    </div>
  );
}
