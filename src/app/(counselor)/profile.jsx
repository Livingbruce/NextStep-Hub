import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
  Field,
  OptionChips,
} from "../../components/counselor/profile/CounselorField";
import ProfileSkeleton from "../../components/counselor/profile/ProfileSkeleton";
import { pf } from "../../styles/(counselor)/profileUi";

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
const SPECIALIZATIONS = [
  "Career Transitions",
  "Youth Mentorship",
  "Academic Stress",
  "Relationship Counseling",
  "Personal Growth",
  "Cognitive Behavioral (CBT)",
  "Systemic Therapy",
];

const TRACKED = [
  ["phoneNo", "your phone number"],
  ["gender", "your gender"],
  ["age", "your age"],
  ["yearsOfExperience", "your years of experience"],
  ["relationshipStatus", "your relationship status"],
  ["religion", "your religion"],
  ["specializations", "your specializations"],
  ["about", "a short bio"],
];

const EMPTY = {
  firstName: "",
  middleName: "",
  surname: "",
  email: "",
  phoneNo: "",
  altPhoneNo: "",
  role: "Counselor",
  age: "",
  yearsOfExperience: "",
  relationshipStatus: "",
  religion: "",
  gender: "",
  specializations: [],
  about: "",
  avatarUrl: null,
};

const filled = (v) =>
  Array.isArray(v) ? v.length > 0 : !!String(v || "").trim();

function Section({ title, icon, index, children }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80)
        .duration(420)
        .springify()
        .damping(18)}
      layout={LinearTransition.duration(260)}
      style={pf.card}
    >
      <View style={pf.cardTitleRow}>
        <View style={pf.cardIcon}>
          <Ionicons name={icon} size={15} color="#1E3A8A" />
        </View>
        <Text style={pf.cardTitle}>{title}</Text>
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
      style={pf.completion}
    >
      <View style={pf.cTop}>
        <Text style={pf.cTitle}>
          {percent === 100 ? "Profile complete" : "Profile completion"}
        </Text>
        <Text style={pf.cPct}>{percent}%</Text>
      </View>
      <View style={pf.track}>
        <Animated.View style={[pf.fill, fill]} />
      </View>
      {!!hint && <Text style={pf.cHint}>{hint}</Text>}
    </Animated.View>
  );
}

export default function CounselorProfile() {
  const { width } = useWindowDimensions();
  const twoCol = width >= 720;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(EMPTY);
  const [customSpec, setCustomSpec] = useState("");

  const saved = useRef(EMPTY);
  const hasLoaded = useRef(false);

  const set = (f) => (v) => setProfile((p) => ({ ...p, [f]: v }));
  const buzz = (t) => Haptics.notificationAsync(t).catch(() => {});

  useEffect(() => {
    fetchProfile();
  }, []);

  /* ------------------------------- load ------------------------------- */
  const fetchProfile = async () => {
    try {
      if (!hasLoaded.current) setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Authentication error", "Please log in again.");
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;

      const next = {
        firstName: data.first_name || "",
        middleName: data.middle_name || "",
        surname: data.surname || "",
        email: data.email || user.email || "",
        phoneNo: data.phone_no || "",
        altPhoneNo: data.alt_phone_no || "",
        role: data.role || "Counselor",
        age: data.age != null ? String(data.age) : "",
        yearsOfExperience:
          data.years_of_experience != null
            ? String(data.years_of_experience)
            : "",
        relationshipStatus: data.relationship_status || "",
        religion: data.religion || "",
        gender: data.gender || "",
        specializations: Array.isArray(data.specializations)
          ? data.specializations
          : [],
        about: data.about || "",
        avatarUrl: data.avatar_url || null,
      };
      saved.current = next;
      setProfile(next);
      setImageError(false);
      hasLoaded.current = true;
    } catch (e) {
      console.error("Profile fetch error:", e);
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

  /* ------------------------------ avatar ------------------------------ */
  const initials = () =>
    `${profile.firstName.trim().charAt(0)}${profile.surname.trim().charAt(0)}`.toUpperCase() ||
    "C";

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Allow access to your photos to update your picture.",
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
      await uploadImage(asset);
    } catch (e) {
      console.error("Image picker error:", e);
      Alert.alert("Error", e?.message || "Could not select the image.");
    }
  };

  const uploadImage = async (asset) => {
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

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, decode(asset.base64), {
          contentType: `image/${ext}`,
          upsert: false,
        });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      if (!publicUrl) throw new Error("Could not generate the image URL.");

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updErr) throw updErr;

      saved.current = { ...saved.current, avatarUrl: publicUrl };
      setProfile((p) => ({ ...p, avatarUrl: publicUrl }));
      setImageError(false);
      buzz(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Upload error:", e);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Upload failed", e?.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  /* ------------------------------ specs ------------------------------ */
  const toggleSpec = (item) => {
    Haptics.selectionAsync().catch(() => {});
    setProfile((p) => ({
      ...p,
      specializations: p.specializations.includes(item)
        ? p.specializations.filter((s) => s !== item)
        : [...p.specializations, item],
    }));
  };

  const addCustomSpec = () => {
    const t = customSpec.trim();
    if (!t) return;
    if (
      !profile.specializations.some((s) => s.toLowerCase() === t.toLowerCase())
    ) {
      setProfile((p) => ({ ...p, specializations: [...p.specializations, t] }));
    }
    setCustomSpec("");
  };

  /* ------------------------------- save ------------------------------- */
  const handleSave = async () => {
    if (!userId) return;
    const warn = (title, msg) => {
      buzz(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(title, msg);
    };

    if (
      !profile.firstName.trim() ||
      !profile.surname.trim() ||
      !profile.phoneNo.trim()
    ) {
      return warn(
        "Missing details",
        "First name, surname and phone number are required.",
      );
    }
    if (profile.age) {
      const a = parseInt(profile.age, 10);
      if (Number.isNaN(a) || a < 18 || a > 100)
        return warn("Check your age", "Enter an age between 18 and 100.");
    }
    if (profile.yearsOfExperience) {
      const y = parseInt(profile.yearsOfExperience, 10);
      if (Number.isNaN(y) || y < 0 || y > 60)
        return warn(
          "Check experience",
          "Enter years of experience between 0 and 60.",
        );
    }

    try {
      setSaving(true);
      const fullName = [profile.firstName, profile.middleName, profile.surname]
        .map((s) => s.trim())
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
          alt_phone_no: profile.altPhoneNo.trim() || null,
          age: profile.age ? parseInt(profile.age, 10) : null,
          years_of_experience: profile.yearsOfExperience
            ? parseInt(profile.yearsOfExperience, 10)
            : null,
          relationship_status: profile.relationshipStatus || null,
          religion: profile.religion.trim() || null,
          gender: profile.gender || null,
          specializations: profile.specializations,
          about: profile.about.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (error) throw error;

      saved.current = profile;
      setIsEditing(false);
      setCustomSpec("");
      buzz(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error("Save error:", e);
      buzz(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Couldn't save", e?.message || "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(saved.current);
    setCustomSpec("");
    setIsEditing(false);
  };

  /* ---------------------------- completion ---------------------------- */
  const missing = TRACKED.filter(([k]) => !filled(profile[k]));
  const percent = Math.round(
    ((TRACKED.length - missing.length) / TRACKED.length) * 100,
  );
  const hint = missing.length ? `Add ${missing[0][1]} to keep going.` : "";

  const fullName = [profile.firstName, profile.middleName, profile.surname]
    .filter(Boolean)
    .join(" ");

  const specOptions = [
    ...SPECIALIZATIONS,
    ...profile.specializations.filter((s) => !SPECIALIZATIONS.includes(s)),
  ];

  /* ----------------------------- sections ----------------------------- */
  const nameCard = isEditing && (
    <Section key="name" title="Full name" icon="id-card-outline" index={0}>
      <Field
        label="First name"
        editing
        value={profile.firstName}
        onChangeText={set("firstName")}
        autoCapitalize="words"
      />
      <Field
        label="Middle name (optional)"
        editing
        value={profile.middleName}
        onChangeText={set("middleName")}
        autoCapitalize="words"
      />
      <Field
        label="Surname"
        editing
        value={profile.surname}
        onChangeText={set("surname")}
        autoCapitalize="words"
      />
    </Section>
  );

  const contact = (
    <Section
      key="contact"
      title="Contact details"
      icon="call-outline"
      index={1}
    >
      <Field
        label="Email address"
        value={profile.email}
        editing={isEditing}
        hint="Email can't be changed here."
      />
      <Field
        label="Phone number"
        value={profile.phoneNo}
        editing={isEditing}
        onChangeText={set("phoneNo")}
        keyboardType="phone-pad"
        placeholder="07XX XXX XXX"
      />
      <Field
        label="Alternative phone"
        value={profile.altPhoneNo}
        editing={isEditing}
        onChangeText={set("altPhoneNo")}
        keyboardType="phone-pad"
        placeholder="Optional"
      />
    </Section>
  );

  const personal = (
    <Section
      key="personal"
      title="Personal & professional"
      icon="person-outline"
      index={2}
    >
      <Field
        label="Age"
        value={
          isEditing ? profile.age : profile.age ? `${profile.age} years` : ""
        }
        editing={isEditing}
        onChangeText={(t) => set("age")(t.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        maxLength={3}
      />
      <Field
        label="Years of experience"
        value={
          isEditing
            ? profile.yearsOfExperience
            : profile.yearsOfExperience
              ? `${profile.yearsOfExperience} years`
              : ""
        }
        editing={isEditing}
        onChangeText={(t) => set("yearsOfExperience")(t.replace(/[^0-9]/g, ""))}
        keyboardType="number-pad"
        maxLength={2}
      />
      <OptionChips
        label="Gender"
        options={GENDERS}
        value={profile.gender}
        editing={isEditing}
        onChange={set("gender")}
      />
      <OptionChips
        label="Relationship status"
        options={RELATIONSHIPS}
        value={profile.relationshipStatus}
        editing={isEditing}
        onChange={set("relationshipStatus")}
      />
      <Field
        label="Religion"
        value={profile.religion}
        editing={isEditing}
        onChangeText={set("religion")}
        autoCapitalize="words"
      />
    </Section>
  );

  const specs = (
    <Section
      key="specs"
      title="Specializations"
      icon="ribbon-outline"
      index={3}
    >
      <View style={pf.chips}>
        {(isEditing ? specOptions : profile.specializations).map((s) => {
          const on = profile.specializations.includes(s);
          return (
            <PressableScale
              key={s}
              scaleTo={0.94}
              disabled={!isEditing}
              style={[pf.chip, on && pf.chipOn]}
              onPress={() => toggleSpec(s)}
            >
              <Text style={[pf.chipText, on && pf.chipTextOn]}>{s}</Text>
            </PressableScale>
          );
        })}
        {!isEditing && profile.specializations.length === 0 && (
          <Text style={[pf.value, pf.muted]}>None added yet.</Text>
        )}
      </View>
      {isEditing && (
        <Animated.View entering={FadeIn.duration(200)} style={pf.addRow}>
          <View
            style={[
              pf.inputBox,
              { flex: 1, borderColor: "#CBD5E1", backgroundColor: "#F8FAFC" },
            ]}
          >
            <TextInput
              style={pf.input}
              placeholder="Add your own..."
              placeholderTextColor="#94A3B8"
              value={customSpec}
              onChangeText={setCustomSpec}
              onSubmitEditing={addCustomSpec}
              returnKeyType="done"
              selectionColor="#1E3A8A"
            />
          </View>
          <PressableScale
            haptic
            style={pf.addBtn}
            onPress={addCustomSpec}
            accessibilityLabel="Add specialization"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </PressableScale>
        </Animated.View>
      )}
    </Section>
  );

  const bio = (
    <Section
      key="bio"
      title="About / bio"
      icon="document-text-outline"
      index={4}
    >
      <Field
        value={profile.about}
        editing={isEditing}
        onChangeText={set("about")}
        multiline
        placeholder="Write a short professional background..."
      />
    </Section>
  );

  return (
    <SafeAreaView style={pf.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={pf.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1E3A8A"
              colors={["#1E3A8A"]}
            />
          }
        >
          <View style={pf.content}>
            <View style={pf.headerRow}>
              <Text style={pf.title}>My profile</Text>

              {!loading &&
                (isEditing ? (
                  <Animated.View
                    key="editing"
                    entering={FadeIn.duration(180)}
                    exiting={FadeOut.duration(120)}
                    style={pf.headerActions}
                  >
                    <PressableScale
                      style={pf.cancelBtn}
                      onPress={handleCancel}
                      disabled={saving}
                    >
                      <Text style={pf.cancelText}>Cancel</Text>
                    </PressableScale>
                    <PressableScale
                      haptic
                      style={[pf.editBtn, pf.saveBtn]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-sharp"
                            size={18}
                            color="#FFFFFF"
                          />
                          <Text style={pf.saveBtnText}>Save</Text>
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
                      style={pf.editBtn}
                      onPress={() => setIsEditing(true)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#1E3A8A"
                      />
                      <Text style={pf.editBtnText}>Edit</Text>
                    </PressableScale>
                  </Animated.View>
                ))}
            </View>

            {loading ? (
              <ProfileSkeleton twoCol={twoCol} />
            ) : (
              <>
                <Animated.View entering={FadeIn.duration(400)} style={pf.hero}>
                  <View style={pf.avatarWrap}>
                    {profile.avatarUrl && !imageError ? (
                      <Image
                        source={{ uri: profile.avatarUrl }}
                        style={pf.avatarImg}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <View style={pf.avatarFallback}>
                        <Text style={pf.avatarInitials}>{initials()}</Text>
                      </View>
                    )}
                    {uploading && (
                      <Animated.View
                        entering={FadeIn}
                        exiting={FadeOut}
                        style={pf.avatarBusy}
                      >
                        <ActivityIndicator color="#FFFFFF" />
                      </Animated.View>
                    )}
                    <PressableScale
                      haptic
                      scaleTo={0.88}
                      containerStyle={pf.camera}
                      style={{
                        width: 34,
                        height: 34,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={pickImage}
                      disabled={uploading || saving}
                      accessibilityLabel="Change profile photo"
                    >
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                    </PressableScale>
                  </View>

                  <Text style={pf.name}>{fullName || "Counselor"}</Text>
                  <View style={pf.roleChip}>
                    <Ionicons
                      name="shield-checkmark"
                      size={13}
                      color="#1E3A8A"
                    />
                    <Text style={pf.roleChipText}>{profile.role}</Text>
                  </View>
                </Animated.View>

                <Completion percent={percent} hint={hint} />

                {twoCol ? (
                  <View style={pf.columns}>
                    <View style={pf.column}>
                      {nameCard}
                      {contact}
                      {personal}
                    </View>
                    <View style={pf.column}>
                      {specs}
                      {bio}
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 16 }}>
                    {nameCard}
                    {contact}
                    {personal}
                    {specs}
                    {bio}
                  </View>
                )}

                {isEditing && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    exiting={FadeOut.duration(150)}
                    layout={LinearTransition}
                  >
                    <PressableScale
                      haptic
                      style={pf.bottomSave}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={pf.bottomSaveText}>Save changes</Text>
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
