import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CalendarWidget } from './CalendarWidget';
import type { KoopCalendarEvent } from '@repo/types';

const TODAY = new Date();

const sampleEvents: KoopCalendarEvent[] = [
  {
    id: 'evt-001',
    date: TODAY.toISOString().slice(0, 10),
    note: 'Audiencia de conciliación — Juzgado 5 Laboral',
    audience: { type: 'clients', clientIds: ['user-client-01'] },
  },
  {
    id: 'evt-002',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 5)
      .toISOString()
      .slice(0, 10),
    note: 'Vencimiento respuesta traslado demanda',
  },
  {
    id: 'evt-003',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 12)
      .toISOString()
      .slice(0, 10),
    note: 'Reunión con cliente — KOOP-2024-001',
    audience: { type: 'all' },
  },
];

const meta = {
  title: 'KoopUI/CalendarWidget',
  component: CalendarWidget,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#111827' }],
    },
    layout: 'padded',
  },
} satisfies Meta<typeof CalendarWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SinEventos: Story = {
  args: {
    events: [],
  },
};

export const ConEventos: Story = {
  args: {
    events: sampleEvents,
  },
};

export const Controlado: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date>(TODAY);
    const [events] = useState<KoopCalendarEvent[]>(sampleEvents);

    const dateKey = selected.toISOString().slice(0, 10);
    const dayEvents = events.filter((e) => e.date === dateKey);

    return (
      <div style={{ display: 'grid', gap: 16, maxWidth: 380, fontFamily: 'sans-serif', color: '#e2e8f0' }}>
        <CalendarWidget value={selected} onChange={setSelected} events={events} />
        <div style={{ padding: '12px 0', borderTop: '1px solid rgba(148,163,184,0.2)' }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
            {selected.toLocaleDateString('es-ES', { dateStyle: 'full' })}
          </div>
          {dayEvents.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.5 }}>Sin eventos para este día</div>
          ) : (
            dayEvents.map((e) => (
              <div key={e.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                {e.note}
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
};
