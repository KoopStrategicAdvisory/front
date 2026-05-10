export interface CalendarEventAudience {
  type: 'all' | 'clients';
  clientIds?: string[];
}

export interface KoopCalendarEvent {
  id: string;
  date: string;
  note: string;
  audience?: CalendarEventAudience;
  createdAt?: string;
  createdBy?: string;
}
