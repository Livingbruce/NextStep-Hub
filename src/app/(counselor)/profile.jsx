import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(counselor)/profile";

const AVAILABLE_STYLES = [
  "Cognitive Behavioral (CBT)",
  "Person-Centered",
  "Systemic",
  "Psychodynamic",
  "Solution-Focused",
];

const AVAILABLE_FOCUS_AREAS = [
  "Career Transitions",
  "Youth Mentorship",
  "Academic Stress",
  "Relationship Counseling",
  "Personal Growth",
];

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  // Profile Form Data & Verification States
  const [profile, setProfile] = useState({
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah.jenkins@example.com",
    isEmailVerified: true,
    phone: "+254 712 345 678",
    isPhoneVerified: false,
    role: "Professional Counselor",
    relationshipStyles: [
      "Cognitive Behavioral (CBT)",
      "Person-Centered",
      "Systemic",
    ],
    focusAreas: ["Career Transitions", "Youth Mentorship", "Academic Stress"],
    bio: "Dedicated career and life counselor with over 5 years of experience helping young adults navigate education, personal growth, and professional transitions.",
    profileImageUri: null,
  });

  // Initials fallback generator
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName
      ? firstName.trim().charAt(0).toUpperCase()
      : "";
    const lastInitial = lastName ? lastName.trim().charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}` || "C";
  };

  // Image Picker Handler
  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to change your profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfile((prev) => ({
        ...prev,
        profileImageUri: result.assets[0].uri,
      }));
    }
  };

  // Toggle Chip Selections
  const toggleSelection = (key, item) => {
    setProfile((prev) => {
      const exists = prev[key].includes(item);
      const updatedList = exists
        ? prev[key].filter((i) => i !== item)
        : [...prev[key], item];
      return { ...prev, [key]: updatedList };
    });
  };

  // Trigger verification handlers
  const handleVerifyField = (field) => {
    if (field === "email") {
      Alert.alert(
        "Verification Email Sent",
        `A verification link has been sent to ${profile.email}. Please check your inbox.`,
      );
    } else if (field === "phone") {
      Alert.alert(
        "Verification Code Sent",
        `An OTP code has been sent to ${profile.phone}.`,
      );
    }
  };

  // Save changes handler
  const handleSaveProfile = () => {
    setIsEditing(false);
    Alert.alert("Success", "Your profile information has been updated!");
  };

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
            {profile.profileImageUri ? (
              <Image
                source={{ uri: profile.profileImageUri }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {getInitials(profile.firstName, profile.lastName)}
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

          {isEditing ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={[styles.input, styles.nameInput]}
                value={profile.firstName}
                onChangeText={(text) =>
                  setProfile({ ...profile, firstName: text })
                }
                placeholder="First Name"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={[styles.input, styles.nameInput]}
                value={profile.lastName}
                onChangeText={(text) =>
                  setProfile({ ...profile, lastName: text })
                }
                placeholder="Last Name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          ) : (
            <Text style={styles.userName}>
              {profile.firstName} {profile.lastName}
            </Text>
          )}

          <Text style={styles.userRoleTag}>{profile.role}</Text>
        </View>

        {/* Contact Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Details</Text>

          {/* Email Row */}
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
            {profile.isEmailVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => handleVerifyField("email")}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          {/* Phone Row */}
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
                  value={profile.phone}
                  onChangeText={(text) =>
                    setProfile({ ...profile, phone: text })
                  }
                  keyboardType="phone-pad"
                  placeholderTextColor="#94A3B8"
                />
              ) : (
                <Text style={styles.infoValue}>{profile.phone}</Text>
              )}
            </View>
            {profile.isPhoneVerified ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={() => handleVerifyField("phone")}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Counseling & Relationship Styles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Counseling & Relationship Styles</Text>
          <View style={styles.chipGrid}>
            {(isEditing ? AVAILABLE_STYLES : profile.relationshipStyles).map(
              (style, index) => {
                const isSelected = profile.relationshipStyles.includes(style);
                return (
                  <TouchableOpacity
                    key={index}
                    disabled={!isEditing}
                    onPress={() => toggleSelection("relationshipStyles", style)}
                    style={[styles.chip, isSelected && styles.selectedChip]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.selectedChipText,
                      ]}
                    >
                      {style}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>
        </View>

        {/* Focus Areas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Focus Areas & Expertise</Text>
          <View style={styles.chipGrid}>
            {(isEditing ? AVAILABLE_FOCUS_AREAS : profile.focusAreas).map(
              (area, index) => {
                const isSelected = profile.focusAreas.includes(area);
                return (
                  <TouchableOpacity
                    key={index}
                    disabled={!isEditing}
                    onPress={() => toggleSelection("focusAreas", area)}
                    style={[styles.chip, isSelected && styles.selectedChip]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.selectedChipText,
                      ]}
                    >
                      {area}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>
        </View>

        {/* Biography */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About / Bio</Text>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.bioText}>{profile.bio}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
