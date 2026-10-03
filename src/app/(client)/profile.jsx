import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import PressableScale from "../../components/client/appointments/PressableScale";
import {
  OptionChips,
  ProfileField,
} from "../../components/client/profile/ProfileField";
import ProfileSkeleton from "../../components/client/profile/ProfileSkeleton";
import { styles } from "../../styles/(client)/Profile";
import { pui } from "../../styles/(client)/profile/ui";

const GENDERS = ["Male", "Female", "Prefer not to say"];
const RELATIONSHIPS = [
  "Single",
  "Married",
  "Dating (In a relationship)",
  "Divorced",
  "Separated",
  "Widowed",
  "Prefer not to say",
];

// Fields counted towards "profile completion", with a friendly name for the hint.
const TRACKED = [
  ["phoneNo", "your phone number"],
  ["gender", "your gender"],
  ["age", "your age"],
  ["county", "your county"],
  ["relationshipStatus", "your relationship status"],
  ["religion", "your religion"],
  ["emergencyPhone", "an emergency contact"],
  ["emergencyRelationship", "your emergency contact's relationship to you"],
];

const EMPTY = {
  id: null,
  email: "",
  firstName: "",
  middleName: "",
  surname: "",
  fullName: "",
  phoneNo: "",
  gender: "",
  age: "",
  county: "",
  relationshipStatus: "",
  religion: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  profileImageUri: null,
};

const GAP = 16;

function Section({ title, icon, index, style, children }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80)
        .duration(420)
        .springify()
        .damping(18)}
      layout={LinearTransition.duration(260)}
      style={[styles.sectionCard, { marginBottom: 0 }, style]}
    >
      <View style={pui.cardTitleRow}>
        <View style={pui.cardIcon}>
          <Ionicons name={icon} size={15} color="#16A34A" />
        </View>
        <Text style={pui.cardTitle}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

function Completion({ percent, hint }) {
  const pct = useSharedValue(0);
  useEffect(() => {
    pct.set(withTiming(percent, { duration: 700 }));
  }, [percent, pct]);
  const fill = useAnimatedStyle(() => ({ width: `${pct.get()}%` }));

  return (
    <Animated.View
      entering={FadeInDown.delay(60).duration(400)}
      style={pui.completion}
    >
      <View style={pui.completionTop}>
        <Text style={pui.completionTitle}>
          {percent === 100 ? "Profile complete" : "Profile completion"}
        </Text>
        <Text style={pui.completionPct}>{percent}%</Text>
      </View>
      <View style={pui.track}>
        <Animated.View style={[pui.fill, fill]} />
      </View>
      {!!hint && <Text style={pui.completionHint}>{hint}</Text>}
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [profile, setProfile] = useState(EMPTY);

  const saved = useRef(EMPTY); // last saved snapshot, used by Cancel
  const hasLoaded = useRef(false);

  const columns = width >= 720 ? 2 : 1;

  useEffect(() => {
    fetchProfile();
  }, []);

  const set = (field) => (value) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const buzz = (type) => Haptics.notificationAsync(type).catch(() => {});

  const fetchProfile = async () => {
    try {
      if (!hasLoaded.current) setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/(auth)/landing");
        return;
      }

      const { data: db, error: dbError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (dbError || !db) {
        console.error("Profile fetch error:", dbError);
        Alert.alert("Couldn't load profile", "Pull down to try again.");
        return;
      }

      if (db.role?.toLowerCase() !== "client") {
        Alert.alert(
          "Not available",
          "This profile page is only available to clients.",
        );
        return;
      }

      const next = {
        id: db.id,
        email: user.email || db.email || "",
        firstName: db.first_name || "",
        middleName: db.middle_name || "",
        surname: db.surname || "",
        fullName:
          db.full_name ||
          [db.first_name, db.middle_name, db.surname].filter(Boolean).join(" "),
        phoneNo: db.phone_no || "",
        gender: db.gender || "",
        age: db.age !== null && db.age !== undefined ? String(db.age) : "",
        county: db.county || "",
        relationshipStatus: db.relationship_status || "",
        religion: db.religion || "",
        emergencyPhone: db.emergency_phone || "",
        emergencyRelationship: db.emergency_relationship || "",
        profileImageUri: db.avatar_url || null,
      };

      saved.current = next;
      setProfile(next);
      setImageError(false);
      hasLoaded.current = true;
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Couldn't load profile", "Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (isEditing) return setRefreshing(false);
    setRefreshing(true);
    fetchProfile();
  };

  // ---- Avatar ----
  const getInitials = () => {
    const f = profile.firstName?.trim()?.charAt(0)?.toUpperCase() || "";
    const l = profile.surname?.trim()?.charAt(0)?.toUpperCase() || "";
    return `${f}${l}` || "C";
  };

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission needed",
          "Allow access to your photos to update your profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert("Upload failed", "Could not read the selected image.");
        return;
      }
      await uploadProfileImage(asset);
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", error?.message || "Could not select the image.");
    }
  };

  const uploadProfileImage = async (asset) => {
    try {
      setUploading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Session expired", "Please log in again.");
        return;
      }

      let ext = asset.uri?.split(".").pop()?.toLowerCase() || "jpeg";
      if (ext === "jpg") ext = "jpeg";
      if (!["jpeg", "png", "webp"].includes(ext)) ext = "jpeg";

      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, decode(asset.base64), {
          contentType: `image/${ext}`,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      if (!publicUrl) throw new Error("Could not generate the image URL.");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updateError) throw updateError;

      saved.current = { ...saved.current, profileImageUri: publicUrl };
      setProfile((prev) => ({ ...prev, profileImageUri: publicUrl }));
      setImageError(false);
      buzz(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Avatar upload error:", error);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Upload failed",
        error?.message || "Could not upload profile picture.",
      );
    } finally {
      setUploading(false);
    }
  };

  // ---- Save / cancel ----
  const handleSaveProfile = async () => {
    if (
      !profile.firstName.trim() ||
      !profile.surname.trim() ||
      !profile.phoneNo.trim()
    ) {
      buzz(Haptics.NotificationFeedbackType.Warning);
      return Alert.alert(
        "Missing details",
        "First name, surname and phone number are required.",
      );
    }
    if (profile.age) {
      const age = parseInt(profile.age, 10);
      if (Number.isNaN(age) || age < 10 || age > 100) {
        buzz(Haptics.NotificationFeedbackType.Warning);
        return Alert.alert(
          "Check your age",
          "Enter an age between 10 and 100.",
        );
      }
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        Alert.alert("Session expired", "Please log in again.");
        return;
      }

      const fullName = [
        profile.firstName.trim(),
        profile.middleName.trim(),
        profile.surname.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.firstName.trim(),
          middle_name: profile.middleName.trim() || null,
          surname: profile.surname.trim(),
          full_name: fullName,
          phone_no: profile.phoneNo.trim(),
          gender: profile.gender || null,
          age: profile.age ? parseInt(profile.age, 10) : null,
          county: profile.county.trim() || null,
          relationship_status: profile.relationshipStatus || null,
          religion: profile.religion.trim() || null,
          emergency_phone: profile.emergencyPhone.trim() || null,
          emergency_relationship: profile.emergencyRelationship.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (error) throw error;

      const next = { ...profile, fullName };
      saved.current = next;
      setProfile(next);
      setIsEditing(false);
      buzz(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Save profile error:", error);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Couldn't save", error?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setProfile(saved.current); // restore locally, no network call needed
    setIsEditing(false);
  };

  const handleNameChange = (text) => {
    const parts = text.trim().split(/\s+/).filter(Boolean);
    setProfile((prev) => ({
      ...prev,
      fullName: text,
      firstName: parts[0] || "",
      middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
      surname: parts.length > 1 ? parts[parts.length - 1] : "",
    }));
  };

  // ---- Completion ----
  const missing = TRACKED.filter(([key]) => !String(profile[key] || "").trim());
  const percent = Math.round(
    ((TRACKED.length - missing.length) / TRACKED.length) * 100,
  );
  const hint = missing.length ? `Add ${missing[0][1]} to keep going.` : "";

  // ---- Sections ----
  const cardWidth = { width: "100%" };

  const account = (
    <Section
      key="account"
      title="Account details"
      icon="mail-outline"
      index={0}
      style={cardWidth}
    >
      <ProfileField
        label="Email address"
        value={profile.email}
        editing={isEditing}
        readOnlyHint="Email can't be changed here."
      />
      <ProfileField
        label="Phone number"
        value={profile.phoneNo}
        editing={isEditing}
        onChangeText={set("phoneNo")}
        keyboardType="phone-pad"
        placeholder="07XX XXX XXX"
      />
    </Section>
  );

  const personal = (
    <Section
      key="personal"
      title="Personal details"
      icon="person-outline"
      index={1}
      style={cardWidth}
    >
      <OptionChips
        label="Gender"
        options={GENDERS}
        value={profile.gender}
        editing={isEditing}
        onChange={set("gender")}
      />
      <ProfileField
        label="Age"
        value={
          isEditing ? profile.age : profile.age ? `${profile.age} years` : ""
        }
        editing={isEditing}
        onChangeText={(t) => set("age")(t.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        maxLength={3}
      />
      <ProfileField
        label="County"
        value={profile.county}
        editing={isEditing}
        onChangeText={set("county")}
        autoCapitalize="words"
        placeholder="e.g. Kisumu"
      />
      <OptionChips
        label="Relationship status"
        options={RELATIONSHIPS}
        value={profile.relationshipStatus}
        editing={isEditing}
        onChange={set("relationshipStatus")}
      />
      <ProfileField
        label="Religion"
        value={profile.religion}
        editing={isEditing}
        onChangeText={set("religion")}
        autoCapitalize="words"
      />
    </Section>
  );

  const emergency = (
    <Section
      key="emergency"
      title="Emergency contact"
      icon="alert-circle-outline"
      index={2}
      style={cardWidth}
    >
      <ProfileField
        label="Contact phone"
        value={profile.emergencyPhone}
        editing={isEditing}
        onChangeText={set("emergencyPhone")}
        keyboardType="phone-pad"
        placeholder="07XX XXX XXX"
      />
      <ProfileField
        label="Relationship to you"
        value={profile.emergencyRelationship}
        editing={isEditing}
        onChangeText={set("emergencyRelationship")}
        autoCapitalize="words"
        placeholder="e.g. Parent"
      />
    </Section>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={pui.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#16A34A"
              colors={["#16A34A"]}
            />
          }
        >
          <View style={pui.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My profile</Text>

              {!loading &&
                (isEditing ? (
                  <Animated.View
                    key="editing"
                    entering={FadeIn.duration(180)}
                    exiting={FadeOut.duration(120)}
                    style={pui.headerActions}
                  >
                    <PressableScale
                      style={styles.cancelHeaderBtn}
                      onPress={handleCancelEdit}
                      disabled={saving}
                    >
                      <Text style={styles.cancelHeaderBtnText}>Cancel</Text>
                    </PressableScale>
                    <PressableScale
                      haptic
                      style={styles.editHeaderBtn}
                      onPress={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#16A34A" />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-sharp"
                            size={18}
                            color="#16A34A"
                          />
                          <Text style={styles.editHeaderBtnText}>Save</Text>
                        </>
                      )}
                    </PressableScale>
                  </Animated.View>
                ) : (
                  <Animated.View
                    key="viewing"
                    entering={FadeIn.duration(180)}
                    exiting={FadeOut.duration(120)}
                  >
                    <PressableScale
                      haptic
                      style={styles.editHeaderBtn}
                      onPress={() => setIsEditing(true)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#16A34A"
                      />
                      <Text style={styles.editHeaderBtnText}>Edit</Text>
                    </PressableScale>
                  </Animated.View>
                ))}
            </View>

            {loading ? (
              <ProfileSkeleton
                columns={columns}
                itemWidth={columns === 2 ? "48.5%" : "100%"}
              />
            ) : (
              <>
                {/* Avatar */}
                <Animated.View
                  entering={FadeIn.duration(400)}
                  style={styles.avatarContainer}
                >
                  <View style={styles.avatarWrapper}>
                    {profile.profileImageUri && !imageError ? (
                      <Image
                        source={{ uri: profile.profileImageUri }}
                        style={styles.avatarImage}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitialsText}>
                          {getInitials()}
                        </Text>
                      </View>
                    )}

                    {uploading && (
                      <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={pui.avatarBusy}
                      >
                        <ActivityIndicator color="#FFFFFF" />
                      </Animated.View>
                    )}

                    <PressableScale
                      scaleTo={0.88}
                      haptic
                      containerStyle={styles.addPhotoButton}
                      style={{
                        width: 32,
                        height: 32,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={handlePickImage}
                      disabled={uploading || saving}
                      accessibilityLabel="Change profile photo"
                    >
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                    </PressableScale>
                  </View>

                  {isEditing ? (
                    <Animated.View
                      entering={FadeIn.duration(220)}
                      style={{ width: "100%", alignItems: "center" }}
                    >
                      <TextInput
                        style={styles.inputName}
                        value={profile.fullName}
                        onChangeText={handleNameChange}
                        placeholder="Full name"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="words"
                        selectionColor="#16A34A"
                      />
                    </Animated.View>
                  ) : (
                    <Animated.Text
                      entering={FadeIn.duration(220)}
                      style={styles.userName}
                    >
                      {profile.fullName || "Client"}
                    </Animated.Text>
                  )}
                  <Text style={styles.userRole}>Youth client</Text>
                </Animated.View>

                <Completion percent={percent} hint={hint} />

                {columns === 2 ? (
                  <View style={pui.columns}>
                    <View style={[pui.column, { gap: GAP }]}>
                      {account}
                      {emergency}
                    </View>
                    <View style={pui.column}>{personal}</View>
                  </View>
                ) : (
                  <View style={{ gap: GAP }}>
                    {account}
                    {personal}
                    {emergency}
                  </View>
                )}

                {isEditing && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    exiting={FadeOut.duration(150)}
                    layout={LinearTransition}
                    style={{ marginTop: GAP }}
                  >
                    <PressableScale
                      haptic
                      style={[styles.saveButton, { marginBottom: 0 }]}
                      onPress={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.saveButtonText}>Save changes</Text>
                      )}
                    </PressableScale>
                  </Animated.View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
