import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
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
import { styles } from "../../styles/(counselor)/profile";

const AVAILABLE_SPECIALIZATIONS = [
  "Career Transitions",
  "Youth Mentorship",
  "Academic Stress",
  "Relationship Counseling",
  "Personal Growth",
  "Cognitive Behavioral (CBT)",
  "Systemic Therapy",
];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState(null);

  const [profile, setProfile] = useState({
    firstName: "",
    middleName: "",
    surname: "",
    email: "",
    phoneNo: "",
    altPhoneNo: "",
    role: "",
    age: "",
    yearsOfExperience: "",
    relationshipStatus: "",
    religion: "",
    gender: "",
    specializations: [],
    about: "",
    avatarUrl: null,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // ---------------------------------------------
      // 1. Get authenticated user
      // ---------------------------------------------
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Authentication error:", userError);
        Alert.alert("Error", userError.message);
        return;
      }

      if (!user) {
        Alert.alert(
          "Authentication Error",
          "User authentication failed. Please log in again.",
        );
        return;
      }

      setUserId(user.id);

      // ---------------------------------------------
      // 2. Fetch counselor profile
      // ---------------------------------------------
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);

        Alert.alert(
          "Error Loading Profile",
          error.message || "Could not load your profile.",
        );

        return;
      }

      // ---------------------------------------------
      // 3. Populate local profile state
      // ---------------------------------------------
      if (data) {
        setProfile({
          firstName: data.first_name || "",
          middleName: data.middle_name || "",
          surname: data.surname || "",

          email: data.email || user.email || "",

          phoneNo: data.phone_no || "",
          altPhoneNo: data.alt_phone_no || "",

          role: data.role || "Counselor",

          age:
            data.age !== null && data.age !== undefined ? String(data.age) : "",

          yearsOfExperience:
            data.years_of_experience !== null &&
            data.years_of_experience !== undefined
              ? String(data.years_of_experience)
              : "",

          relationshipStatus: data.relationship_status || "",

          religion: data.religion || "",

          gender: data.gender || "",

          specializations: Array.isArray(data.specializations)
            ? data.specializations
            : [],

          about: data.about || "",

          // Avatar URL stored in profiles table
          avatarUrl: data.avatar_url || null,
        });
      }
    } catch (err) {
      console.error("Unexpected profile error:", err);

      Alert.alert("Error", err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (first, last) => {
    const firstInitial = first ? first.trim().charAt(0).toUpperCase() : "";

    const lastInitial = last ? last.trim().charAt(0).toUpperCase() : "";

    return `${firstInitial}${lastInitial}` || "C";
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

      if (result.canceled || !result.assets || result.assets.length === 0) {
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
      setUploadingImage(true);

      // ---------------------------------------------
      // 1. Get authenticated user
      // ---------------------------------------------
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

      // ---------------------------------------------
      // 2. Make sure Base64 exists
      // ---------------------------------------------
      if (!asset.base64) {
        throw new Error("Image data is missing.");
      }

      // ---------------------------------------------
      // 3. Determine image extension
      // ---------------------------------------------
      let fileExt = asset.uri?.split(".").pop()?.toLowerCase() || "jpeg";

      if (fileExt === "jpg") {
        fileExt = "jpeg";
      }

      // Only allow supported image types
      if (!["jpeg", "png", "webp"].includes(fileExt)) {
        fileExt = "jpeg";
      }

      const contentType = `image/${fileExt}`;

      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      console.log("Uploading to:", fileName);
      console.log("Content type:", contentType);

      // ---------------------------------------------
      // 5. Convert Base64 to binary
      // ---------------------------------------------
      const fileData = decode(asset.base64);

      if (!fileData) {
        throw new Error("Could not decode image.");
      }

      // ---------------------------------------------
      // 6. Upload to avatars bucket
      // ---------------------------------------------
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

      // ---------------------------------------------
      // 7. Get public URL
      // ---------------------------------------------
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error("Could not generate public image URL.");
      }

      console.log("Public URL:", publicUrl);

      // ---------------------------------------------
      // 8. Save URL in profiles table
      // ---------------------------------------------
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

      // ---------------------------------------------
      // 9. Update local state
      // ---------------------------------------------
      setProfile((prev) => ({
        ...prev,
        avatarUrl: publicUrl,
      }));

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error("Upload error:", error);

      Alert.alert("Upload Failed", error?.message || "Could not upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleSpecialization = (item) => {
    setProfile((prev) => {
      const exists = prev.specializations.includes(item);
      const updated = exists
        ? prev.specializations.filter((s) => s !== item)
        : [...prev.specializations, item];
      return { ...prev, specializations: updated };
    });
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const fullName = [profile.firstName, profile.middleName, profile.surname]
        .filter(Boolean)
        .join(" ")
        .trim();

      const payload = {
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
        relationship_status: profile.relationshipStatus.trim() || null,
        religion: profile.religion.trim() || null,
        gender: profile.gender.trim() || null,
        specializations: profile.specializations,
        about: profile.about.trim() || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userId);

      if (error) {
        throw error;
      }

      setIsEditing(false);
      Alert.alert("Success", "Your profile information has been updated!");
    } catch (err) {
      Alert.alert("Save Failed", err.message || "Unable to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#E3562A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Counselor Profile</Text>
          <TouchableOpacity
            style={[
              styles.editToggleButton,
              isEditing && styles.saveToggleButton,
            ]}
            onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
          >
            <Ionicons
              name={isEditing ? "checkmark-sharp" : "create-outline"}
              size={18}
              color={isEditing ? "#FFFFFF" : "#E3562A"}
            />
            <Text
              style={isEditing ? styles.saveButtonText : styles.editButtonText}
            >
              {isEditing ? "Save" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Avatar & Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
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
              disabled={uploadingImage}
              activeOpacity={0.8}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={{ width: "100%", gap: 8, marginTop: 12 }}>
              <TextInput
                style={styles.input}
                value={profile.firstName}
                onChangeText={(text) =>
                  setProfile({ ...profile, firstName: text })
                }
                placeholder="First Name"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={styles.input}
                value={profile.middleName}
                onChangeText={(text) =>
                  setProfile({ ...profile, middleName: text })
                }
                placeholder="Middle Name (Optional)"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={styles.input}
                value={profile.surname}
                onChangeText={(text) =>
                  setProfile({ ...profile, surname: text })
                }
                placeholder="Surname"
                placeholderTextColor="#94A3B8"
              />
            </View>
          ) : (
            <Text style={styles.userName}>
              {[profile.firstName, profile.middleName, profile.surname]
                .filter(Boolean)
                .join(" ")}
            </Text>
          )}

          <Text style={styles.userRoleTag}>{profile.role}</Text>
        </View>

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Details</Text>

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

          <View style={styles.infoRow}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  value={profile.phoneNo}
                  onChangeText={(text) =>
                    setProfile({ ...profile, phoneNo: text })
                  }
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <Text style={styles.infoValue}>{profile.phoneNo || "N/A"}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#64748B"
              style={styles.infoIcon}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Alt Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  value={profile.altPhoneNo}
                  onChangeText={(text) =>
                    setProfile({ ...profile, altPhoneNo: text })
                  }
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.altPhoneNo || "N/A"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Personal & Professional Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal & Professional Details</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Age</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  value={profile.age}
                  onChangeText={(text) => setProfile({ ...profile, age: text })}
                  keyboardType="number-pad"
                  placeholder="Age"
                />
              ) : (
                <Text style={styles.infoValue}>{profile.age || "N/A"}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Years of Experience</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  value={profile.yearsOfExperience}
                  onChangeText={(text) =>
                    setProfile({ ...profile, yearsOfExperience: text })
                  }
                  keyboardType="number-pad"
                  placeholder="Years of Experience"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.yearsOfExperience || "N/A"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  value={profile.gender}
                  onChangeText={(text) =>
                    setProfile({ ...profile, gender: text })
                  }
                  placeholder="Gender"
                />
              ) : (
                <Text style={styles.infoValue}>{profile.gender || "N/A"}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Relationship Status</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  value={profile.relationshipStatus}
                  onChangeText={(text) =>
                    setProfile({ ...profile, relationshipStatus: text })
                  }
                  placeholder="Relationship Status"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.relationshipStatus || "N/A"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Religion</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, styles.inlineInput]}
                  value={profile.religion}
                  onChangeText={(text) =>
                    setProfile({ ...profile, religion: text })
                  }
                  placeholder="Religion"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.religion || "N/A"}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Specializations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Specializations</Text>
          <View style={styles.chipGrid}>
            {(isEditing
              ? AVAILABLE_SPECIALIZATIONS
              : profile.specializations
            ).map((spec, index) => {
              const isSelected = profile.specializations.includes(spec);
              return (
                <TouchableOpacity
                  key={index}
                  disabled={!isEditing}
                  onPress={() => toggleSpecialization(spec)}
                  style={[styles.chip, isSelected && styles.selectedChip]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.selectedChipText,
                    ]}
                  >
                    {spec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Biography */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About / Bio</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={profile.about}
              onChangeText={(text) => setProfile({ ...profile, about: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.bioText}>
              {profile.about || "No bio added yet."}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
