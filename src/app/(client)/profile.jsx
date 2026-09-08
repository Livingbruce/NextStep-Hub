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
import { styles } from "../../styles/(client)/Profile";

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);

  // User profile state
  const [userData, setUserData] = useState({
    fullName: "John Kamau",
    email: "john.kamau@example.com",
    isEmailVerified: false,
    phoneNo: "0712345678",
    isPhoneVerified: false,
    gender: "Male",
    age: "24",
    county: "Nairobi",
    relationshipStatus: "Single",
    religion: "Christian",
    emergencyPhone: "0787654321",
    emergencyRelationship: "Parent",
  });

  // Temporary state while editing
  const [editData, setEditData] = useState({ ...userData });

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0][0]?.toUpperCase() || "?";
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "Permission to access camera roll is required!",
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
      setProfileImage(result.assets[0].uri);
      setImageError(false);
    }
  };

  const handleVerifyEmail = () => {
    Alert.alert(
      "Verify Email",
      `A verification link has been sent to ${userData.email}.`,
    );
  };

  const handleVerifyPhone = () => {
    Alert.alert(
      "Verify Phone Number",
      `A verification code (OTP) has been sent via SMS to ${userData.phoneNo}.`,
    );
  };

  const handleSaveProfile = () => {
    if (
      !editData.fullName.trim() ||
      !editData.email.trim() ||
      !editData.phoneNo.trim()
    ) {
      Alert.alert(
        "Error",
        "Full Name, Email, and Phone Number cannot be empty.",
      );
      return;
    }

    setUserData({ ...editData });
    setIsEditing(false);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditData({ ...userData });
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Edit/Save Actions */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editHeaderBtn}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={18} color="#16A34A" />
              <Text style={styles.editHeaderBtnText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.cancelHeaderBtn}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelHeaderBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Avatar Section */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            {profileImage && !imageError ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitialsText}>
                  {getInitials(
                    isEditing ? editData.fullName : userData.fullName,
                  )}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <TextInput
              style={styles.inputName}
              value={editData.fullName}
              onChangeText={(text) =>
                setEditData({ ...editData, fullName: text })
              }
              placeholder="Full Name"
              placeholderTextColor="#94A3B8"
            />
          ) : (
            <Text style={styles.userName}>{userData.fullName}</Text>
          )}
          <Text style={styles.userRole}>Youth Client</Text>
        </View>

        {/* Section: Account & Verification */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          {/* Email Row */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={editData.email}
                  onChangeText={(text) =>
                    setEditData({ ...editData, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.fieldValue}>{userData.email}</Text>
              )}
            </View>
            {!isEditing &&
              (userData.isEmailVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={handleVerifyEmail}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verifyBtnText}>Verify</Text>
                </TouchableOpacity>
              ))}
          </View>

          <View style={styles.divider} />

          {/* Phone Row */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldInfo}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={editData.phoneNo}
                  onChangeText={(text) =>
                    setEditData({ ...editData, phoneNo: text })
                  }
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{userData.phoneNo}</Text>
              )}
            </View>
            {!isEditing &&
              (userData.isPhoneVerified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={handleVerifyPhone}
                  activeOpacity={0.8}
                >
                  <Text style={styles.verifyBtnText}>Verify</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        {/* Section: Personal Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Gender</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={editData.gender}
                  onChangeText={(text) =>
                    setEditData({ ...editData, gender: text })
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>{userData.gender}</Text>
              )}
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Age</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={editData.age}
                  onChangeText={(text) =>
                    setEditData({ ...editData, age: text })
                  }
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.fieldValue}>{userData.age} years</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>County</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={editData.county}
                  onChangeText={(text) =>
                    setEditData({ ...editData, county: text })
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>{userData.county}</Text>
              )}
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Relationship Status</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={editData.relationshipStatus}
                  onChangeText={(text) =>
                    setEditData({ ...editData, relationshipStatus: text })
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {userData.relationshipStatus}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Religion</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={editData.religion}
                  onChangeText={(text) =>
                    setEditData({ ...editData, religion: text })
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>{userData.religion}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Section: Emergency Contact */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Contact Phone</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={editData.emergencyPhone}
                  onChangeText={(text) =>
                    setEditData({ ...editData, emergencyPhone: text })
                  }
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{userData.emergencyPhone}</Text>
              )}
            </View>

            <View style={styles.gridItem}>
              <Text style={styles.fieldLabel}>Relationship</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={editData.emergencyRelationship}
                  onChangeText={(text) =>
                    setEditData({ ...editData, emergencyRelationship: text })
                  }
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {userData.emergencyRelationship}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Save Button in Edit Mode */}
        {isEditing && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProfile}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
