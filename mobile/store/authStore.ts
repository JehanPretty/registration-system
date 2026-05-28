import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      darkMode: false, // persisted dark mode preference

      // 0. Toggle dark mode preference
      setDarkMode: (value: boolean) => set({ darkMode: value }),

      // 1. Login sets full user data from backend
      login: (userData) => set({
        user: { 
          id: userData.id,
          name: userData.name,
          email: userData.email, 
          external_id: userData.external_id,
          avatarUrl: userData.avatar_url,
          role: userData.role_context,
          attributes: userData.attributes || {},
          profilePictureUri: null,
          signatureUri: null,
          signatureUrl: userData.signature_url,
          isProfileComplete: userData.is_profile_complete || false,
          status: userData.status || 'pending'
        }
      }),

      // 2. Updates user details and marks profile as complete
      updateProfile: (profileData) => set((state) => ({
        user: { 
          ...state.user, 
          ...profileData, 
          id: profileData.id || state.user?.id,
          name: profileData.name || state.user?.name,
          email: profileData.email || state.user?.email, 
          external_id: profileData.external_id || state.user?.external_id,
          avatarUrl: profileData.avatar_url || state.user?.avatarUrl,
          signatureUrl: profileData.signature_url || state.user?.signatureUrl,
          role: profileData.role_context || state.user?.role,
          attributes: profileData.attributes || state.user?.attributes || {},
          isProfileComplete: (profileData.is_profile_complete !== undefined) ? profileData.is_profile_complete : state.user?.isProfileComplete,
          status: profileData.status || state.user?.status
        }
      })),

      // 3. New Action: Specifically for the Profile Picture
      updateProfilePicture: (uri) => set((state) => ({
        user: {
          ...state.user,
          profilePictureUri: uri
        }
      })),

      // 3b. New Action: Specifically for the Personnel Signature
      updateSignature: (uri) => set((state) => ({
        user: {
          ...state.user,
          signatureUri: uri
        }
      })),

      // 4. Logout clears user but keeps darkMode preference intact
      logout: () => set({ user: null, lastLocation: null }),

      lastLocation: null,
      setLastLocation: (location: string) => set({ lastLocation: location }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);