import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { NOTIFICATION_TYPES, notifyAdmins } from "../../../libs/notifications";
import { supabase } from "../../../libs/supabase";
import AnimatedTabs from "../../components/client/appointments/AnimatedTabs";
import PressableScale from "../../components/client/appointments/PressableScale";
import ProgramsSkeleton from "../../components/client/programs/ProgramSkeleton";
import CounselorProgramCard from "../../components/counselor/programs/CounselorProgramCard";
import ParticipantsModal from "../../components/counselor/programs/ParticipantsModal";
import ProgramFormModal from "../../components/counselor/programs/ProgramFormModal";
import { cp } from "../../styles/(counselor)/programsUi";

const GAP = 16;

// Convert a database row into the shape the screen uses
const mapProgram = (row) => ({
  id: row.id,
  createdBy: row.created_by,
  title: row.title,
  category: row.category,
  description: row.description || "",
  startsAt: row.starts_at,
  locationType: row.location_type,
  locationDetails: row.location_details,
  isPaid: row.is_paid,
  amount: row.amount,
  currency: row.currency || "KES",
  posterUrl: row.poster_url,
  posterPath: row.poster_path,
  status: new Date(row.starts_at) >= new Date() ? "Available" : "Past",
  moderators: (row.program_moderators || []).map((m) => ({
    id: m.id,
    name: m.full_name,
    email: m.email,
    phone: m.phone_no,
  })),
  participants: (row.program_participants || []).map((p) => {
    const c = Array.isArray(p.client) ? p.client[0] : p.client;
    return {
      id: p.id,
      name:
        c?.full_name ||
        [c?.first_name, c?.surname].filter(Boolean).join(" ") ||
        "Unknown client",
      email: c?.email || "Not provided",
      phone: c?.phone_no || "Not provided",
      county: c?.county || "Not provided",
      status: p.status === "participated" ? "Participated" : "Registered",
    };
  }),
});

export default function Programs() {
  const { width } = useWindowDimensions();
  const cols = width >= 720 ? 2 : 1;
  const itemWidth = cols === 2 ? "48.5%" : "100%";

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("upcoming");

  const [participantsId, setParticipantsId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const buzz = (t) => Haptics.notificationAsync(t).catch(() => {});

  /* ------------------------------- data ------------------------------- */
  const fetchPrograms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select(
          `
          *,
          program_moderators ( id, full_name, email, phone_no ),
          program_participants (
            id,
            status,
            client:profiles!program_participants_client_id_fkey (
              id, full_name, first_name, surname, email, phone_no, county
            )
          )
        `,
        )
        .order("starts_at", { ascending: true });
      if (error) throw error;
      setPrograms((data || []).map(mapProgram));
    } catch (e) {
      console.error("Fetch programs error:", e);
      Alert.alert(
        "Couldn't load programs",
        e?.message || "Pull down to try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrograms();
  };

  const available = useMemo(
    () => programs.filter((p) => p.status === "Available"),
    [programs],
  );
  const past = useMemo(
    () =>
      programs
        .filter((p) => p.status === "Past")
        .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt)),
    [programs],
  );
  const selected = programs.find((p) => p.id === participantsId);

  const tabs = [
    { key: "upcoming", label: "Upcoming", count: available.length },
    { key: "past", label: "Past", count: past.length },
  ];

  /* ------------------------------- save ------------------------------- */
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setFormOpen(true);
  };

  const handleSave = async (form) => {
    try {
      setSaving(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert(
          "Authentication error",
          "Your session has expired. Please log in again.",
        );
        return;
      }

      // ---- Poster ----
      const oldPath = editing?.posterPath || null;
      let posterUrl = editing?.posterUrl || null;
      let posterPath = oldPath;
      let removeOld = false;

      if (form.poster?.isNew) {
        const path = `${user.id}/${Date.now()}.${form.poster.ext}`;
        const { error: upErr } = await supabase.storage
          .from("posters")
          .upload(path, decode(form.poster.base64), {
            contentType: `image/${form.poster.ext}`,
            upsert: false,
          });
        if (upErr) throw upErr;
        posterUrl = supabase.storage.from("posters").getPublicUrl(path)
          .data.publicUrl;
        posterPath = path;
        removeOld = !!oldPath;
      } else if (!form.poster) {
        posterUrl = null;
        posterPath = null;
        removeOld = !!oldPath;
      }

      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || "General Mentorship",
        description: form.description.trim() || null,
        starts_at: form.startsAt.toISOString(),
        location_type: form.locationType,
        location_details: form.locationDetails.trim(),
        is_paid: form.isPaid,
        amount: form.isPaid ? parseFloat(form.amount) : null,
        poster_url: posterUrl,
        poster_path: posterPath,
        moderator_count: form.moderators.length,
      };

      let programId = editing?.id;
      if (editing) {
        const { data, error } = await supabase
          .from("programs")
          .update(payload)
          .eq("id", editing.id)
          .select("id");
        if (error) throw error;
        if (!data?.length)
          throw new Error("You do not have permission to edit this program.");
      } else {
        const { data, error } = await supabase
          .from("programs")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        programId = data.id;
      }

      // ---- Moderators (replace full list) ----
      if (editing) {
        const { error } = await supabase
          .from("program_moderators")
          .delete()
          .eq("program_id", programId);
        if (error) throw error;
      }
      if (form.moderators.length > 0) {
        const { error } = await supabase.from("program_moderators").insert(
          form.moderators.map((m) => ({
            program_id: programId,
            full_name: m.name.trim(),
            email: m.email.trim().toLowerCase(),
            phone_no: m.phone.trim(),
          })),
        );
        if (error) throw error;
      }

      if (removeOld && oldPath) {
        await supabase.storage.from("posters").remove([oldPath]);
      }

      if (!editing) {
        await notifyAdmins({
          type: NOTIFICATION_TYPES.NEW_PROGRAM,
          title: "New Program Created",
          body: `"${form.title.trim()}" was added by a counselor.`,
          data: { programId },
        });
      }

      buzz(Haptics.NotificationFeedbackType.Success);
      setFormOpen(false);
      await fetchPrograms();
    } catch (e) {
      console.error("Save program error:", e);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Save failed", e?.message || "Could not save the program.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (prog) => {
    Alert.alert(
      "Delete program",
      "Its participants and moderators will be removed too.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data, error } = await supabase
                .from("programs")
                .delete()
                .eq("id", prog.id)
                .select("id");
              if (error) throw error;
              if (!data?.length)
                throw new Error(
                  "You do not have permission to delete this program.",
                );
              if (prog.posterPath) {
                await supabase.storage
                  .from("posters")
                  .remove([prog.posterPath]);
              }
              // Removing from state plays the card's exit + reflow animation.
              setPrograms((prev) => prev.filter((p) => p.id !== prog.id));
              buzz(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert("Delete failed", e?.message || "Please try again.");
            }
          },
        },
      ],
    );
  };

  /* ---------------------------- participants ---------------------------- */
  const handleMark = async (id) => {
    try {
      const { data, error } = await supabase
        .from("program_participants")
        .update({ status: "participated" })
        .eq("id", id)
        .select("id");
      if (error) throw error;
      if (!data?.length) throw new Error("Could not update this participant.");
      buzz(Haptics.NotificationFeedbackType.Success);
      fetchPrograms();
    } catch (e) {
      Alert.alert("Update failed", e?.message || "Please try again.");
    }
  };

  const handleRemove = (id) => {
    Alert.alert(
      "Remove participant",
      "Remove this client from the registered list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const { data, error } = await supabase
                .from("program_participants")
                .delete()
                .eq("id", id)
                .select("id");
              if (error) throw error;
              if (!data?.length)
                throw new Error("Could not remove this participant.");
              fetchPrograms();
            } catch (e) {
              Alert.alert("Remove failed", e?.message || "Please try again.");
            }
          },
        },
      ],
    );
  };

  /* ------------------------------ render ------------------------------ */
  const rows = tab === "upcoming" ? available : past;
  const isPast = tab === "past";

  const body = loading ? (
    <ProgramsSkeleton count={cols * 2} itemWidth={itemWidth} gap={GAP} />
  ) : rows.length === 0 ? (
    <View key={`empty-${tab}`} style={cp.empty}>
      <Animated.View
        entering={ZoomIn.duration(400).springify().damping(12)}
        style={cp.emptyCircle}
      >
        <Ionicons
          name={isPast ? "time-outline" : "calendar-outline"}
          size={40}
          color="#1E3A8A"
        />
      </Animated.View>
      <Animated.Text entering={FadeIn.delay(150)} style={cp.emptyTitle}>
        {isPast ? "No past programs" : "No upcoming programs"}
      </Animated.Text>
      <Animated.Text entering={FadeIn.delay(220)} style={cp.emptyText}>
        {isPast
          ? "Programs you've run will be archived here."
          : "Create a workshop or mentorship event for clients to join."}
      </Animated.Text>
      {!isPast && (
        <PressableScale haptic style={cp.newBtn} onPress={openCreate}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={cp.newBtnText}>New program</Text>
        </PressableScale>
      )}
    </View>
  ) : (
    <View key={tab} style={[cp.grid, { gap: GAP }]}>
      {rows.map((p, i) => (
        <CounselorProgramCard
          key={p.id}
          program={p}
          index={i}
          past={isPast}
          style={{ width: itemWidth }}
          onEdit={() => openEdit(p)}
          onDelete={() => handleDelete(p)}
          onViewParticipants={() => setParticipantsId(p.id)}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={cp.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={cp.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1E3A8A"
            colors={["#1E3A8A"]}
          />
        }
      >
        <View style={cp.content}>
          <View style={cp.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={cp.title}>Mentorship programs</Text>
              <Text style={cp.subtitle}>
                Create events and track attendance
              </Text>
            </View>
            <PressableScale haptic style={cp.newBtn} onPress={openCreate}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={cp.newBtnText}>New</Text>
            </PressableScale>
          </View>

          <AnimatedTabs tabs={tabs} active={tab} onChange={setTab} />

          {body}
        </View>
      </ScrollView>

      <ParticipantsModal
        program={selected}
        visible={!!participantsId}
        onClose={() => setParticipantsId(null)}
        onMark={handleMark}
        onRemove={handleRemove}
      />

      <ProgramFormModal
        open={formOpen}
        program={editing}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
      />
    </SafeAreaView>
  );
}
