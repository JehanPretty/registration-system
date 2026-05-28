import { Tabs, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useEffect } from 'react';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const pathname = usePathname();
  const setLastLocation = useAuthStore((state: any) => state.setLastLocation);
  const { user } = useAuthStore() as any;
  const { unreadIds, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id, user.role);
      const interval = setInterval(() => fetchNotifications(user.id, user.role), 15000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (pathname) {
      setLastLocation(pathname);
    }
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1a234b',
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
          marginBottom: Platform.OS === 'android' ? 12 : 5,
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
          height: Platform.OS === 'android' ? 90 : 100,
          paddingBottom: Platform.OS === 'android' ? 10 : 30,
          paddingTop: 10,
          elevation: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: focused ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff') : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: focused ? 5 : 0,
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: focused ? 0.1 : 0,
                shadowRadius: 4,
              }}
              pointerEvents="none"
            >
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={focused ? (isDark ? '#60a5fa' : '#1a234b') : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="digital-id"
        options={{
          title: 'Digital ID',
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: focused ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff') : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: focused ? 5 : 0,
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: focused ? 0.1 : 0,
                shadowRadius: 4,
              }}
              pointerEvents="none"
            >
              <Ionicons name={focused ? "id-card" : "id-card-outline"} size={24} color={focused ? (isDark ? '#60a5fa' : '#1a234b') : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarBadge: unreadIds.size > 0 ? unreadIds.size : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            fontSize: 10,
            fontWeight: 'bold',
          },
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: focused ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff') : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: focused ? 5 : 0,
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: focused ? 0.1 : 0,
                shadowRadius: 4,
              }}
              pointerEvents="none"
            >
              <Ionicons name={focused ? "notifications" : "notifications-outline"} size={24} color={focused ? (isDark ? '#60a5fa' : '#1a234b') : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: focused ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff') : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                // Removed the translateY/marginBottom that might be breaking touch targets
                elevation: focused ? 5 : 0,
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: focused ? 0.1 : 0,
                shadowRadius: 4,
              }}
              pointerEvents="none"
            >
              <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={24} color={focused ? (isDark ? '#60a5fa' : '#1a234b') : color} />
            </View>
          ),
        }}
      />
      {/* Hidden screens - still accessible via navigation */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}