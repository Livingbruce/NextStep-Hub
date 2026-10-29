import notifee from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Linking, Platform } from "react-native";

const KEY = "@call_setup_done_v1";
const pkg = () => Constants.expoConfig?.android?.package;

const open = async (action, withPackage = true) => {
  try {
    await Linking.sendIntent(
      action,
      withPackage
        ? [{ key: "android.provider.extra.APP_PACKAGE", value: pkg() }]
        : undefined,
    );
  } catch {
    Linking.openSettings();
  }
};

export const isCallSetupDone = async () =>
  Platform.OS !== "android" || (await AsyncStorage.getItem(KEY)) === "1";
export const markCallSetupDone = () =>
  AsyncStorage.setItem(KEY, "1").catch(() => {});

export const askNotifications = () => notifee.requestPermission();
export const askOverlay = () =>
  open("android.settings.action.MANAGE_OVERLAY_PERMISSION", false);
export const askFullScreen = () =>
  open("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT", false);
export const askBattery = () => notifee.openBatteryOptimizationSettings();
