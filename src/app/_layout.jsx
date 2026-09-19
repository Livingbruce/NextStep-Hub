import AsyncStorage from "@react-native-async-storage/async-storage";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { createContext, useContext, useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Preloader from "../components/preLoader";

SplashScreen.preventAutoHideAsync();

const SESSION_KEY = "nsm_session_user";

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (isMounted && stored) {
          setUser(JSON.parse(stored));
        }
      } catch (err) {
        console.warn("Failed to restore session:", err);
      } finally {
        if (isMounted) setIsSessionRestored(true);
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isPreloaderDone) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/landing");
      }
    } else {
      if (user.role === "client" && segments[0] !== "(client)") {
        router.replace("/(client)");
      } else if (user.role === "counselor" && segments[0] !== "(counselor)") {
        router.replace("/(counselor)");
      } else if (user.role === "admin" && segments[0] !== "(admin)") {
        router.replace("/(admin)");
      }
    }
  }, [user, segments, isPreloaderDone]);

  const login = async (email, role, profile = null) => {
    const sessionUser = { email, role, profile };
    setUser(sessionUser);
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    } catch (err) {
      console.warn("Failed to persist session:", err);
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.warn("Failed to clear session:", err);
    }
  };

  if (!isPreloaderDone) {
    return (
      <Preloader
        isReady={isSessionRestored}
        onFinish={() => setIsPreloaderDone(true)}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Slot />
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
