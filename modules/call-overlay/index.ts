import { requireOptionalNativeModule } from "expo-modules-core";

const Native = requireOptionalNativeModule("CallOverlay");

export const canDrawOverlays = (): boolean => !!Native?.canDrawOverlays?.();
export const isLocked = (): boolean => !!Native?.isLocked?.();
export const showCallOverlay = (o: Record<string, unknown>) =>
  Native?.show?.(o);
export const hideCallOverlay = () => Native?.hide?.();
