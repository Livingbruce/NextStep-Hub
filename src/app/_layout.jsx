import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { createContext, useContext, useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "../../libs/supabase";
import Preloader from "../components/preLoader";

SplashScreen.preventAutoHideAsync();

const SESSION_KEY = "nsm_session_user";

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  checkStatus: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // 1. Restore local session
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const stored = await AsyncStorage.getItem(SESSION_KEY);
        if (isMounted && stored) {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
          await fetchFreshStatus(parsedUser);
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

  // 2. Fetch fresh database flags (approved, suspended)
  const fetchFreshStatus = async (currentUser) => {
    if (!currentUser?.id) return currentUser;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("approved, suspended")
        .eq("id", currentUser.id)
        .single();

      if (error || !profile) return currentUser;

      const updatedUser = {
        ...currentUser,
        approved: Boolean(profile.approved),
        suspended: Boolean(profile.suspended),
      };

      setUser(updatedUser);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.warn("Error fetching profile status:", err);
      return currentUser;
    }
  };

  // 3. Boolean Status & Role Guard
  useEffect(() => {
    if (!isPreloaderDone) return;
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)";
    const currentAuthScreen = segments[1];

    // Case A: No User logged in
    if (!user) {
      if (!inAuthGroup) router.replace("/(auth)/landing");
      return;
    }

    // Case B: User IS suspended (suspended === true)
    if (user.suspended === true) {
      if (currentAuthScreen !== "suspendedScreen") {
        router.replace("/(auth)/suspendedScreen");
      }
      return;
    }

    // Case C: User IS NOT approved (approved === false)
    if (user.approved === false) {
      if (currentAuthScreen !== "pendingApproval") {
        router.replace("/(auth)/pendingApproval");
      }
      return;
    }

    // Case D: User IS approved (approved === true) AND NOT suspended (suspended === false)
    const role = user?.role?.toLowerCase();

    if (role === "client" && segments[0] !== "(client)") {
      router.replace("/(client)");
    } else if (role === "counselor" && segments[0] !== "(counselor)") {
      router.replace("/(counselor)");
    } else if (role === "admin" && segments[0] !== "(admin)") {
      router.replace("/(admin)");
    }
  }, [user, segments, isPreloaderDone, navigationState?.key]);

  const login = async (email, role, profile = null) => {
    let sessionUser = {
      id: profile?.id,
      email,
      role,
      profile,
      approved: Boolean(profile?.approved),
      suspended: Boolean(profile?.suspended),
    };

    setUser(sessionUser);

    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    } catch (err) {
      console.warn("Failed to persist session:", err);
    }

    await fetchFreshStatus(sessionUser);
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Failed to clear session:", err);
    }
  };

  const checkStatus = async () => {
    if (user) {
      await fetchFreshStatus(user);
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
      <AuthContext.Provider value={{ user, login, logout, checkStatus }}>
        <Slot />
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
