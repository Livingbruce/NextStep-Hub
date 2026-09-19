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
import { styles } from "../../styles/(client)/Profile";

export default function ProfileScreen() {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [profile, setProfile] = useState({
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

      if (dbError || !dbProfile) {
        console.error("Profile fetch error:", dbError);
        Alert.alert("Error", "Could not load your profile.");
        return;
      }

      // Client profile
      if (dbProfile.role?.toLowerCase() !== "client") {
        Alert.alert(
          "Unauthorized",
          "This profile page is only available to clients.",
        );
        return;
      }

      const fullName =
        dbProfile.full_name ||
        [dbProfile.first_name, dbProfile.middle_name, dbProfile.surname]
          .filter(Boolean)
          .join(" ");

      setProfile({
        id: dbProfile.id,
        email: user.email || dbProfile.email || "",
        firstName: dbProfile.first_name || "",
        middleName: dbProfile.middle_name || "",
        surname: dbProfile.surname || "",
        fullName,
        phoneNo: dbProfile.phone_no || "",
        gender: dbProfile.gender || "",
        age:
          dbProfile.age !== null && dbProfile.age !== undefined
            ? String(dbProfile.age)
            : "",
        county: dbProfile.county || "",
        relationshipStatus: dbProfile.relationship_status || "",
        religion: dbProfile.religion || "",
        emergencyPhone: dbProfile.emergency_phone || "",
        emergencyRelationship: dbProfile.emergency_relationship || "",
        profileImageUri: dbProfile.avatar_url || null,
      });

      setImageError(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, surname) => {
    const first = firstName?.trim()?.charAt(0)?.toUpperCase() || "";
    const last = surname?.trim()?.charAt(0)?.toUpperCase() || "";

    return `${first}${last}` || "C";
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "You need to allow access to your photos to update your profile picture.",
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

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.base64) {
        Alert.alert("Upload Failed", "Could not read the selected image.");
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
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again.",
        );
        return;
      }

      if (!asset.base64) {
        throw new Error("Image data is missing.");
      }

      let fileExt = asset.uri?.split(".").pop()?.toLowerCase() || "jpeg";

      if (fileExt === "jpg") {
        fileExt = "jpeg";
      }

      // Only allow normal image formats.
      if (!["jpeg", "png", "webp"].includes(fileExt)) {
        fileExt = "jpeg";
      }

      const contentType = `image/${fileExt}`;

      // Same concept as Admin/Counselor:
      // user.id is the folder owner.
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const fileData = decode(asset.base64);

      if (!fileData) {
        throw new Error("Could not decode image.");
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileData, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error("Could not generate profile image URL.");
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Avatar profile update error:", updateError);
        throw updateError;
      }

      setProfile((prev) => ({
        ...prev,
        profileImageUri: publicUrl,
      }));

      setImageError(false);

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Avatar upload error:", error);

      Alert.alert(
        "Upload Failed",
        error?.message || "Could not upload profile picture.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (
        !profile.firstName.trim() ||
        !profile.surname.trim() ||
        !profile.phoneNo.trim()
      ) {
        Alert.alert(
          "Required Fields",
          "First name, surname, and phone number cannot be empty.",
        );
        return;
      }

      setSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again.",
        );
        return;
      }

      const fullName = [
        profile.firstName.trim(),
        profile.middleName.trim(),
        profile.surname.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const updates = {
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
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      setProfile((prev) => ({
        ...prev,
        fullName,
      }));

      setIsEditing(false);

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Save profile error:", error);

      Alert.alert("Save Failed", error?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reload from database so cancelled edits disappear.
    fetchProfile();
    setIsEditing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#16A34A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>

          {!isEditing ? (
            <TouchableOpacity
              style={styles.editHeaderBtn}
              onPress={() => setIsEditing(true)}
              disabled={saving}
            >
              <Ionicons name="create-outline" size={18} color="#16A34A" />
              <Text style={styles.editHeaderBtnText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={styles.cancelHeaderBtn}
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <Text style={styles.cancelHeaderBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
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
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            {profile.profileImageUri && !imageError ? (
              <Image
                source={{
                  uri: profile.profileImageUri,
                }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitialsText}>
                  {getInitials(profile.firstName, profile.surname)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handlePickImage}
              activeOpacity={0.8}
              disabled={saving}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={{ width: "100%" }}>
              <TextInput
                style={styles.inputName}
                value={profile.fullName}
                onChangeText={(text) => {
                  const parts = text.trim().split(/\s+/);

                  const firstName = parts[0] || "";
                  const surname =
                    parts.length > 1 ? parts[parts.length - 1] : "";

                  const middleName =
                    parts.length > 2 ? parts.slice(1, -1).join(" ") : "";

                  setProfile((prev) => ({
                    ...prev,
                    fullName: text,
                    firstName,
                    middleName,
                    surname,
                  }));
                }}
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          ) : (
            <Text style={styles.userName}>{profile.fullName || "Client"}</Text>
          )}

          <Text style={styles.userRole}>Youth Client</Text>
        </View>

        {/* Account Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          {/* Email */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldLabel}>Email Address</Text>

              <Text style={styles.fieldValue}>
                {profile.email || "Not provided"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Phone */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldLabel}>Phone Number</Text>

              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={profile.phoneNo}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      phoneNo: text,
                    }))
                  }
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {profile.phoneNo || "Not provided"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Personal Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          {/* Gender */}
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Gender</Text>

              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={profile.gender}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      gender: text,
                    }))
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {profile.gender || "Not provided"}
                </Text>
              )}
            </View>

            {/* Age */}
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Age</Text>

              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={profile.age}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      age: text,
                    }))
                  }
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {profile.age ? `${profile.age} years` : "Not provided"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* County */}
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>County</Text>

              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={profile.county}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      county: text,
                    }))
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {profile.county || "Not provided"}
                </Text>
              )}
            </View>

            {/* Relationship */}
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Relationship Status</Text>

              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={profile.relationshipStatus}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      relationshipStatus: text,
                    }))
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {profile.relationshipStatus || "Not provided"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Religion */}
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Religion</Text>

              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={profile.religion}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      religion: text,
                    }))
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {profile.religion || "Not provided"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Contact Phone</Text>

              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={profile.emergencyPhone}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      emergencyPhone: text,
                    }))
                  }
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {profile.emergencyPhone || "Not provided"}
                </Text>
              )}
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Relationship</Text>

              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={profile.emergencyRelationship}
                  onChangeText={(text) =>
                    setProfile((prev) => ({
                      ...prev,
                      emergencyRelationship: text,
                    }))
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {profile.emergencyRelationship || "Not provided"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Save Button */}
        {isEditing && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
