import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import NotificationBell from "../../components/NotificationBell";
import { styles } from "../../styles/(admin)/home";
import { useAuth } from "../_layout";

const SHORTCUTS = [
  {
    id: "appointments",
    title: "Appointments",
    icon: "calendar",
    bgColor: "#EFF6FF",
    iconColor: "#2563EB",
    route: "/(admin)/appointments",
  },
  {
    id: "programs",
    title: "Programs",
    icon: "briefcase",
    bgColor: "#F0FDF4",
    iconColor: "#16A34A",
    route: "/(admin)/programs",
  },
  {
    id: "staff",
    title: "Staff Management",
    icon: "people",
    bgColor: "#FAF5FF",
    iconColor: "#9333EA",
    route: "/(admin)/staff",
  },
  {
    id: "pricing",
    title: "Pricing",
    icon: "pricetag",
    bgColor: "#FFF7ED",
    iconColor: "#EA580C",
    route: "/(admin)/pricing",
  },
];

export default function AdminHome() {
  const router = useRouter();
  const { logout } = useAuth();

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActions, setRecentActions] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminName, setAdminName] = useState("Administrator");
  const [user, setUser] = useState(null);

  // time-based greeting calculation
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();
  }, []);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .single();

        if (data?.first_name) {
          setAdminName(data.first_name);
        }
      }
    };

    fetchAdminProfile();
  }, []);

  // Format full timestamp (Year, Month, Date, Time)
  const formatFullTimestamp = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for event badge
  const formatEventDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // 1. Fetch live upcoming programs
  const fetchUpcomingPrograms = async () => {
    try {
      setLoadingEvents(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("programs")
        .select(
          "id, title, category, starts_at, location_type, location_details",
        )
        .gte("starts_at", now)
        .order("starts_at", { ascending: true })
        .limit(5);

      if (error) throw error;
      setUpcomingEvents(data || []);
    } catch (err) {
      console.error("Error fetching upcoming programs:", err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  // 2. Aggregate recent actions across multiple tables
  const fetchRecentActions = async () => {
    try {
      setLoadingActions(true);

      // Query 1: Programs created by users
      const { data: programActions, error: progErr } = await supabase
        .from("programs")
        .select(
          `
          id,
          title,
          created_at,
          creator:created_by (
            first_name,
            surname,
            email,
            role
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (progErr) throw progErr;

      // Query 2: Appointment status updates
      const { data: appointmentActions, error: apptErr } = await supabase
        .from("appointments")
        .select(
          `
          id,
          status,
          action_reason,
          updated_at,
          counselor:counselor_id (
            first_name,
            surname,
            email,
            role
          )
        `,
        )
        .not("counselor_id", "is", null)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (apptErr) throw apptErr;

      // Query 3: Profiles modified
      const { data: profileActions, error: profErr } = await supabase
        .from("profiles")
        .select(
          `
          id,
          first_name,
          surname,
          email,
          role,
          updated_at
        `,
        )
        .not("first_name", "is", null)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (profErr) throw profErr;

      // Query 4: Session reviews logged by counselors/admins
      const { data: reviewActions, error: revErr } = await supabase
        .from("appointment_reviews")
        .select(
          `
          id,
          counselor_notes,
          reviewer_role,
          created_at,
          reviewer:reviewer_id (
            first_name,
            surname,
            email,
            role
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (revErr) throw revErr;

      const resolveRole = (roleStr, fallback = "USER") => {
        if (!roleStr) return fallback.toUpperCase();
        return roleStr.toUpperCase();
      };

      // Normalize & map program creation events
      const formattedPrograms = (programActions || []).map((item) => {
        const fullName = item.creator
          ? `${item.creator.first_name || ""} ${item.creator.surname || ""}`.trim()
          : "Unknown User";
        return {
          id: `prog-${item.id}`,
          person: fullName || "User",
          email: item.creator?.email || "N/A",
          role: resolveRole(item.creator?.role, "Counselor"),
          action: "Created Program",
          details: `Program: "${item.title}"`,
          timestamp: item.created_at,
          icon: "briefcase-outline",
        };
      });

      // Normalize & map appointment actions
      const formattedAppointments = (appointmentActions || []).map((item) => {
        const fullName = item.counselor
          ? `${item.counselor.first_name || ""} ${item.counselor.surname || ""}`.trim()
          : "Unknown Counselor";
        const formattedStatus = item.status
          ? item.status.replace(/_/g, " ").toUpperCase()
          : "UPDATED";
        return {
          id: `appt-${item.id}-${item.updated_at}`,
          person: fullName || "Counselor",
          email: item.counselor?.email || "N/A",
          role: resolveRole(item.counselor?.role, "Counselor"),
          action: `Appt: ${formattedStatus}`,
          details: item.action_reason
            ? `Reason: ${item.action_reason}`
            : `Appointment state set to ${item.status}`,
          timestamp: item.updated_at,
          icon: "calendar-outline",
        };
      });

      // Normalize & map profile updates
      const formattedProfiles = (profileActions || []).map((item) => {
        const fullName =
          `${item.first_name || ""} ${item.surname || ""}`.trim();
        return {
          id: `prof-${item.id}-${item.updated_at}`,
          person: fullName || "User",
          email: item.email || "N/A",
          role: resolveRole(item.role, "User"),
          action: "Updated Profile",
          details: "Profile credentials or metadata updated",
          timestamp: item.updated_at,
          icon: "person-outline",
        };
      });

      // Normalize & map clinical session reviews/notes
      const formattedReviews = (reviewActions || []).map((item) => {
        const fullName = item.reviewer
          ? `${item.reviewer.first_name || ""} ${item.reviewer.surname || ""}`.trim()
          : "Unknown Reviewer";
        return {
          id: `rev-${item.id}`,
          person: fullName || "Reviewer",
          email: item.reviewer?.email || "N/A",
          role: resolveRole(
            item.reviewer?.role || item.reviewer_role,
            "Counselor",
          ),
          action: "Logged Session Notes",
          details: item.counselor_notes
            ? `Note: ${item.counselor_notes.substring(0, 40)}...`
            : "Added session review",
          timestamp: item.created_at,
          icon: "document-text-outline",
        };
      });

      // Combine & sort chronologically (most recent first)
      const combined = [
        ...formattedPrograms,
        ...formattedAppointments,
        ...formattedProfiles,
        ...formattedReviews,
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 8);

      setRecentActions(combined);
    } catch (err) {
      console.error("Error fetching recent actions:", err.message);
    } finally {
      setLoadingActions(false);
    }
  };

  const loadData = async () => {
    await Promise.all([fetchUpcomingPrograms(), fetchRecentActions()]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const getRoleBadgeStyles = (role) => {
    switch (role) {
      case "ADMIN":
        return { bg: "#FEF2F2", text: "#DC2626" };
      case "COUNSELOR":
        return { bg: "#F0FDF4", text: "#16A34A" };
      default:
        return { bg: "#F1F5F9", text: "#475569" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.adminTitle}>{adminName}</Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationBell
              userId={user?.id}
              color="#0F172A"
              route="/notifications"
            />
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Shortcut Cards Section */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.shortcutsGrid}>
          {SHORTCUTS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.shortcutCard}
              onPress={() => router.push(item.route)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconBackground,
                  { backgroundColor: item.bgColor },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>
              <Text style={styles.shortcutTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Events / Programs Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Programs</Text>
          <TouchableOpacity onPress={() => router.push("/(admin)/programs")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loadingEvents ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1E3A8A" />
          </View>
        ) : upcomingEvents.length > 0 ? (
          <FlatList
            horizontal
            data={upcomingEvents}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventCard}
                activeOpacity={0.8}
                onPress={() => router.push("/(admin)/programs")}
              >
                <View style={styles.eventHeader}>
                  <Text style={styles.eventCategory}>
                    {item.category || "Mentorship"}
                  </Text>
                  <View style={styles.dateBadge}>
                    <Ionicons name="time-outline" size={12} color="#475569" />
                    <Text style={styles.dateBadgeText}>
                      {formatEventDate(item.starts_at)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.eventFooter}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={styles.eventLocation} numberOfLines={1}>
                    {item.location_type?.toUpperCase()}: {item.location_details}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyCardText}>
              No upcoming programs scheduled
            </Text>
          </View>
        )}

        {/* Recent Actions / App Logs Section */}
        <Text style={styles.sectionTitle}>App Logs</Text>
        <View style={styles.actionsContainer}>
          {loadingActions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1E3A8A" />
            </View>
          ) : recentActions.length > 0 ? (
            recentActions.map((item, index) => {
              const isLast = index === recentActions.length - 1;
              const roleStyle = getRoleBadgeStyles(item.role);

              return (
                <View
                  key={item.id}
                  style={[styles.actionCard, isLast && styles.actionCardLast]}
                >
                  {/* Row 1: Left (Icon + User Details) | Right (Action Status Badge) */}
                  <View style={styles.actionTopRow}>
                    <View style={styles.actionUserInfo}>
                      <View style={styles.actionIconContainer}>
                        <Ionicons name={item.icon} size={18} color="#1E3A8A" />
                      </View>
                      <View style={styles.actionTextContainer}>
                        <View style={styles.actionNameRow}>
                          <Text style={styles.actionPerson} numberOfLines={1}>
                            {item.person}
                          </Text>
                          <View
                            style={[
                              styles.roleBadge,
                              { backgroundColor: roleStyle.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.roleBadgeText,
                                { color: roleStyle.text },
                              ]}
                            >
                              {item.role}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.actionEmail} numberOfLines={1}>
                          {item.email}
                        </Text>
                      </View>
                    </View>

                    {/* Action Pill on the right side */}
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText} numberOfLines={1}>
                        {item.action}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Event Details & Time */}
                  <View style={styles.actionBottomRow}>
                    {item.details ? (
                      <Text style={styles.actionDetailsText} numberOfLines={2}>
                        {item.details}
                      </Text>
                    ) : null}
                    <View style={styles.actionMetaRow}>
                      <Ionicons name="time-outline" size={12} color="#94A3B8" />
                      <Text style={styles.actionTime}>
                        {formatFullTimestamp(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyActions}>
              <Text style={styles.emptyCardText}>
                No recent actions recorded
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
