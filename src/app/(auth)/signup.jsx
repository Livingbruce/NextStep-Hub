import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../../styles/(auth)/signup";

const TOTAL_STEPS = 3;

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

const RELATIONSHIP_OPTIONS = [
  "Single",
  "Married",
  "Dating (In a relationship)",
  "Divorced",
  "Separated",
  "Widowed",
  "Prefer not to say",
];

const RELIGION_OPTIONS = [
  "Christian",
  "Islam",
  "Hinduism",
  "Other",
  "Prefer not to say",
];

export default function SignupScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNo: "",
    gender: "",
    age: "",
    county: "",
    relationshipStatus: "",
    religion: "",
    otherReligion: "",
    emergencyPhone: "",
    emergencyRelationship: "",
  });

  const validateKenyanPhone = (phone) => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

    const kenyanPhoneRegex = /^(?:(?:\+?254)|0)?([71]\d{8})$/;

    if (!kenyanPhoneRegex.test(cleanPhone)) {
      return {
        isValid: false,
        message:
          "Invalid phone number. Must start with 07, 01, or +254 followed by 8 digits.",
      };
    }

    return { isValid: true };
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (
        !formData.fullName.trim() ||
        !formData.email.trim() ||
        !formData.password ||
        !formData.confirmPassword ||
        !formData.phoneNo.trim()
      ) {
        Alert.alert("Required Fields", "Please complete all required fields.");
        return false;
      }

      const phoneCheck = validateKenyanPhone(formData.phoneNo);
      if (!phoneCheck.isValid) {
        Alert.alert("Invalid Phone Number", phoneCheck.message);
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert("Password Error", "Passwords do not match.");
        return false;
      }
    } else if (currentStep === 2) {
      if (
        !formData.gender ||
        !formData.age.trim() ||
        !formData.county.trim() ||
        !formData.relationshipStatus
      ) {
        Alert.alert("Required Fields", "Please complete all required fields.");
        return false;
      }
    } else if (currentStep === 3) {
      if (
        !formData.religion ||
        (formData.religion === "Other" && !formData.otherReligion.trim()) ||
        !formData.emergencyPhone.trim() ||
        !formData.emergencyRelationship.trim()
      ) {
        Alert.alert("Required Fields", "Please complete all required fields.");
        return false;
      }

      const emergencyPhoneCheck = validateKenyanPhone(formData.emergencyPhone);
      if (!emergencyPhoneCheck.isValid) {
        Alert.alert("Invalid Emergency Contact", emergencyPhoneCheck.message);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    } else {
      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.navigate("/landing");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePrev}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join NextStep Hub today</Text>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressStepText}>
              Step {currentStep} of {TOTAL_STEPS}
            </Text>
            <Text style={styles.progressTitleText}>
              {currentStep === 1
                ? "Account Info"
                : currentStep === 2
                  ? "Personal Profile"
                  : "Background & Emergency"}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(currentStep / TOTAL_STEPS) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* STEP 1: Account Information */}
        {currentStep === 1 && (
          <View style={styles.formGroup}>
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Full Name</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="First, middle & surname"
                  placeholderTextColor="#94A3B8"
                  value={formData.fullName}
                  onChangeText={(val) => updateField("fullName", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Email Address</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => updateField("email", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Phone Number</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="0712345678"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={formData.phoneNo}
                  onChangeText={(val) => updateField("phoneNo", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(val) => updateField("password", val)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Confirm Password</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  value={formData.confirmPassword}
                  onChangeText={(val) => updateField("confirmPassword", val)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Personal Info */}
        {currentStep === 2 && (
          <View style={styles.formGroup}>
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Gender</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.optionsGrid}>
                {GENDER_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      formData.gender === item && styles.selectedChip,
                    ]}
                    onPress={() => updateField("gender", item)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.gender === item && styles.selectedChipText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Age</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 21"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={formData.age}
                  onChangeText={(val) => updateField("age", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>County of Residence</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Nairobi, Meru, Kiambu"
                  placeholderTextColor="#94A3B8"
                  value={formData.county}
                  onChangeText={(val) => updateField("county", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Relationship Status</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.optionsGrid}>
                {RELATIONSHIP_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      formData.relationshipStatus === item &&
                        styles.selectedChip,
                    ]}
                    onPress={() => updateField("relationshipStatus", item)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.relationshipStatus === item &&
                          styles.selectedChipText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* STEP 3: Religion & Emergency Contact */}
        {currentStep === 3 && (
          <View style={styles.formGroup}>
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Religion</Text>
              </View>
              <View style={styles.optionsGrid}>
                {RELIGION_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.chip,
                      formData.religion === item && styles.selectedChip,
                    ]}
                    onPress={() => updateField("religion", item)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.religion === item && styles.selectedChipText,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {formData.religion === "Other" && (
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Specify Religion</Text>
                  <Text style={styles.requiredStar}>*</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="book-outline"
                    size={18}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter religion"
                    placeholderTextColor="#94A3B8"
                    value={formData.otherReligion}
                    onChangeText={(val) => updateField("otherReligion", val)}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Emergency Contact Phone</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="0712345678"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={formData.emergencyPhone}
                  onChangeText={(val) => updateField("emergencyPhone", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Relationship with Contact</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color="#64748B"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Parent, Sibling, Friend"
                  placeholderTextColor="#94A3B8"
                  value={formData.emergencyRelationship}
                  onChangeText={(val) =>
                    updateField("emergencyRelationship", val)
                  }
                />
              </View>
            </View>
          </View>
        )}

        {/* Step Navigation Actions */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={handlePrev}
              activeOpacity={0.8}
            >
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === 1 && styles.fullWidthButton,
            ]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === TOTAL_STEPS ? "Create Account" : "Continue"}
            </Text>
            <Ionicons
              name={currentStep === TOTAL_STEPS ? "checkmark" : "arrow-forward"}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
