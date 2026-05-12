import { useCalendarStore } from '@repo/koop-store';

export default function useCalendarEvents() {
  const events = useCalendarStore((s) => s.events);
  const setEvents = useCalendarStore((s) => s.setEvents);
  const addEvent = useCalendarStore((s) => s.addEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const removeEvent = useCalendarStore((s) => s.removeEvent);

  const updateEvents = (updater) => {
    const next = typeof updater === 'function' ? updater(events) : updater;
    setEvents(next);
  };

  return [events, updateEvents, { addEvent, updateEvent, removeEvent }];
}
