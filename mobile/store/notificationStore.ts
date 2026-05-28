import { create } from 'zustand';
import { API_BASE_URL } from '../constants/Config';

interface NotificationState {
  userApp: any;
  adminPendingCount: number;
  dismissedIds: Set<string | number>;
  unreadIds: Set<string | number>;
  fetchNotifications: (userId: number, role: string) => Promise<void>;
  markRead: (id: string | number) => void;
  markAllRead: () => void;
  dismiss: (id: string | number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  userApp: null,
  adminPendingCount: 0,
  dismissedIds: new Set(),
  unreadIds: new Set(),

  fetchNotifications: async (userId: number, role: string) => {
    // 1. Fetch User Application Status
    try {
      const res = await fetch(`${API_BASE_URL}/applications/user/${userId}`);
      if (res.ok) {
        const app = await res.json();
        const prevApp = get().userApp;
        set({ userApp: app });

        // If status changed, mark as unread
        if (!prevApp || prevApp.status !== app.status) {
          const id = `user-app-${app.status}`;
          if (!get().dismissedIds.has(id)) {
            set(state => ({ unreadIds: new Set(state.unreadIds).add(id) }));
          }
        }
      }
    } catch (e) {}

    // 2. Fetch Admin Pending Count
    if (['Super Admin', 'Registrar Staff', 'Administrator'].includes(role)) {
      try {
        const res = await fetch(`${API_BASE_URL}/applications?status=pending`);
        if (res.ok) {
          const data = await res.json();
          const count = data.length;
          const prevCount = get().adminPendingCount;
          set({ adminPendingCount: count });

          if (count > 0 && count !== prevCount) {
             const id = 'admin-pending';
             if (!get().dismissedIds.has(id)) {
               set(state => ({ unreadIds: new Set(state.unreadIds).add(id) }));
             }
          }
        }
      } catch (e) {}
    }
  },

  markRead: (id) => set(state => {
    const next = new Set(state.unreadIds);
    next.delete(id);
    return { unreadIds: next };
  }),

  markAllRead: () => set({ unreadIds: new Set() }),

  dismiss: (id) => {
    set(state => ({ dismissedIds: new Set(state.dismissedIds).add(id) }));
    get().markRead(id);
  }
}));
