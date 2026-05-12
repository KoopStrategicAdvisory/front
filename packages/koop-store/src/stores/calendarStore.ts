import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KoopCalendarEvent } from '@repo/types';

interface CalendarState {
  events: KoopCalendarEvent[];
  setEvents: (events: KoopCalendarEvent[]) => void;
  addEvent: (event: KoopCalendarEvent) => void;
  updateEvent: (id: string, patch: Partial<KoopCalendarEvent>) => void;
  removeEvent: (id: string) => void;
  clearEvents: () => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      setEvents: (events) => set({ events }),
      addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
      updateEvent: (id, patch) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      clearEvents: () => set({ events: [] }),
    }),
    { name: 'koop.calendar.events' },
  ),
);
