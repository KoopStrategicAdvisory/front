import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./slices/counterSlice";
import userReducer from "./slices/userSlice";
import contactReducer from "./slices/contactSlice";
import feedbackReducer from "./slices/feedbackSlice";
import calendarReducer from "./slices/calendarSlice";

export const reduxStore = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    contact: contactReducer,
    feedback: feedbackReducer,
    calendar: calendarReducer,
  },
});

export type AppDispatch = typeof reduxStore.dispatch;
export type ReduxRootState = ReturnType<typeof reduxStore.getState>;
