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
import { styles } from "../../styles/(admin)/profile";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "Alex",
    middleName: "Kip",
    surname: "Njuguna",
    email: "admin.alex@nextstephub.com",
    phone: "+254 712 345 678",
    altPhone: "+254 798 765 432",
    relationshipStatus: "Single",
    religion: "Christianity",
    bio: "Head Administrator overseeing platform security, program scheduling, and counselor onboarding for NextStep Hub.",
    profileImageUri: null,
  });

  const getInitials = (first, middle, surname) => {
    const f = first ? first.trim().charAt(0).toUpperCase() : "";
    const s = surname ? surname.trim().charAt(0).toUpperCase() : "";
    return `${f}${s}` || "A";
  };

  const handlePickImage = async () => {
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

  const handleSaveProfile = () => {
    setIsEditing(false);
    Alert.alert("Success", "Admin profile updated successfully!");
  };

  const fullName = [profile.firstName, profile.middleName, profile.surname]
    .filter(Boolean)
    .join(" ");

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
          >
            <Ionicons
              name={isEditing ? "checkmark-sharp" : "create-outline"}
              size={18}
              color={isEditing ? "#FFFFFF" : "#1E3A8A"}
            />
            <Text
              style={isEditing ? styles.saveButtonText : styles.editButtonText}
            >
              {isEditing ? "Save" : "Edit"}
            </Text>
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
                  {getInitials(
                    profile.firstName,
                    profile.middleName,
                    profile.surname,
                  )}
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

          {!isEditing && <Text style={styles.userName}>{fullName}</Text>}
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
                  setProfile({ ...profile, firstName: text })
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
                  setProfile({ ...profile, middleName: text })
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
                  setProfile({ ...profile, surname: text })
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
                    setProfile({ ...profile, phone: text })
                  }
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{profile.phone}</Text>
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
                    setProfile({ ...profile, altPhone: text })
                  }
                  keyboardType="phone-pad"
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
          <Text style={styles.cardTitle}>Personal Details</Text>

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
                    setProfile({ ...profile, relationshipStatus: text })
                  }
                  placeholder="e.g. Single, Married"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile.relationshipStatus}
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
                    setProfile({ ...profile, religion: text })
                  }
                  placeholder="e.g. Christianity, Islam, Other"
                />
              ) : (
                <Text style={styles.infoValue}>{profile.religion}</Text>
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
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Write a brief bio..."
            />
          ) : (
            <Text style={styles.bioText}>{profile.bio}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
