import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NOTIFICATION_TYPES, notifyAdmins } from "../../../libs/notifications";
import { supabase } from "../../../libs/supabase";
import { getFriendlyErrorMessage } from "../../components/errorHandler";
import { styles } from "../../styles/(auth)/signup";

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
  const [selectedRole, setSelectedRole] = useState("Client");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    surname: "",
    phoneNo: "",
    altPhoneNo: "",
    gender: "",
    age: "",
    county: "",
    relationshipStatus: "",
    religion: "",
    otherReligion: "",
    about: "",
    yearsOfExperience: "",
    specializations: ["", "", ""],
    emergencyPhone: "",
    emergencyRelationship: "",
  });

  const validateKenyanPhone = (phone) => {
    if (!phone) return { isValid: false, message: "Phone number is required." };
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

  // Query Supabase staff_whitelist table for role assignment
  const fetchWhitelistRole = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("staff_whitelist")
        .select("role")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (error) {
        console.error("Error querying whitelist:", error.message);
        setSelectedRole("Client");
        return "Client";
      }

      const assignedRole = data?.role ? data.role : "Client";
      setSelectedRole(assignedRole);
      return assignedRole;
    } catch (err) {
      console.error("Unexpected error querying whitelist:", err);
      setSelectedRole("Client");
      return "Client";
    } finally {
      setLoading(false);
    }
  };

  // Specialization handlers
  const updateSpecialization = (text, index) => {
    setFormData((prev) => {
      const updated = [...prev.specializations];
      updated[index] = text;
      return { ...prev, specializations: updated };
    });
  };

  const addSpecializationField = () => {
    setFormData((prev) => ({
      ...prev,
      specializations: [...prev.specializations, ""],
    }));
  };

  const removeSpecializationField = (index) => {
    setFormData((prev) => {
      if (prev.specializations.length <= 1) return prev;
      const updated = prev.specializations.filter((_, i) => i !== index);
      return { ...prev, specializations: updated };
    });
  };

  const validateStep1 = () => {
    if (
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      Alert.alert("Required Fields", "Please enter email and passwords.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert("Password Error", "Passwords do not match.");
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (
      !formData.firstName.trim() ||
      !formData.surname.trim() ||
      !formData.phoneNo.trim()
    ) {
      Alert.alert(
        "Required Fields",
        "Please enter First Name, Surname, and Phone Number.",
      );
      return false;
    }

    const phoneCheck = validateKenyanPhone(formData.phoneNo);
    if (!phoneCheck.isValid) {
      Alert.alert("Invalid Phone Number", phoneCheck.message);
      return false;
    }

    if (formData.altPhoneNo.trim()) {
      const altCheck = validateKenyanPhone(formData.altPhoneNo);
      if (!altCheck.isValid) {
        Alert.alert("Invalid Alternative Phone", altCheck.message);
        return false;
      }
    }

    if (selectedRole === "Counselor") {
      if (!formData.gender) {
        Alert.alert("Required Fields", "Please select your gender");
        return false;
      }

      if (!formData.yearsOfExperience.trim()) {
        Alert.alert(
          "Required Fields",
          "Please state your years of experience.",
        );
        return false;
      }
      const validSpecs = formData.specializations.filter(
        (s) => s.trim().length > 0,
      );
      if (validSpecs.length === 0) {
        Alert.alert(
          "Required Fields",
          "Please add at least one area of specialization.",
        );
        return false;
      }
    }

    if (selectedRole === "Client") {
      if (!formData.gender || !formData.age.trim() || !formData.county.trim()) {
        Alert.alert(
          "Required Fields",
          "Please fill in Gender, Age, and County.",
        );
        return false;
      }
    }

    return true;
  };

  const validateStep3 = () => {
    if (!formData.relationshipStatus || !formData.religion) {
      Alert.alert(
        "Required Fields",
        "Please select Relationship Status and Religion.",
      );
      return false;
    }

    if (formData.religion === "Other" && !formData.otherReligion.trim()) {
      Alert.alert("Required Fields", "Please specify your religion.");
      return false;
    }

    if (selectedRole === "Client") {
      if (
        !formData.emergencyPhone.trim() ||
        !formData.emergencyRelationship.trim()
      ) {
        Alert.alert(
          "Required Fields",
          "Please complete emergency contact details.",
        );
        return false;
      }
      const emergencyCheck = validateKenyanPhone(formData.emergencyPhone);
      if (!emergencyCheck.isValid) {
        Alert.alert("Invalid Emergency Phone", emergencyCheck.message);
        return false;
      }
    }

    if (selectedRole === "Counselor" || selectedRole === "Admin") {
      if (!formData.about.trim()) {
        Alert.alert(
          "Required Fields",
          "Please write a brief background description.",
        );
        return false;
      }
    }

    return true;
  };

  const buildProfilePayload = (userId, cleanEmail, fullName) => {
    const isClient = selectedRole === "Client";
    const isCounselor = selectedRole === "Counselor";
    const isAdmin = selectedRole === "Admin";

    const resolvedReligion =
      formData.religion === "Other"
        ? formData.otherReligion.trim()
        : formData.religion;

    const payload = {
      id: userId,
      email: cleanEmail,
      first_name: formData.firstName.trim(),
      middle_name: formData.middleName.trim() || null,
      surname: formData.surname.trim(),
      full_name: fullName,
      role: selectedRole,
      phone_no: formData.phoneNo.trim(),
      alt_phone_no: formData.altPhoneNo.trim() || null,
      relationship_status: formData.relationshipStatus,
      religion: resolvedReligion,

      // Clients are auto-approved; Counselors/Admins wait for admin review.
      approved: isClient,
      suspended: false,
    };

    if (isClient) {
      payload.gender = formData.gender;
      payload.age = formData.age ? parseInt(formData.age, 10) : null;
      payload.county = formData.county.trim();
      payload.emergency_phone = formData.emergencyPhone.trim();
      payload.emergency_relationship = formData.emergencyRelationship.trim();
    }

    if (isCounselor) {
      payload.age = formData.age ? parseInt(formData.age, 10) : null;
      payload.gender = formData.gender;
      payload.years_of_experience = formData.yearsOfExperience
        ? parseInt(formData.yearsOfExperience, 10)
        : null;
      payload.specializations = formData.specializations
        .map((s) => s.trim())
        .filter(Boolean);
      payload.about = formData.about.trim();
    }

    if (isAdmin) {
      payload.age = formData.age ? parseInt(formData.age, 10) : null;
      payload.about = formData.about.trim();
    }

    return payload;
  };

  const handleFinalSignup = async () => {
    setLoading(true);

    const cleanEmail = formData.email.trim().toLowerCase();
    const fullName = `${formData.firstName.trim()} ${
      formData.middleName.trim() ? formData.middleName.trim() + " " : ""
    }${formData.surname.trim()}`;

    try {
      // 1. Authenticate with Supabase Auth (Generates UUID)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
          },
        },
      });

      if (authError) {
        const friendlyMessage = getFriendlyErrorMessage(authError);
        Alert.alert("Registration Failed", friendlyMessage);
        return;
      }

      const userId = authData?.user?.id;

      if (!userId) {
        Alert.alert(
          "Registration Issue",
          "Could not verify user account creation. Please try logging in or contact support.",
        );
        return;
      }

      // 2. Save full profile data into public.profiles
      const profilePayload = buildProfilePayload(userId, cleanEmail, fullName);

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([profilePayload]);

      if (profileError) {
        const friendlyMessage = getFriendlyErrorMessage(profileError);
        Alert.alert("Profile Creation Issue", friendlyMessage);
        return;
      }

      // Alerts admin on new staff account for approval
      if (selectedRole !== "Client") {
        await notifyAdmins({
          type: NOTIFICATION_TYPES.COUNSELOR_SIGNUP,
          title: `New ${selectedRole} Signup`,
          body: `${fullName} signed up as ${selectedRole} and needs approval.`,
          data: { userId },
        });
      }

      // 3. Route to corresponding portal after successful signup
      Alert.alert(
        "Registration Successful",
        "Welcome to Nextstep! Your account has been created successfully.",
        [
          {
            text: "Proceed to Login",
            onPress: () => {
              router.replace("login");
            },
          },
        ],
      );
    } catch (err) {
      console.error("Unexpected Signup Error:", err);
      const friendlyMessage = getFriendlyErrorMessage(err);
      Alert.alert("Error", friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        await fetchWhitelistRole(formData.email);
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) {
        await handleFinalSignup();
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (router.canGoBack()) router.back();
      else router.navigate("/landing");
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
          <Text style={styles.subtitle}>
            Role Detected:{" "}
            <Text style={{ fontWeight: "700" }}>{selectedRole}</Text>
          </Text>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressStepText}>Step {currentStep} of 3</Text>
            <Text style={styles.progressTitleText}>
              {currentStep === 1
                ? "Credentials"
                : currentStep === 2
                  ? "Personal Information"
                  : "Profile & Background"}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(currentStep / 3) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* STEP 1: Account Credentials */}
        {currentStep === 1 && (
          <View style={styles.formGroup}>
            {/* Email */}
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

            {/* Password */}
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

            {/* Confirm Password */}
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

        {/* STEP 2: Personal Details */}
        {currentStep === 2 && (
          <View style={styles.formGroup}>
            <Text style={styles.sectionHeader}>Name Details</Text>
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>First Name</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#94A3B8"
                  value={formData.firstName}
                  onChangeText={(val) => updateField("firstName", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Middle Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Middle name (optional)"
                  placeholderTextColor="#94A3B8"
                  value={formData.middleName}
                  onChangeText={(val) => updateField("middleName", val)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Surname</Text>
                <Text style={styles.requiredStar}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Surname"
                  placeholderTextColor="#94A3B8"
                  value={formData.surname}
                  onChangeText={(val) => updateField("surname", val)}
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

            {(selectedRole === "Counselor" || selectedRole === "Admin") && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Alternative Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color="#64748B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="0787654321"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={formData.altPhoneNo}
                    onChangeText={(val) => updateField("altPhoneNo", val)}
                  />
                </View>
              </View>
            )}

            {selectedRole === "Counselor" && (
              <>
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
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            formData === item && styles.selectedChipText,
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
                    <Text style={styles.label}>Years of Experience</Text>
                    <Text style={styles.requiredStar}>*</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="briefcase-outline"
                      size={18}
                      color="#64748B"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 5"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={formData.yearsOfExperience}
                      onChangeText={(val) =>
                        updateField("yearsOfExperience", val)
                      }
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.labelRowBetween}>
                    <Text style={styles.label}>Areas of Specialization</Text>
                    <TouchableOpacity
                      onPress={addSpecializationField}
                      style={styles.addSpecButton}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="#E3562A"
                      />
                      <Text style={styles.addSpecText}>Add More</Text>
                    </TouchableOpacity>
                  </View>

                  {formData.specializations.map((spec, idx) => (
                    <View key={`spec-${idx}`} style={styles.specInputRow}>
                      <View style={[styles.inputWrapper, { flex: 1 }]}>
                        <TextInput
                          style={styles.input}
                          placeholder={`Specialization ${idx + 1}`}
                          placeholderTextColor="#94A3B8"
                          value={spec}
                          onChangeText={(text) =>
                            updateSpecialization(text, idx)
                          }
                        />
                      </View>
                      {formData.specializations.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeSpecializationField(idx)}
                          style={styles.removeSpecButton}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#DC2626"
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {selectedRole === "Client" && (
              <>
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
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Nairobi, Meru"
                      placeholderTextColor="#94A3B8"
                      value={formData.county}
                      onChangeText={(val) => updateField("county", val)}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* STEP 3: Background Details */}
        {currentStep === 3 && (
          <View style={styles.formGroup}>
            {(selectedRole === "Counselor" || selectedRole === "Admin") && (
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Age</Text>
                  <Text style={styles.requiredStar}>*</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 35"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={formData.age}
                    onChangeText={(val) => updateField("age", val)}
                  />
                </View>
              </View>
            )}

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

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Religion</Text>
                <Text style={styles.requiredStar}>*</Text>
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
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Specify Religion"
                    placeholderTextColor="#94A3B8"
                    value={formData.otherReligion}
                    onChangeText={(val) => updateField("otherReligion", val)}
                  />
                </View>
              </View>
            )}

            {(selectedRole === "Counselor" || selectedRole === "Admin") && (
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>About / Bio</Text>
                  <Text style={styles.requiredStar}>*</Text>
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    { height: 100, alignItems: "flex-start", paddingTop: 10 },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { textAlignVertical: "top" }]}
                    placeholder="Describe yourself and professional background..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    value={formData.about}
                    onChangeText={(val) => updateField("about", val)}
                  />
                </View>
              </View>
            )}

            {selectedRole === "Client" && (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Emergency Contact Phone</Text>
                    <Text style={styles.requiredStar}>*</Text>
                  </View>
                  <View style={styles.inputWrapper}>
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
                    <Text style={styles.label}>
                      Emergency Contact Relationship
                    </Text>
                    <Text style={styles.requiredStar}>*</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Parent, Sibling"
                      placeholderTextColor="#94A3B8"
                      value={formData.emergencyRelationship}
                      onChangeText={(val) =>
                        updateField("emergencyRelationship", val)
                      }
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={handlePrev}
              disabled={loading}
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
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? "Create Account" : "Continue"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
