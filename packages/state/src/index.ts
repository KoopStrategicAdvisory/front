export * from "./redux";
export * from "./zustand";
export * from "./shared/selectors";

export type { StateManager, StateManagerType } from "./shared/StateManager";
export type {
  RootState,
  CounterState,
  UserState,
  ContactState,
  FeedbackState,
  ContactFormData,
  FeedbackFormData,
  CalendarState,
  CalendarEvent,
  CalendarEventAudience,
} from "./shared/types";

export { StateManagerFactory } from "./managers/StateManagerFactory";
export {
  getStateManager,
  getCurrentManagerType,
  setStateManagerType,
  initializeStateManager,
} from "./managers/StateManagerProvider";
export {
  useAgnosticCounter,
  useAgnosticContactForm,
  useAgnosticFeedbackForm,
  useAgnosticUser,
} from "./managers/hooks";
export type {
  UseAgnosticContactFormConfig,
  UseAgnosticFeedbackFormConfig,
} from "./managers/hooks";
