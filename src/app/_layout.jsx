import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../libs/supabase";
import Preloader from "../components/preLoader";
import { NotificationsProvider } from "../context/NotificationsContext";

SplashScreen.preventAutoHideAsync();

const SESSION_KEY = "nsm_session_user";

// Global cache to prevent session restoration from re-running on re-mounts
let cachedUser = null;
let isSessionRestoredGlobal = false;
let hasPreloaderFinishedGlobally = false;
let restorationPromise = null;

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  checkStatus: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const [user, setUser] = useState(cachedUser);
  const [isSessionRestored, setIsSessionRestored] = useState(
    isSessionRestoredGlobal,
  );
  const [isPreloaderDone, setIsPreloaderDone] = useState(
    hasPreloaderFinishedGlobally,
  );
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // 1. Restore local session globally (runs only once per app lifecycle)
  useEffect(() => {
    if (isSessionRestoredGlobal) return;

    if (!restorationPromise) {
      restorationPromise = (async () => {
        try {
          const stored = await AsyncStorage.getItem(SESSION_KEY);
          if (!stored) return null;

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            await AsyncStorage.removeItem(SESSION_KEY);
            return null;
          }

          const fresh = await fetchFreshStatus(JSON.parse(stored));
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
          return fresh;
        } catch (err) {
          console.warn("Failed to restore session:", err);
          return null;
        }
      })();
    }

    restorationPromise.then((freshUser) => {
      cachedUser = freshUser;
      isSessionRestoredGlobal = true;
      setUser(freshUser);
      setIsSessionRestored(true);
    });
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

      return {
        ...currentUser,
        approved: profile.approved,
        suspended: profile.suspended,
      };
    } catch (err) {
      console.warn("Error fetching profile status:", err);
      return currentUser;
    }
  };

  // 3. Status & Role Guard (runs once preloader is done)
  useEffect(() => {
    if (!isPreloaderDone) return;
    if (!navigationState?.key) return;

    if (!user) {
      if (segments[0] !== "(auth)") {
        router.replace("/(auth)/landing");
      }
      return;
    }

    const isApproved = Boolean(user.approved);
    const isSuspended = Boolean(user.suspended);
    const currentAuthScreen = segments[1];

    if (isSuspended) {
      if (currentAuthScreen !== "suspendedScreen") {
        router.replace("/(auth)/suspendedScreen");
      }
      return;
    }

    if (!isApproved) {
      if (currentAuthScreen !== "pendingApproval") {
        router.replace("/(auth)/pendingApproval");
      }
      return;
    }

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
    let base = {
      id: profile?.id,
      email,
      role,
      profile,
      approved: profile?.approved,
      suspended: profile?.suspended,
    };

    const sessionUser = await fetchFreshStatus(base);
    cachedUser = sessionUser;
    setUser(sessionUser);

    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    } catch (err) {
      console.warn("Failed to persist session:", err);
    }
  };

  const logout = async () => {
    cachedUser = null;
    setUser(null);
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Failed to clear session:", err);
    }
  };

  const checkStatus = async () => {
    if (!user) return;
    const fresh = await fetchFreshStatus(user);
    cachedUser = fresh;
    setUser(fresh);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
  };

  // Show preloader until session check is complete AND animation finishes
  if (!isPreloaderDone) {
    return (
      <Preloader
        isReady={isSessionRestored}
        onFinish={() => {
          hasPreloaderFinishedGlobally = true;
          setIsPreloaderDone(true);
        }}
      />
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, checkStatus }}>
      <NotificationsProvider userId={user?.id}>
        <Slot />
      </NotificationsProvider>
    </AuthContext.Provider>
  );
}
