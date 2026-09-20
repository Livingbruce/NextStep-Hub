import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { styles } from "../../styles/(admin)/programs";

export default function Programs() {
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'past'
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Program Modal State
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("participants"); // 'participants' | 'invigilators'

  // Fetch Programs with joined Creator, Participants (with Profiles), and Moderators
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("programs")
        .select(
          `
          *,
          creator:created_by (
            id,
            first_name,
            surname,
            email,
            phone_no
          ),
          moderators:program_moderators (
            id,
            full_name,
            email,
            phone_no
          ),
          participants:program_participants (
            id,
            status,
            mpesa_reference,
            created_at,
            profile:client_id (
              id,
              first_name,
              surname,
              email,
              phone_no
            )
          )
        `,
        )
        .order("starts_at", { ascending: true });

      if (error) throw error;
      setPrograms(data || []);
    } catch (err) {
      console.error("Error fetching programs:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPrograms();
  }, []);

  // Filter Upcoming / Past Programs
  const now = new Date();
  const upcomingPrograms = programs.filter((p) => new Date(p.starts_at) >= now);
  const pastPrograms = programs.filter((p) => new Date(p.starts_at) < now);

  const displayedPrograms =
    activeTab === "upcoming" ? upcomingPrograms : pastPrograms;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openProgramDetails = (program) => {
    setSelectedProgram(program);
    setActiveDetailTab("participants");
    setDetailModalVisible(true);
  };

  const renderProgramCard = ({ item }) => {
    const isUpcoming = new Date(item.starts_at) >= new Date();
    const creatorName = item.creator
      ? `${item.creator.first_name || ""} ${item.creator.surname || ""}`.trim()
      : "Unknown Creator";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => openProgramDetails(item)}
      >
        {/* Poster Image */}
        {item.poster_url ? (
          <Image
            source={{ uri: item.poster_url }}
            style={styles.posterImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Ionicons name="image-outline" size={32} color="#94A3B8" />
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View
              style={[
                styles.statusBadge,
                isUpcoming ? styles.upcomingBadge : styles.pastBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isUpcoming
                    ? styles.upcomingStatusText
                    : styles.pastStatusText,
                ]}
              >
                {isUpcoming ? "Upcoming" : "Completed"}
              </Text>
            </View>
          </View>

          {/* Created by Counselor */}
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={16} color="#475569" />
            <Text style={styles.infoText}>By: {creatorName || "N/A"}</Text>
          </View>

          {/* Date & Time */}
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#1E3A8A" />
            <Text style={styles.infoText}>{formatDate(item.starts_at)}</Text>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>
              {item.location_type?.toUpperCase()}: {item.location_details}
            </Text>
          </View>

          {/* Pricing */}
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={16} color="#16A34A" />
            <Text style={styles.infoText}>
              {item.is_paid ? `${item.currency} ${item.amount}` : "Free"}
            </Text>
          </View>

          {/* Footer Stats */}
          <View style={styles.cardFooter}>
            <View style={styles.attendeeTag}>
              <Ionicons name="people-outline" size={14} color="#475569" />
              <Text style={styles.attendeeText}>
                {item.participants?.length || 0} Registered
              </Text>
            </View>
            <View style={styles.attendeeTag}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color="#475569"
              />
              <Text style={styles.attendeeText}>
                {item.moderators?.length || 0} Invigilators
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Programs & Events</Text>
        <Text style={styles.headerSubtitle}>
          Manage scheduled mentorship sessions and past workshops
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "upcoming" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming ({upcomingPrograms.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "past" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}
          >
            Past Archive ({pastPrograms.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading State or FlatList */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <FlatList
          data={displayedPrograms}
          keyExtractor={(item) => item.id}
          renderItem={renderProgramCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-sharp" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                No {activeTab} programs available.
              </Text>
            </View>
          }
        />
      )}

      {/* Program Details Modal */}
      {selectedProgram && (
        <Modal
          visible={detailModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#475569" />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedProgram.title}
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Poster Banner */}
              {selectedProgram.poster_url && (
                <Image
                  source={{ uri: selectedProgram.poster_url }}
                  style={styles.modalPoster}
                  resizeMode="cover"
                />
              )}

              {/* Created By Counselor Details */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionHeading}>
                  Created By (Counselor)
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedProgram.creator?.first_name}{" "}
                    {selectedProgram.creator?.surname || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>
                    {selectedProgram.creator?.email || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>
                    {selectedProgram.creator?.phone_no || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Sub-Tabs for Participants vs Invigilators */}
              <View style={styles.subTabContainer}>
                <TouchableOpacity
                  style={[
                    styles.subTabButton,
                    activeDetailTab === "participants" && styles.activeSubTab,
                  ]}
                  onPress={() => setActiveDetailTab("participants")}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      activeDetailTab === "participants" &&
                        styles.activeSubTabText,
                    ]}
                  >
                    Participants ({selectedProgram.participants?.length || 0})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.subTabButton,
                    activeDetailTab === "invigilators" && styles.activeSubTab,
                  ]}
                  onPress={() => setActiveDetailTab("invigilators")}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      activeDetailTab === "invigilators" &&
                        styles.activeSubTabText,
                    ]}
                  >
                    Invigilators ({selectedProgram.moderators?.length || 0})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Participants View */}
              {activeDetailTab === "participants" && (
                <View style={styles.listSection}>
                  {selectedProgram.participants &&
                  selectedProgram.participants.length > 0 ? (
                    selectedProgram.participants.map((item) => (
                      <View key={item.id} style={styles.personCard}>
                        <Ionicons name="person" size={20} color="#1E3A8A" />
                        <View style={styles.personDetails}>
                          <Text style={styles.personName}>
                            {item.profile?.first_name}{" "}
                            {item.profile?.surname || "Anonymous"}
                          </Text>
                          <Text style={styles.personMeta}>
                            Email: {item.profile?.email || "N/A"}
                          </Text>
                          <Text style={styles.personMeta}>
                            Phone: {item.profile?.phone_no || "N/A"}
                          </Text>
                          {item.mpesa_reference && (
                            <Text style={styles.personMeta}>
                              M-Pesa Ref: {item.mpesa_reference}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptySubText}>
                      No participants registered for this program yet.
                    </Text>
                  )}
                </View>
              )}

              {/* Invigilators View */}
              {activeDetailTab === "invigilators" && (
                <View style={styles.listSection}>
                  {selectedProgram.moderators &&
                  selectedProgram.moderators.length > 0 ? (
                    selectedProgram.moderators.map((mod) => (
                      <View key={mod.id} style={styles.personCard}>
                        <Ionicons
                          name="shield-checkmark"
                          size={20}
                          color="#059669"
                        />
                        <View style={styles.personDetails}>
                          <Text style={styles.personName}>{mod.full_name}</Text>
                          <Text style={styles.personMeta}>
                            Email: {mod.email}
                          </Text>
                          <Text style={styles.personMeta}>
                            Phone: {mod.phone_no}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptySubText}>
                      No invigilators assigned to this program yet.
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}
