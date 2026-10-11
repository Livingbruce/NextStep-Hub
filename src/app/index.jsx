import { Redirect } from "expo-router";
import { useAuth } from "./_layout";

const getInitialHref = (user) => {
  if (!user) return "/(auth)/landing";
  if (user.suspended) return "/(auth)/suspendedScreen";
  if (!user.approved) return "/(auth)/pendingApproval";

  switch (user.role?.toLowerCase()) {
    case "client":
      return "/(client)";
    case "counselor":
      return "/(counselor)";
    case "admin":
      return "/(admin)";
    default:
      return "/(auth)/landing";
  }
};

export default function Page() {
  const { user } = useAuth();
  return <Redirect href={getInitialHref(user)} />;
}
