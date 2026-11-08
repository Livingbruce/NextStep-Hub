import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../../../libs/supabase";

import useJoinSession from "../../components/call/useJoinSession";
import AnimatedTabs from "../../components/client/appointments/AnimatedTabs";
import PressableScale from "../../components/client/appointments/PressableScale";

import { SECTORS } from "../../components/client/careerSectors";
import { POST_CAMPUS_MODULES } from "../../components/client/postUni";
import { PATHWAYS } from "../../components/client/preUni";
import { PROGRAMS } from "../../components/client/Programs";

import CategoryCard from "../../components/client/programs/CategoryCard";
import EnrolledCard from "../../components/client/programs/EnrolledCard";
import ProgramsSkeleton from "../../components/client/programs/ProgramSkeleton";

import { isProgramOver } from "../../components/counselor/programs/schedule";

import { useCall } from "../../context/CallContext";
import { pg } from "../../styles/(client)/programsUi";
import { useAuth } from "../_layout";

const GAP = 16;
const MAX_CONTENT = 1000;
const H_PADDING = 20;

const MODULE_COUNTS = {
  career: SECTORS.length,
  preCampus: PATHWAYS.length,
  postCampus: POST_CAMPUS_MODULES.length,
};

export default function ProgramsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("mine");

  const hasLoaded = useRef(false);

  const join = useJoinSession();
  const { session } = useCall();

  // Responsive grid:
  const columns = width >= 720 ? 2 : 1;

  const contentWidth = Math.min(width, MAX_CONTENT) - H_PADDING * 2;

  const itemWidth = columns === 1 ? "100%" : (contentWidth - GAP) / columns;

  // Fetch enrolled programs whenever this screen gains focus.
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchMyPrograms();
      } else {
        setLoading(false);
      }
    }, [user?.id]),
  );

  // Fetch the client's enrolled programs.
  const fetchMyPrograms = async () => {
    try {
      if (!hasLoaded.current) {
        setLoading(true);
      }

      setError(false);

      const { data, error: err } = await supabase
        .from("program_participants")
        .select(
          `
          id,
          status,
          created_at,
          program:program_id (
            id,
            title,
            description,
            category,
            starts_at,
            ends_at,
            total_days,
            schedule,
            call_status,
            location_type,
            location_details,
            is_paid,
            amount,
            currency,
            poster_url
          )
        `,
        )
        .eq("client_id", user.id);

      if (err) throw err;

      const list = (data || [])
        .map((row) => ({
          program: Array.isArray(row.program) ? row.program[0] : row.program,
          status: row.status,
        }))
        .filter((r) => r.program);

      setEnrolled(list);

      // First load: if the client has no enrolled programs,
      // open the Explore tab automatically.
      if (!hasLoaded.current && list.length === 0) {
        setActiveTab("explore");
      }

      hasLoaded.current = true;
    } catch (e) {
      console.error("Error fetching my programs:", e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh.
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyPrograms();
  }, [user?.id]);

  // Handle opening a program's venue, external link or in-app call.
  const handleOpenAction = async (program) => {
    if (!program) return;

    const type = program.location_type;
    const details = program.location_details;

    // Physical programs.
    if (type === "physical") {
      Alert.alert(
        "Venue details",
        details || "The venue has not been provided yet.",
      );

      return;
    }

    // External virtual programs.
    if (type === "virtual") {
      if (!details) {
        Alert.alert(
          "Meeting link unavailable",
          "The counselor has not added a meeting link yet.",
        );

        return;
      }

      const url = /^https?:\/\//i.test(details)
        ? details
        : `https://${details}`;

      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert(
          "Unable to open link",
          "Could not open the external meeting link.",
        );
      }

      return;
    }

    // In-app audio and video programs.
    if (type === "in_app_video" || type === "in_app_audio") {
      if (!program.id) return;

      await join({
        kind: "program",
        roomId: program.id,
        role: "client",
        peerName: program.title,
        subtitle: "Live program",
        video: type === "in_app_video",
      });
    }
  };

  // Open the full program details screen.
  const openDetails = (program) => {
    router.push({
      pathname: "programs/regPrograms",
      params: {
        programId: program.id,
      },
    });
  };

  // Classify enrolled programs using their actual schedule.
  const { upcoming, past } = useMemo(() => {
    const now = Date.now();

    const up = [];
    const pa = [];

    enrolled.forEach((r) => {
      (isProgramOver(r.program, now) ? pa : up).push(r);
    });

    // Upcoming programs: earliest start first.
    up.sort(
      (a, b) => new Date(a.program.starts_at) - new Date(b.program.starts_at),
    );

    // Past programs: most recently started first.
    pa.sort(
      (a, b) => new Date(b.program.starts_at) - new Date(a.program.starts_at),
    );

    return {
      upcoming: up,
      past: pa,
    };
  }, [enrolled]);

  // Tabs.
  const tabs = [
    {
      key: "mine",
      label: "My programs",
      count: enrolled.length,
    },
    {
      key: "explore",
      label: "Explore",
      count: PROGRAMS.length,
    },
  ];

  // Render enrolled program cards.
  const renderEnrolled = (rows, isPast, offset = 0) =>
    rows.map((r, i) => (
      <EnrolledCard
        key={r.program.id}
        program={r.program}
        status={r.status}
        past={isPast}
        index={offset + i}
        style={{ width: itemWidth }}
        onOpen={() => openDetails(r.program)}
        onAction={handleOpenAction}
      />
    ));

  // My Programs tab.
  const mineBody = () => {
    // Empty state.
    if (enrolled.length === 0) {
      return (
        <View key="mine-empty" style={pg.empty}>
          <Animated.View
            entering={ZoomIn.duration(400).springify().damping(12)}
            style={pg.emptyCircle}
          >
            <Ionicons name="school-outline" size={44} color="#936D9A" />
          </Animated.View>

          <Animated.Text entering={FadeIn.delay(150)} style={pg.emptyTitle}>
            You're not enrolled yet
          </Animated.Text>

          <Animated.Text entering={FadeIn.delay(220)} style={pg.emptyText}>
            Join a guidance program or workshop and it will show up here.
          </Animated.Text>

          <PressableScale
            haptic
            style={pg.cta}
            onPress={() => setActiveTab("explore")}
          >
            <Text style={pg.ctaText}>Explore programs</Text>
          </PressableScale>
        </View>
      );
    }

    return (
      <View key="mine">
        {/* Upcoming programs */}
        <Text style={pg.sectionLabel}>Upcoming ({upcoming.length})</Text>

        {upcoming.length > 0 ? (
          <View style={[pg.grid, { gap: GAP }]}>
            {renderEnrolled(upcoming, false)}
          </View>
        ) : (
          <Text style={[pg.subtitle, { marginBottom: 8 }]}>
            Nothing coming up. Explore programs to join one.
          </Text>
        )}

        {/* Past programs */}
        {past.length > 0 && (
          <>
            <Text style={[pg.sectionLabel, { marginTop: 24 }]}>
              Past ({past.length})
            </Text>

            <View style={[pg.grid, { gap: GAP }]}>
              {renderEnrolled(past, true, upcoming.length)}
            </View>
          </>
        )}
      </View>
    );
  };

  // Explore tab.
  const exploreBody = () => (
    <View key="explore" style={[pg.grid, { gap: GAP }]}>
      {PROGRAMS.map((item, i) => (
        <CategoryCard
          key={item.id}
          item={item}
          modules={MODULE_COUNTS[item.id]}
          index={i}
          style={{ width: itemWidth }}
          onPress={() => router.push(`/programs/${item.id}`)}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={pg.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={pg.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#936D9A"
            colors={["#936D9A"]}
          />
        }
      >
        <View style={pg.content}>
          {/* Header */}
          <View style={pg.headerRow}>
            {router.canGoBack() && (
              <PressableScale
                haptic
                style={pg.backBtn}
                onPress={() => router.back()}
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color="#0F172A" />
              </PressableScale>
            )}

            <View style={{ flex: 1 }}>
              <Text style={pg.title}>Programs</Text>

              <Text style={pg.subtitle}>
                Guidance tracks and live workshops
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <AnimatedTabs
            tabs={tabs}
            active={activeTab}
            onChange={setActiveTab}
          />

          {/* Error state */}
          {error && (
            <Animated.View entering={FadeIn.duration(250)} style={pg.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />

              <Text style={pg.errorText}>Couldn't load your programs.</Text>

              <PressableScale onPress={fetchMyPrograms}>
                <Text style={pg.errorRetry}>Retry</Text>
              </PressableScale>
            </Animated.View>
          )}

          {/* Body */}
          {activeTab === "mine" && loading ? (
            <ProgramsSkeleton
              count={columns * 2}
              itemWidth={itemWidth}
              gap={GAP}
            />
          ) : activeTab === "mine" ? (
            mineBody()
          ) : (
            exploreBody()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
