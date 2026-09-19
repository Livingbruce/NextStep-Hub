import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../libs/supabase";
import { styles } from "../../styles/(admin)/profile";

export default function Profile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    id: null,
    firstName: "",
    middleName: "",
    surname: "",
    email: "",
    phone: "",
    altPhone: "",
    relationshipStatus: "",
    religion: "",
    gender: "",
    county: "",
    bio: "",
    profileImageUri: null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/(auth)/landing");
        return;
      }

      const { data: dbProfile, error: dbError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (
        dbError ||
        !dbProfile ||
        dbProfile.id !== user.id ||
        dbProfile.role?.toLowerCase() !== "admin"
      ) {
        Alert.alert("Unauthorized Access", "Profile identity mismatch.");
        await supabase.auth.signOut();
        router.replace("/(auth)/landing");
        return;
      }

      setProfile({
        id: dbProfile.id,
        firstName: dbProfile.first_name || "",
        middleName: dbProfile.middle_name || "",
        surname: dbProfile.surname || "",
        email: user.email || dbProfile.email || "",
        phone: dbProfile.phone_no || "",
        altPhone: dbProfile.alt_phone_no || "",
        relationshipStatus: dbProfile.relationship_status || "",
        religion: dbProfile.religion || "",
        gender: dbProfile.gender || "",
        county: dbProfile.county || "",
        bio: dbProfile.about || "",
        profileImageUri: dbProfile.avatar_url || null,
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      router.replace("/(auth)/landing");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (first, surname) => {
    const f = first ? first.trim().charAt(0).toUpperCase() : "";
    const s = surname ? surname.trim().charAt(0).toUpperCase() : "";
    return `${f}${s}` || "A";
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "You need to allow access to your photos to update your profile image.",
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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (!asset.base64) {
          Alert.alert("Upload Failed", "Could not read the selected image.");
          return;
        }

        await uploadProfileImage(asset);
      }
    } catch (error) {
      console.error("Image picker error:", error);

      Alert.alert("Error", error?.message || "Could not select the image.");
    }
  };

  const uploadProfileImage = async (asset) => {
    try {
      setSaving(true);

      // --------------------------------------------------
      // 1. Get the currently authenticated user
      // --------------------------------------------------
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Get user error:", userError);
        throw userError;
      }

      if (!user) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again.",
        );
        return;
      }

      console.log("Authenticated user:", user.id);
      console.log("Profile ID:", profile?.id);

      // --------------------------------------------------
      // 2. Make sure we have an image
      // --------------------------------------------------
      if (!asset.base64) {
        throw new Error("Image data is missing.");
      }

      // --------------------------------------------------
      // 3. Determine file extension
      // --------------------------------------------------
      let fileExt = asset.uri?.split(".").pop()?.toLowerCase() || "jpeg";

      // Normalize extension
      if (fileExt === "jpg") {
        fileExt = "jpeg";
      }

      const contentType = `image/${fileExt}`;

      // --------------------------------------------------
      // 4. Create a unique storage path
      //
      // IMPORTANT:
      // Use user.id rather than profile.id.
      // --------------------------------------------------
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log("Uploading to:", fileName);
      console.log("Content type:", contentType);

      // --------------------------------------------------
      // 5. Convert base64 image to binary
      // --------------------------------------------------
      const fileData = decode(asset.base64);

      if (!fileData) {
        throw new Error("Could not decode image.");
      }

      // --------------------------------------------------
      // 6. Upload to Supabase Storage
      //
      // upsert:false is intentional because the filename
      // contains Date.now(), so every upload is unique.
      // --------------------------------------------------
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileData, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase Storage error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // --------------------------------------------------
      // 7. Get public URL
      // --------------------------------------------------
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error("Could not generate public image URL.");
      }

      console.log("Public URL:", publicUrl);

      // --------------------------------------------------
      // 8. Update the user's profile
      //
      // Use the authenticated user's ID here as well.
      // --------------------------------------------------
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      // --------------------------------------------------
      // 9. Update local state
      // --------------------------------------------------
      setProfile((prev) => ({
        ...prev,
        profileImageUri: publicUrl,
        avatar_url: publicUrl,
      }));

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Upload error:", error);

      Alert.alert("Upload Failed", error?.message || "Could not upload image.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updates = {
        first_name: profile.firstName,
        middle_name: profile.middleName,
        surname: profile.surname,
        phone_no: profile.phone,
        alt_phone_no: profile.altPhone,
        relationship_status: profile.relationshipStatus,
        religion: profile.religion,
        gender: profile.gender,
        county: profile.county,
        about: profile.bio,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id);

      if (error) throw error;

      setIsEditing(false);
      Alert.alert("Success", "Admin profile updated successfully!");
    } catch (error) {
      Alert.alert("Save Failed", error.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const fullName = [profile.firstName, profile.middleName, profile.surname]
    .filter(Boolean)
    .join(" ");

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Action */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Admin Profile</Text>
          <TouchableOpacity
            style={[
              styles.editToggleButton,
              isEditing && styles.saveToggleButton,
            ]}
            onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={isEditing ? "checkmark-sharp" : "create-outline"}
                  size={18}
                  color={isEditing ? "#FFFFFF" : "#1E3A8A"}
                />
                <Text
                  style={
                    isEditing ? styles.saveButtonText : styles.editButtonText
                  }
                >
                  {isEditing ? "Save" : "Edit"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profile.profileImageUri ? (
              <Image
                source={{ uri: profile.profileImageUri }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {getInitials(profile.firstName, profile.surname)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.editImageButton}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {!isEditing && (
            <Text style={styles.userName}>
              {fullName || "System Administrator"}
            </Text>
          )}
          <Text style={styles.userRoleTag}>System Administrator</Text>
        </View>

        {/* Name Fields Section (When Editing) */}
        {isEditing && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Full Name Details</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={profile.firstName}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, firstName: text }))
                }
                placeholder="First Name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Middle Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={profile.middleName}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, middleName: text }))
                }
                placeholder="Middle Name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Surname</Text>
              <TextInput
                style={styles.input}
                value={profile.surname}
                onChangeText={(text) =>
                  setProfile((prev) => ({ ...prev, surname: text }))
                }
                placeholder="Surname"
              />
            </View>
          </View>
        )}

        {/* Contact Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          {/* Email */}
          <View style={styles.infoRow}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email (Read Only)</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Primary Phone */}
          <View style={styles.infoRow}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Primary Phone</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inlineInput}
                  value={profile.phone}
                  onChangeText={(text) =>
                    setProfile((prev) => ({ ...prev, phone: text }))
                  }
                  keyboardType="phone-pad"
                  placeholder="+254..."
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.phone || "Not provided"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Alternative Phone */}
          <View style={styles.infoRow}>
            <Ionicons
              name="phone-portrait-outline"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Alternative Phone</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inlineInput}
                  value={profile.altPhone}
                  onChangeText={(text) =>
                    setProfile((prev) => ({ ...prev, altPhone: text }))
                  }
                  keyboardType="phone-pad"
                  placeholder="+254..."
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.altPhone || "Not provided"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Personal Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal & Location Details</Text>

          {/* Gender Section */}
          <View style={styles.infoRow}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              {isEditing ? (
                <View style={styles.genderOptionsRow}>
                  {["male", "female", "prefer_not_to_say"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.genderChip,
                        profile.gender === option && styles.genderChipSelected,
                      ]}
                      onPress={() =>
                        setProfile((prev) => ({ ...prev, gender: option }))
                      }
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          profile.gender === option &&
                            styles.genderChipTextSelected,
                        ]}
                      >
                        {option === "male"
                          ? "Male"
                          : option === "female"
                            ? "Female"
                            : "Prefer not to say"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoValue}>
                  {profile.gender === "male"
                    ? "Male"
                    : profile.gender === "female"
                      ? "Female"
                      : profile.gender === "prefer_not_to_say"
                        ? "Prefer not to say"
                        : "Not provided"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* County Section */}
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>County</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inlineInput}
                  value={profile.county}
                  onChangeText={(text) =>
                    setProfile((prev) => ({ ...prev, county: text }))
                  }
                  placeholder="e.g. Meru, Nairobi"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.county || "Not provided"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Relationship Status */}
          <View style={styles.infoRow}>
            <Ionicons
              name="heart-outline"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Relationship Status</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inlineInput}
                  value={profile.relationshipStatus}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      relationshipStatus: text,
                    }))
                  }
                  placeholder="e.g. Single, Married"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.relationshipStatus || "Not provided"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Religion */}
          <View style={styles.infoRow}>
            <Ionicons
              name="sparkles-outline"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Religion / Faith</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inlineInput}
                  value={profile.religion}
                  onChangeText={(text) =>
                    setProfile((prev) => ({ ...prev, religion: text }))
                  }
                  placeholder="e.g. Christianity, Islam"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.religion || "Not provided"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bio Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About / Biography</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={profile.bio}
              onChangeText={(text) =>
                setProfile((prev) => ({ ...prev, bio: text }))
              }
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Write a brief bio..."
            />
          ) : (
            <Text style={styles.bioText}>
              {profile.bio || "No biography provided."}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
