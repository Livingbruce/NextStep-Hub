import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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

import CallModal from "../components/call/CallModal";
import MiniCallBar from "../components/call/MiniCallBar";
import Preloader from "../components/preLoader";

import { CallProvider } from "../context/CallContext";
import { IncomingCallProvider } from "../context/IncomingCallContext";
import { NotificationsProvider } from "../context/NotificationsContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

const AUTH_ENTRY_SCREENS = ["landing", "login", "signup"];
const PRELOADER_BACKGROUND = "#090D16";
const SESSION_CHECK_TIMEOUT = 8000;

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
  checkStatus: async () => null,
});

export const useAuth = () => useContext(AuthContext);

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

/**
 * Adds a timeout to Supabase requests.
 */
function withTimeout(promise, label, timeout = SESSION_CHECK_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out. Check your connection.`));
    }, timeout);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Validate the access token with Supabase and retrieve the real profile.
 */
async function getVerifiedUser(session) {
  if (!session?.access_token || !session?.user?.id) {
    return null;
  }

  try {
    // getSession() alone is not enough. It may return a locally stored session.
    const {
      data: { user: verifiedAuthUser },
      error: authError,
    } = await withTimeout(
      supabase.auth.getUser(session.access_token),
      "Session validation",
    );

    if (authError || !verifiedAuthUser?.id) {
      console.warn("[Auth] Session could not be validated:", authError);
      return null;
    }

    const { data: profile, error: profileError } = await withTimeout(
      supabase
        .from("profiles")
        .select("*")
        .eq("id", verifiedAuthUser.id)
        .maybeSingle(),
      "Profile lookup",
    );

    if (profileError) {
      console.warn("[Auth] Profile lookup failed:", profileError);
      return null;
    }

    if (!profile) {
      console.warn("[Auth] No profile exists for this account.");
      return null;
    }

    const role = String(profile.role || "")
      .trim()
      .toLowerCase();

    if (!role) {
      console.warn("[Auth] Account has no assigned role.");
      return null;
    }

    // Clients do not require staff approval or staff suspension checks.
    if (role !== "client") {
      if (
        typeof profile.approved !== "boolean" ||
        typeof profile.suspended !== "boolean"
      ) {
        console.warn("[Auth] Staff account status is incomplete.");
        return null;
      }
    }

    return {
      ...verifiedAuthUser.user_metadata,
      ...profile,
      id: verifiedAuthUser.id,
      email: verifiedAuthUser.email,
      role,
    };
  } catch (error) {
    console.warn("[Auth] Could not verify the current account:", error);
    return null;
  }
}

function getRoleRoute(role) {
  switch (String(role || "").toLowerCase()) {
    case "client":
      return "/(client)";

    case "counselor":
      return "/(counselor)";

    case "admin":
      return "/(admin)";

    default:
      return "/(auth)/landing";
  }
}

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [isStartupDone, setIsStartupDone] = useState(false);

  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const mountedRef = useRef(true);
  const authCheckIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setupLocalNotifications().catch((error) => {
      console.warn("[Notifications] Setup failed:", error);
    });
  }, []);

  /**
   * 1. Restore and validate the existing Supabase session.
   */
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        if (!navigationState?.key) return;

        const {
          data: { session },
          error: sessionError,
        } = await withTimeout(
          supabase.auth.getSession(),
          "Session restoration",
        );

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          if (active) {
            setUser(null);
          }
          return;
        }

        const verifiedUser = await getVerifiedUser(session);

        if (!active) return;

        // Network failure, invalid token, or missing profile:
        // show the landing page instead of a status screen.
        setUser(verifiedUser);
      } catch (error) {
        console.warn("[Auth] Startup session check failed:", error);

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsSessionRestored(true);
        }
      }
    };

    if (!navigationState?.key) return undefined;

    // Reuse an in-progress restoration rather than launching another one.
    restoreSession();

    return () => {
      active = false;
    };
  }, [navigationState?.key]);

  /**
   * 2. Listen for login, logout, token refresh, and account changes.
   */
  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT" || !session) {
        authCheckIdRef.current += 1;
        setUser(null);
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        const checkId = ++authCheckIdRef.current;

        Promise.resolve().then(async () => {
          const verifiedUser = await getVerifiedUser(session);

          if (!active || checkId !== authCheckIdRef.current) return;

          setUser(verifiedUser);
        });
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * 3. Monitor actual database changes to approval/suspension.
   */
  useEffect(() => {
    if (!user?.id || user.role === "client") return;

    const channel = supabase
      .channel(`profile-status-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new;

          if (!updated) return;

          // Ignore incomplete status updates. Never infer suspension.
          if (
            typeof updated.approved !== "boolean" ||
            typeof updated.suspended !== "boolean"
          ) {
            return;
          }

          const nextUser = {
            ...user,
            ...updated,
            role: String(updated.role || user.role).toLowerCase(),
          };

          setUser(nextUser);
        },
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[Auth] Profile status subscription issue:", error);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.role]);

  /**
   * 4. Central navigation guard.
   */
  useEffect(() => {
    if (!isSessionRestored || !navigationState?.key) return;

    const currentGroup = segments[0];
    const currentScreen = segments[1];

    // No verified user: only allow the public authentication entry screens.
    if (!user) {
      const isAllowedAuthScreen =
        currentGroup === "(auth)" && AUTH_ENTRY_SCREENS.includes(currentScreen);

      if (!isAllowedAuthScreen) {
        router.replace("/(auth)/landing");
        return;
      }

      setIsAppReady(true);
      return;
    }

    const role = String(user.role || "").toLowerCase();

    // CLIENT RULE:
    // A client never sees pending approval or suspended screens.
    if (role === "client") {
      if (currentGroup !== "(client)") {
        router.replace("/(client)");
        return;
      }

      setIsAppReady(true);
      return;
    }

    // Staff status must have been verified as actual booleans.
    if (
      typeof user.approved !== "boolean" ||
      typeof user.suspended !== "boolean"
    ) {
      router.replace("/(auth)/landing");
      return;
    }

    // Suspension takes precedence only when explicitly true.
    if (user.suspended === true) {
      if (currentScreen !== "suspendedScreen") {
        router.replace("/(auth)/suspendedScreen");
        return;
      }

      setIsAppReady(true);
      return;
    }

    // Pending approval is shown only when explicitly false.
    if (user.approved === false) {
      if (currentScreen !== "pendingApproval") {
        router.replace("/(auth)/pendingApproval");
        return;
      }

      setIsAppReady(true);
      return;
    }

    // Approved staff members go directly to their role dashboard.
    const target = getRoleRoute(role);

    if (target === "/(auth)/landing") {
      router.replace(target);
      return;
    }

    const targetGroup = target.replace("/", "");

    if (currentGroup !== targetGroup) {
      router.replace(target);
      return;
    }

    setIsAppReady(true);
  }, [user, segments, isSessionRestored, navigationState?.key, router]);

  const login = useCallback(async (email, role, profile = null) => {
    if (!profile?.id) {
      throw new Error("Your account profile could not be loaded.");
    }

    const normalizedRole = String(role || profile.role || "")
      .trim()
      .toLowerCase();

    if (!normalizedRole) {
      throw new Error("Your account has no assigned role.");
    }

    if (
      normalizedRole !== "client" &&
      (typeof profile.approved !== "boolean" ||
        typeof profile.suspended !== "boolean")
    ) {
      throw new Error("Your account status could not be verified.");
    }

    setUser({
      ...profile,
      email: email || profile.email,
      role: normalizedRole,
    });

    setIsSessionRestored(true);
  }, []);

  /**
   * 6. Logout.
   */
  const logout = useCallback(async () => {
    try {
      await cancelAppointmentReminders().catch(() => {});

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * 7. Manually refresh approval/suspension status.
   */
  const checkStatus = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session?.user) {
      setUser(null);
      return null;
    }

    const freshUser = await getVerifiedUser(session);

    if (!freshUser) {
      throw new Error(
        "We couldn't verify your account. Check your internet connection and try again.",
      );
    }

    setUser(freshUser);
    return freshUser;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        style={!isStartupDone || segments[0] === "(auth)" ? "light" : "dark"}
        translucent
      />

      <AuthContext.Provider
        value={{
          user,
          login,
          logout,
          checkStatus,
        }}
      >
        <NotificationsProvider userId={user?.id}>
          <CallProvider userId={user?.id}>
            <IncomingCallProvider
              userId={user?.id}
              role={user?.role?.toLowerCase()}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: PRELOADER_BACKGROUND,
                }}
              >
                <Slot />

                <StatusBarGuard
                  show={segments[0] !== "(auth)" && isStartupDone}
                />

                <MiniCallBar />
                <CallModal />

                {!isStartupDone && (
                  <Preloader
                    isReady={isAppReady}
                    onFinish={() => {
                      setIsStartupDone(true);
                    }}
                  />
                )}
              </View>
            </IncomingCallProvider>
          </CallProvider>
        </NotificationsProvider>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
