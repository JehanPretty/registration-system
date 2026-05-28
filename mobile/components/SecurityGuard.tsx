import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal } from "react-native";
import { useRouter, usePathname, useRootNavigationState } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { API_BASE_URL } from "../constants/Config";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');

export default function SecurityGuard() {
  const rootNavigationState = useRootNavigationState();
  
  // Wait for the navigation state to be ready and have a key
  if (!rootNavigationState?.key) return null;
  
  return <SecurityGuardContent />;
}

function SecurityGuardContent() {
  const [isRestricted, setIsRestricted] = useState(false);
  
  const user = useAuthStore((state: any) => state.user);
  const logout = useAuthStore((state: any) => state.logout);
  
  const router = useRouter();
  const pathname = usePathname();
  const isAuthRoute =
    pathname.includes("(auth)") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.endsWith("/login") ||
    pathname.endsWith("/signup");

  // ✅ Fix 1: Reset restricted state whenever the logged-in user changes.
  // This prevents a new account from inheriting a restricted state from a
  // previous session, since SecurityGuard is never unmounted (it lives in root layout).
  useEffect(() => {
    setIsRestricted(false);
  }, [user?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isActive = true;

    const checkStatus = async () => {
      if (!user?.id || !isActive) return;
      
      try {
        const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
          headers: {
            "Bypass-Tunnel-Reminder": "true"
          }
        });
        
        if (!isActive) return;

        // ✅ Fix 2: Only restrict on confirmed JSON responses.
        // Tunnel errors (503, 523, HTML pages) are NOT a sign of account deletion.
        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");

        if ((res.status === 404 || res.status === 401) && isJson) {
          setIsRestricted(true);
        }
      } catch (e) {
        // Silently ignore network errors during background check
      }
    };

    if (user?.id && !isAuthRoute) {
      // ✅ Fix 3: Delay the very first check by 4 seconds to avoid false positives
      // immediately after login (tunnel may still be warming up).
      const startupDelay = setTimeout(() => {
        if (!isActive) return;
        checkStatus();
        interval = setInterval(checkStatus, 5000);
      }, 4000);

      return () => {
        isActive = false;
        clearTimeout(startupDelay);
        if (interval) clearInterval(interval);
      };
    }
    
    return () => {
      isActive = false;
      if (interval) clearInterval(interval);
    };
  }, [user?.id, pathname, isAuthRoute]); 

  const handleExit = () => {
    logout();
    setIsRestricted(false);
    // Safety: Ensure layout is mounted
    setTimeout(() => {
      router.replace("/(auth)/login");
    }, 500);
  };

  if (!isRestricted || isAuthRoute) return null;

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-half" size={40} color="#f43f5e" />
          </View>
          
          <Text style={styles.title}>Security Alert</Text>
          
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Your account has been restricted or removed by a secure system administrator.
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Your current session is no longer active</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleExit}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>OKAY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.9)', // slate-950/90
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 40,
    width: '100%',
    maxWidth: 400,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)', // rose-500/20
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fff1f2', // rose-50
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b', // slate-800
    marginBottom: 16,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  messageContainer: {
    alignItems: 'center',
    gap: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b', // slate-500
    textAlign: 'center',
    lineHeight: 22,
  },
  badge: {
    backgroundColor: '#fff1f2', // rose-50
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#f43f5e', // rose-500
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#e11d48', // rose-600
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  }
});
