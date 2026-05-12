import { create } from 'zustand';

type NoticeType = 'success' | 'danger' | 'info';

interface NoticeState {
  message: string;
  type: NoticeType;
}

interface UiState {
  notice: NoticeState | null;
  globalLoading: boolean;
  showNotice: (message: string, type?: NoticeType) => void;
  clearNotice: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  notice: null,
  globalLoading: false,
  showNotice: (message, type = 'info') => set({ notice: { message, type } }),
  clearNotice: () => set({ notice: null }),
  setLoading: (globalLoading) => set({ globalLoading }),
}));
