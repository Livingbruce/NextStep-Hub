import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { createContext, useContext, useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Preloader from "../components/preLoader";

SplashScreen.preventAutoHideAsync();

const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [isPreloaderDone, setIsPreloaderDone] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync();
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

  const login = (email, role) => {
    setUser({ email, role });
  };

  const logout = () => {
    setUser(null);
  };

  if (!isPreloaderDone) {
    return <Preloader onFinish={() => setIsPreloaderDone(true)} />;
  }

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Slot />
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
