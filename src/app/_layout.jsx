import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { createContext, useContext, useEffect, useState } from "react";
import { View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  cancelAppointmentReminders,
  setupLocalNotifications,
} from "../../libs/localNotifications";
import { supabase } from "../../libs/supabase";
import Preloader from "../components/preLoader";
import { NotificationsProvider } from "../context/NotificationsContext";

SplashScreen.preventAutoHideAsync();
//SplashScreen.setOptions({ duration: 150, fade: true });

function StatusBarGuard({ show }) {
  const insets = useSafeAreaInsets();
  if (!show || insets.top === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: insets.top,
        backgroundColor: "#F8FAFC",
        zIndex: 1000,
      }}
    />
  );
}

// Global cache to prevent session restoration from re-running on re-mounts
let cachedUser = null;
let isSessionRestoredGlobal = false;
let hasPreloaderFinishedGlobally = false;

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
  const [isStartupDone, setIsStartupDone] = useState(
    hasPreloaderFinishedGlobally,
  );
  const [isAppReady, setIsAppReady] = useState(hasPreloaderFinishedGlobally);
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    setupLocalNotifications().catch(() => {});
  }, []);

  // Helper to fetch profile data from Supabase
  const fetchUserProfile = async (authUser) => {
    if (!authUser) return null;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error || !profile) {
        return {
          id: authUser.id,
          email: authUser.email,
          ...authUser.user_metadata,
        };
      }

      return {
        id: authUser.id,
        email: authUser.email,
        role: profile.role,
        approved: profile.approved,
        suspended: profile.suspended,
        ...profile,
      };
    } catch (err) {
      console.warn("Error fetching profile status:", err);
      return null;
    }
  };

  // 1. Restore session via Supabase and listen to auth changes (token expiry, external sign-outs)
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const profilePromise = fetchUserProfile(session.user);
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve(null), 2500),
          );
          const profileUser = await Promise.race([
            profilePromise,
            timeoutPromise,
          ]);

          const resolvedUser = profileUser || {
            id: session.user.id,
            email: session.user.email,
            ...session.user.user_metadata,
          };

          if (isMounted) {
            cachedUser = resolvedUser;
            setUser(resolvedUser);
          }
        } else {
          if (isMounted) {
            cachedUser = null;
            setUser(null);
          }
        }
      } catch (err) {
        console.warn("Failed to restore session:", err);
      } finally {
        if (isMounted) {
          isSessionRestoredGlobal = true;
          setIsSessionRestored(true);
        }
      }
    };

    if (!isSessionRestoredGlobal) {
      initSession();
    } else {
      setIsSessionRestored(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        cachedUser = null;
        if (isMounted) setUser(null);
      } else if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        const profileUser = await fetchUserProfile(session.user);
        if (isMounted) {
          cachedUser = profileUser;
          setUser(profileUser);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 2. Real-time updates for approval, suspension, or role changes
  useEffect(() => {
    if (!user?.id) return;

    const ch = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (p) => {
          const updated = p.new;
          setUser(
            (u) =>
              u && {
                ...u,
                approved: updated.approved,
                suspended: updated.suspended,
                role: updated.role,
              },
          );

          // Force immediate redirect if suspended or unapproved dynamically
          if (updated.suspended) {
            router.replace("/(auth)/suspendedScreen");
          } else if (!updated.approved) {
            router.replace("/(auth)/pendingApproval");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, router]);

  // 3. Status & Role Guard: Executes as soon as session is restored and navigation is mounted
  useEffect(() => {
    if (!isSessionRestored) return;
    if (!navigationState?.key) return;

    if (!user) {
      const onAuthEntry =
        segments[0] === "(auth)" &&
        ["landing", "login", "signup"].includes(segments[1]);
      if (!onAuthEntry) {
        router.replace("/(auth)/landing");
        return;
      }
      setIsAppReady(true);
      return;
    }

    const isApproved = Boolean(user.approved);
    const isSuspended = Boolean(user.suspended);
    const currentAuthScreen = segments[1];

    if (isSuspended) {
      if (currentAuthScreen !== "suspendedScreen") {
        router.replace("/(auth)/suspendedScreen");
        return;
      }
      setIsAppReady(true);
      return;
    }

    if (!isApproved) {
      if (currentAuthScreen !== "pendingApproval") {
        router.replace("/(auth)/pendingApproval");
        return;
      }
      setIsAppReady(true);
      return;
    }

    const role = user?.role?.toLowerCase();
    const target =
      role === "client"
        ? "(client)"
        : role === "counselor"
          ? "(counselor)"
          : role === "admin"
            ? "(admin)"
            : null;

    if (target && segments[0] !== target) {
      router.replace(`/${target}`);
      return;
    }

    setIsAppReady(true);
  }, [user, segments, isSessionRestored, navigationState?.key, router]);

  const login = async (email, role, profile = null) => {
    const fullUser = {
      id: profile?.id,
      email,
      role: role || profile?.role,
      approved: profile?.approved,
      suspended: profile?.suspended,
      ...profile,
    };
    cachedUser = fullUser;
    setUser(fullUser);
  };

  const logout = async () => {
    try {
      await cancelAppointmentReminders().catch(() => {});
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Failed to clear session:", err);
    } finally {
      cachedUser = null;
      setUser(null);
    }
  };

  const checkStatus = async () => {
    if (!user) return null;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const fresh = await fetchUserProfile(session.user);
      cachedUser = fresh;
      setUser(fresh);
      return fresh;
    }
    return null;
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        style={!isStartupDone || segments[0] === "(auth)" ? "light" : "dark"}
        translucent
      />
      <AuthContext.Provider value={{ user, login, logout, checkStatus }}>
        <NotificationsProvider userId={user?.id}>
          <View style={{ flex: 1, backgroundColor: "#090D16" }}>
            <Slot />
            <StatusBarGuard show={segments[0] !== "(auth)" && isStartupDone} />

            {!isStartupDone && (
              <Preloader
                isReady={isAppReady}
                onFinish={() => {
                  hasPreloaderFinishedGlobally = true;
                  setIsStartupDone(true);
                }}
              />
            )}
          </View>
        </NotificationsProvider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
