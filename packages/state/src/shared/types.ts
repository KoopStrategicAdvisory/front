export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface FeedbackFormData {
  rating: number;
  comment: string;
  category: string;
}

export interface ContactState {
  formData: ContactFormData;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
}

export interface FeedbackState {
  formData: FeedbackFormData;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
}

export interface UserState {
  user: any;
  loading: boolean;
  error: string | null;
}

export interface CounterState {
  value: number;
}

export interface CalendarEventAudience {
  type: 'all' | 'clients';
  clientIds?: string[];
}

export interface CalendarEvent {
  id: string;
  date: string;
  note: string;
  audience?: CalendarEventAudience;
  createdAt?: string;
  createdBy?: string;
}

export interface CalendarState {
  events: CalendarEvent[];
}

export interface RootState {
  counter: CounterState;
  user: UserState;
  contact: ContactState;
  feedback: FeedbackState;
  calendar: CalendarState;
}

export const createInitialContactFormData = (): ContactFormData => ({
  name: "",
  email: "",
  message: "",
});

export const createInitialFeedbackFormData = (): FeedbackFormData => ({
  rating: 0,
  comment: "",
  category: "general",
});

export const createInitialRootState = (): RootState => ({
  counter: { value: 0 },
  user: { user: null, loading: false, error: null },
  contact: {
    formData: createInitialContactFormData(),
    submitting: false,
    submitted: false,
    error: null,
  },
  feedback: {
    formData: createInitialFeedbackFormData(),
    submitting: false,
    submitted: false,
    error: null,
  },
  calendar: { events: [] },
});
