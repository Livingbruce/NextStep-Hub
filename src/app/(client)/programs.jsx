import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { PROGRAMS } from "../../components/client/Programs";
import { styles } from "../../styles/(client)/programsMain";
import { useAuth } from "../_layout";

export default function ProgramsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [myPrograms, setMyPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMyPrograms();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMyPrograms = async () => {
    try {
      setLoading(true);

      // Fetch enrolled programs by joining program_participants and programs tables
      const { data, error } = await supabase
        .from("program_participants")
        .select(
          `
          id,
          created_at,
          program:program_id (
            id,
            title,
            description,
            category,
            starts_at,
            location_type,
            location_details
          )
        `,
        )
        .eq("client_id", user.id);

      if (error) {
        console.error("Error fetching my programs:", error);
      } else if (data) {
        // Extract program objects
        const enrolledList = data
          .map((item) => item.program)
          .filter((p) => p !== null);
        setMyPrograms(enrolledList);
      }
    } catch (err) {
      console.error("Unexpected error fetching programs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (locationType, locationDetails) => {
    if (!locationDetails) {
      Alert.alert("Notice", "Meeting details are not yet available.");
      return;
    }

    if (locationType === "virtual") {
      const url = locationDetails.startsWith("http")
        ? locationDetails
        : `https://${locationDetails}`;
      Linking.openURL(url).catch(() =>
        Alert.alert("Error", "Could not open meeting link."),
      );
    } else if (locationType === "phone") {
      const cleanPhone = locationDetails.replace(/[^0-9+]/g, "");
      Linking.openURL(`tel:${cleanPhone}`).catch(() =>
        Alert.alert("Error", "Could not initiate call."),
      );
    } else {
      Alert.alert("Venue Details", locationDetails);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        {/* Top Bar Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Programs</Text>
        </View>

        {/* Scrollable List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Enrolled Status Card / My Programs */}
          <View style={styles.myProgramsSection}>
            <Text style={styles.sectionTitle}>My Programs</Text>

            {loading ? (
              <ActivityIndicator
                size="small"
                color="#936D9A"
                style={{ marginVertical: 12 }}
              />
            ) : myPrograms.length > 0 ? (
              myPrograms.map((program) => (
                <View key={program.id} style={styles.enrolledCard}>
                  <View style={styles.enrolledHeaderRow}>
                    <Text style={styles.enrolledTitle}>{program.title}</Text>
                    <View style={styles.enrolledBadge}>
                      <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                    </View>
                  </View>

                  {program.description ? (
                    <Text style={styles.enrolledDescription} numberOfLines={2}>
                      {program.description}
                    </Text>
                  ) : null}

                  {program.starts_at && (
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={14} color="#64748B" />
                      <Text style={styles.timeText}>
                        {new Date(program.starts_at).toLocaleString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  )}

                  {/* Dynamic Action Button depending on location_type */}
                  {program.location_type === "virtual" ? (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#0284C7" },
                      ]}
                      activeOpacity={0.8}
                      onPress={() =>
                        handleOpenAction(
                          program.location_type,
                          program.location_details,
                        )
                      }
                    >
                      <Ionicons name="videocam" size={15} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Join Meeting</Text>
                    </TouchableOpacity>
                  ) : program.location_type === "phone" ? (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#2563EB" },
                      ]}
                      activeOpacity={0.8}
                      onPress={() =>
                        handleOpenAction(
                          program.location_type,
                          program.location_details,
                        )
                      }
                    >
                      <Ionicons name="call" size={15} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Join Call</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#475569" },
                      ]}
                      activeOpacity={0.8}
                      onPress={() =>
                        handleOpenAction(
                          program.location_type,
                          program.location_details,
                        )
                      }
                    >
                      <Ionicons name="location" size={15} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>
                        {program.location_details
                          ? `Venue: ${program.location_details}`
                          : "Location Details"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.sectionDescription}>
                You are currently not enrolled in any guidance programs.
              </Text>
            )}
          </View>

          {/* Available Programs List */}
          <View style={styles.availablePrograms}>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              Available Programs
            </Text>
            {PROGRAMS.map((item) => (
              <View key={item.id} style={styles.categoryItem}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryIconCircle}>
                    <Ionicons name={item.icon} size={22} color="#0F172A" />
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>

                <Text style={styles.categoryDescription} numberOfLines={3}>
                  {item.description}
                </Text>

                <TouchableOpacity
                  style={styles.enrollButton}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/programs/${item.id}`)}
                >
                  <Text style={styles.enrollButtonText}>Explore</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
