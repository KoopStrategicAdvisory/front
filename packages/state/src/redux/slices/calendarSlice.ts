import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CalendarState, CalendarEvent } from '../../shared/types';

const initialState: CalendarState = {
  events: [],
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<CalendarEvent[]>) => {
      state.events = action.payload;
    },
    addEvent: (state, action: PayloadAction<CalendarEvent>) => {
      state.events.push(action.payload);
    },
    updateEvent: (state, action: PayloadAction<CalendarEvent>) => {
      const idx = state.events.findIndex((e) => e.id === action.payload.id);
      if (idx !== -1) state.events[idx] = action.payload;
    },
    removeEvent: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter((e) => e.id !== action.payload);
    },
    clearEvents: (state) => {
      state.events = [];
    },
  },
});

export const { setEvents, addEvent, updateEvent, removeEvent, clearEvents } = calendarSlice.actions;
export default calendarSlice.reducer;
