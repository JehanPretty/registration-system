import "../global.css";
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SecurityGuard from "../components/SecurityGuard";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from "nativewind";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";

// ─── Reanimated Configuration ──────────────────────────────────────────
// Disable strict mode to silence the "Reading from value during render" 
// warnings often triggered by NativeWind v4 in React 19.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const darkMode = useAuthStore((state: any) => state.darkMode);

  // On app start, apply the user's saved dark mode preference.
  // This overrides the system theme so only the user's choice matters.
  useEffect(() => {
    setColorScheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? "light" : "dark"} />
      <SecurityGuard />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* This 'name' refers to the FOLDER (auth) */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

          {/* This 'name' refers to the FOLDER (tabs) */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* If you have a modal.tsx file in app/ */}
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
