import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(counselor)/home";
import { useAuth } from "../_layout";

const MOCK_SESSIONS = [
  {
    id: "s1",
    clientName: "Brian Kiprop",
    category: "Pre-Campus Transition",
    date: "Today, 2:30 PM",
    meetLink: "https://meet.google.com/abc-defg-hij",
    phone: "0712345678",
    county: "Meru",
    status: "Upcoming",
  },
  {
    id: "s2",
    clientName: "Wanjiru Kamau",
    category: "Post-Campus Career Pitching",
    date: "Tomorrow, 10:00 AM",
    meetLink: "https://meet.google.com/xyz-uvwx-rst",
    phone: "0798765432",
    county: "Nairobi",
    status: "Scheduled",
  },
];

const MOCK_REVIEWS = [
  {
    id: "r1",
    clientName: "Mercy Chebet",
    rating: 5,
    review:
      "The session was extremely eye-opening! She guided me on how to choose my university courses wisely.",
    sessionCategory: "High School to Uni Transition",
    sessionDate: "Yesterday, 4:00 PM",
    county: "Nakuru",
  },
  {
    id: "r2",
    clientName: "Dennis Omondi",
    rating: 4,
    review:
      "Great resume feedback. I now feel confident applying for tech internships.",
    sessionCategory: "Post-Campus Career Pitching",
    sessionDate: "Sept 12, 2026",
    county: "Mombasa",
  },
];

export default function CounselorDashboard() {
  const { user, logout } = useAuth();
  const [sessions] = useState(MOCK_SESSIONS);
  const [reviews] = useState(MOCK_REVIEWS);
  const [expandedReviewId, setExpandedReviewId] = useState(null);

  const handleJoinCall = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open call link.");
    });
  };

  const toggleExpandReview = (id) => {
    setExpandedReviewId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeSubtitle}>Counselor Hub</Text>
          <Text style={styles.welcomeTitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Upcoming Sessions Section */}
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
        {sessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{session.category}</Text>
              </View>
              <Text style={styles.timeText}>{session.date}</Text>
            </View>

            <Text style={styles.clientName}>{session.clientName}</Text>
            <Text style={styles.clientMeta}>
              Location: {session.county} County • Contact: {session.phone}
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => handleJoinCall(session.meetLink)}
                activeOpacity={0.8}
              >
                <Ionicons name="videocam-outline" size={18} color="#FFFFFF" />
                <Text style={styles.joinBtnText}>Join Virtual Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Client Reviews Section */}
        <Text style={styles.sectionTitle}>Client Reviews</Text>
        {reviews.map((item) => {
          const isExpanded = expandedReviewId === item.id;
          return (
            <View key={item.id} style={styles.reviewCard}>
              {/* Collapsed State Header: Client Name, Star Rating & Review Text */}
              <TouchableOpacity
                style={styles.reviewHeader}
                onPress={() => toggleExpandReview(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.reviewMainInfo}>
                  <View style={styles.reviewTopRow}>
                    <Text style={styles.reviewClientName}>
                      {item.clientName}
                    </Text>
                    <View style={styles.starRow}>
                      {[...Array(item.rating)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name="star"
                          size={14}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                  </View>
                  <Text
                    style={styles.reviewSnippet}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    "{item.review}"
                  </Text>
                </View>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748B"
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>

              {/* Expanded State: Full Session Details */}
              {isExpanded && (
                <View style={styles.reviewDetailsDrawer}>
                  <Text style={styles.drawerTitle}>Appointment Details</Text>
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="pricetag-outline"
                      size={15}
                      color="#64748B"
                    />
                    <Text style={styles.detailText}>
                      Category: {item.sessionCategory}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color="#64748B"
                    />
                    <Text style={styles.detailText}>
                      Date: {item.sessionDate}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color="#64748B"
                    />
                    <Text style={styles.detailText}>
                      County: {item.county} County
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
