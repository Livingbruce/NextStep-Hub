import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutRight,
  FadeOutUp,
  LinearTransition,
  SlideInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../../../libs/supabase";
import { getFriendlyErrorMessage } from "../../components/errorHandler";
import AuroraBlobs from "../../components/landing/AuroraBlobs";
import FloatingInput from "../../components/landing/floatingInput";
import ShimmerButton from "../../components/landing/Shimmerbutton";
import PasswordStrength from "../../components/signup/PasswordStrength";
import SelectChip from "../../components/signup/SelectChip";
import StepIndicator from "../../components/signup/StepIndicator";
import SuccessView from "../../components/signup/SuccessView";
import { ACCENT, styles } from "../../styles/(auth)/signup";

const SUPPORT_EMAIL = "support@nextstep.org";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const ROLE_ICON = {
  Client: "school-outline",
  Counselor: "people-outline",
  Admin: "shield-checkmark-outline",
};

const digitsOnly = (v) => v.replace(/[^0-9]/g, "");
const phoneChars = (v) => v.replace(/[^0-9+\s\-()]/g, "");

const validateKenyanPhone = (phone) => {
  if (!phone) return { isValid: false, message: "Enter your phone number." };
  const clean = phone.replace(/[\s\-()]/g, "");
  if (!/^(?:(?:\+?254)|0)?([71]\d{8})$/.test(clean)) {
    return {
      isValid: false,
      message: "Use a Kenyan number starting with 07, 01 or +254.",
    };
  }
  return { isValid: true };
};

const fieldOrder = (step, role, religion) => {
  if (step === 1) return ["email", "password", "confirmPassword"];
  if (step === 2) {
    const base = ["firstName", "middleName", "surname", "phoneNo"];
    if (role === "Client") return [...base, "age", "county"];
    if (role === "Counselor")
      return [...base, "altPhoneNo", "yearsOfExperience"];
    return [...base, "altPhoneNo"];
  }
  const list = role === "Client" ? [] : ["age"];
  if (religion === "Other") list.push("otherReligion");
  if (role === "Client") list.push("emergencyPhone", "emergencyRelationship");
  else list.push("about");
  return list;
};

const initialForm = {
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
  specializations: [
    { id: 1, text: "" },
    { id: 2, text: "" },
    { id: 3, text: "" },
  ],
  emergencyPhone: "",
  emergencyRelationship: "",
};

/* ------------------------- small presentational bits ------------------------- */

function Field({ error, children }) {
  return (
    <View>
      {children}
      {!!error && (
        <Animated.Text
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.fieldError}
        >
          {error}
        </Animated.Text>
      )}
    </View>
  );
}

function ChipGroup({
  label,
  required,
  options,
  value,
  onChange,
  error,
  disabled,
}) {
  return (
    <View>
      <View style={styles.groupLabelRow}>
        <Text style={styles.groupLabel}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      </View>
      <View style={styles.chipsGrid}>
        {options.map((o) => (
          <SelectChip
            key={o}
            label={o}
            selected={value === o}
            onPress={() => onChange(o)}
            disabled={disabled}
          />
        ))}
      </View>
      {!!error && (
        <Animated.Text
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.fieldError}
        >
          {error}
        </Animated.Text>
      )}
    </View>
  );
}

/* ---------------------------------- screen ---------------------------------- */

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("Client");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null); // { message, action }
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const scrollRef = useRef(null);
  const inputRefs = useRef({});
  const transitioning = useRef(false);
  const specCounter = useRef(3);

  const isTablet = Math.min(width, height) >= 600;
  const sideInsets = {
    paddingLeft: Math.max(insets.left, 0) + 24,
    paddingRight: Math.max(insets.right, 0) + 24,
  };

  /* ---- header collapse while the keyboard is open ---- */
  const headerFull = insets.top + 136;
  const headerCompact = insets.top + 64;
  const collapse = useSharedValue(0);
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s = Keyboard.addListener(showEvt, () => {
      setKeyboardOpen(true);
      collapse.set(withTiming(1, { duration: 250 }));
    });
    const h = Keyboard.addListener(hideEvt, () => {
      setKeyboardOpen(false);
      collapse.set(withTiming(0, { duration: 250 }));
    });
    return () => {
      s.remove();
      h.remove();
    };
  }, [collapse]);

  const headerStyle = useAnimatedStyle(() => ({
    height: interpolate(collapse.get(), [0, 1], [headerFull, headerCompact]),
  }));
  const stepperStyle = useAnimatedStyle(() => ({
    opacity: 1 - collapse.get(),
  }));

  /* ---- step slide transition ---- */
  const slide = useSharedValue(0);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.abs(slide.get()),
    transform: [{ translateX: -slide.get() * 36 }],
  }));

  const goToStep = (next, after) => {
    if (transitioning.current || next === step) return;
    transitioning.current = true;
    const dir = next > step ? 1 : -1;
    Keyboard.dismiss();
    slide.set(
      withTiming(dir, { duration: 160, easing: Easing.in(Easing.quad) }),
    );
    setTimeout(() => {
      setStep(next);
      setErrors({});
      setFormError(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      slide.set(-dir);
      slide.set(
        withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
      );
      transitioning.current = false;
      after?.();
    }, 170);
  };

  /* ---- shake on error ---- */
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.get() }],
  }));

  const fail = (fieldErrors, form = null) => {
    setErrors(fieldErrors);
    setFormError(typeof form === "string" ? { message: form } : form);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {},
    );
    shake.set(
      withSequence(
        withTiming(-10, { duration: 60 }),
        withRepeat(withTiming(10, { duration: 110 }), 4, true),
        withTiming(0, { duration: 60 }),
      ),
    );
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  /* ---- Android hardware back moves one step back ---- */
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!done && step > 1) {
        goToStep(step - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done]);

  /* ---- form helpers ---- */
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (formError) setFormError(null);
  };

  const updateSpecialization = (id, text) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.map((s) =>
        s.id === id ? { ...s, text } : s,
      ),
    }));
    if (errors.specializations)
      setErrors((p) => ({ ...p, specializations: undefined }));
  };

  const addSpecialization = () => {
    if (formData.specializations.length >= 8) return;
    Haptics.selectionAsync().catch(() => {});
    specCounter.current += 1;
    const id = specCounter.current;
    setFormData((prev) => ({
      ...prev,
      specializations: [...prev.specializations, { id, text: "" }],
    }));
  };

  const removeSpecialization = (id) => {
    Haptics.selectionAsync().catch(() => {});
    setFormData((prev) =>
      prev.specializations.length <= 1
        ? prev
        : {
            ...prev,
            specializations: prev.specializations.filter((s) => s.id !== id),
          },
    );
  };

  const focusNext = (name) => {
    const order = fieldOrder(step, selectedRole, formData.religion);
    const next = order[order.indexOf(name) + 1];
    if (next && inputRefs.current[next]) inputRefs.current[next].focus();
    else Keyboard.dismiss();
  };

  /* ---- role detection via staff whitelist ---- */
  const fetchWhitelistRole = async (email) => {
    const { data, error } = await supabase
      .from("staff_whitelist")
      .select("role")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (error) throw error;
    const role = data?.role || "Client";
    setSelectedRole(role);
    return role;
  };

  /* ---- validation (returns { field: message }) ---- */
  const validateStep = (n) => {
    const f = formData;
    const e = {};
    const isClient = selectedRole === "Client";
    const isCounselor = selectedRole === "Counselor";
    const isStaff = !isClient;

    if (n === 1) {
      const email = f.email.trim();
      if (!email) e.email = "Enter your email address.";
      else if (!EMAIL_REGEX.test(email))
        e.email = "That doesn't look like a valid email address.";
      if (!f.password) e.password = "Create a password.";
      else if (f.password.length < 6) e.password = "Use at least 6 characters.";
      if (!f.confirmPassword) e.confirmPassword = "Re-enter your password.";
      else if (f.password !== f.confirmPassword)
        e.confirmPassword = "Passwords don't match.";
    }

    if (n === 2) {
      if (!f.firstName.trim()) e.firstName = "Enter your first name.";
      if (!f.surname.trim()) e.surname = "Enter your surname.";
      const phone = validateKenyanPhone(f.phoneNo.trim());
      if (!phone.isValid) e.phoneNo = phone.message;
      if (isStaff && f.altPhoneNo.trim()) {
        const alt = validateKenyanPhone(f.altPhoneNo.trim());
        if (!alt.isValid) e.altPhoneNo = alt.message;
      }
      if (isCounselor) {
        if (!f.gender) e.gender = "Please choose an option.";
        if (!f.yearsOfExperience)
          e.yearsOfExperience = "Enter your years of experience.";
        else if (parseInt(f.yearsOfExperience, 10) > 60)
          e.yearsOfExperience = "That looks too high, please check.";
        if (!f.specializations.some((s) => s.text.trim())) {
          e.specializations = "Add at least one area of specialization.";
        }
      }
      if (isClient) {
        if (!f.gender) e.gender = "Please choose an option.";
        const age = parseInt(f.age, 10);
        if (!f.age) e.age = "Enter your age.";
        else if (age < 10 || age > 100) e.age = "Enter a valid age.";
        if (!f.county.trim()) e.county = "Enter your county.";
      }
    }

    if (n === 3) {
      if (!f.relationshipStatus)
        e.relationshipStatus = "Please choose an option.";
      if (!f.religion) e.religion = "Please choose an option.";
      else if (f.religion === "Other" && !f.otherReligion.trim())
        e.otherReligion = "Please specify your religion.";

      if (isClient) {
        const ep = validateKenyanPhone(f.emergencyPhone.trim());
        if (!ep.isValid) e.emergencyPhone = ep.message;
        if (!f.emergencyRelationship.trim())
          e.emergencyRelationship = "Who is this person to you? (e.g. Parent)";
      } else {
        const age = parseInt(f.age, 10);
        if (!f.age) e.age = "Enter your age.";
        else if (age < 18 || age > 100)
          e.age = "Enter a valid age (18 or older).";
        if (!f.about.trim())
          e.about = "Write a short background about yourself.";
      }
    }
    return e;
  };

  /* ---- submit ---- */
  const buildProfilePayload = (userId, cleanEmail, fullName) => {
    const isClient = selectedRole === "Client";
    const isCounselor = selectedRole === "Counselor";
    const isAdmin = selectedRole === "Admin";
    const religion =
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
      religion,
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
        .map((s) => s.text.trim())
        .filter(Boolean);
      payload.about = formData.about.trim();
    }
    if (isAdmin) {
      payload.age = formData.age ? parseInt(formData.age, 10) : null;
      payload.about = formData.about.trim();
    }
    return payload;
  };

  const handleSignupError = (err) => {
    console.error("Signup error:", err); // for developers only

    const exists =
      err?.name === "USER_EXISTS" ||
      err?.code === "user_already_exists" ||
      /already registered|already exists/i.test(err?.message || "");

    if (exists) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
      goToStep(1, () => {
        setErrors({ email: "An account with this email already exists." });
        setFormError({
          message:
            "Looks like you already have an account. Try signing in instead.",
          action: "login",
        });
      });
      return;
    }

    const friendly = getFriendlyErrorMessage(err);
    // errorHandler falls back to the raw message for unknown errors; never show that.
    const message =
      err?.name === "NO_USER_ID" || friendly === err?.message
        ? `We couldn't finish creating your account. Please try again, or contact ${SUPPORT_EMAIL} if it continues.`
        : friendly;
    fail(
      {},
      {
        message,
        action: /permission|support/i.test(message) ? "support" : undefined,
      },
    );
  };

  const handleFinalSignup = async () => {
    setLoading(true);
    const cleanEmail = formData.email.trim().toLowerCase();
    const fullName = [formData.firstName, formData.middleName, formData.surname]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password,
        options: { data: { full_name: fullName, role: selectedRole } },
      });
      if (authError) throw authError;

      // With email confirmation on, Supabase hides duplicates by returning a user with no identities.
      if (
        authData?.user &&
        Array.isArray(authData.user.identities) &&
        authData.user.identities.length === 0
      ) {
        const dup = new Error("User already registered");
        dup.name = "USER_EXISTS";
        throw dup;
      }

      const userId = authData?.user?.id;
      if (!userId) {
        const missing = new Error("No user id returned");
        missing.name = "NO_USER_ID";
        throw missing;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([buildProfilePayload(userId, cleanEmail, fullName)]);
      if (profileError) {
        await supabase.auth.signOut().catch(() => {});
        throw profileError;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      Keyboard.dismiss();
      setDone(true);
    } catch (err) {
      handleSignupError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (loading || transitioning.current) return;

    const found = validateStep(step);
    if (Object.keys(found).length) {
      fail(found, "Please check the highlighted fields.");
      return;
    }

    if (step === 1) {
      setLoading(true);
      try {
        await fetchWhitelistRole(formData.email);
        goToStep(2);
      } catch (err) {
        console.error("Whitelist check error:", err);
        // Don't silently sign a staff member up as a client.
        fail(
          {},
          "We couldn't verify your email right now. Check your internet connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      goToStep(3);
    } else {
      await handleFinalSignup();
    }
  };

  const handleBack = () => {
    if (step > 1) goToStep(step - 1);
    else if (router.canGoBack()) router.back();
    else router.replace("/(auth)/landing");
  };

  const goToLogin = () => router.replace("/(auth)/login");

  /* ---- step content ---- */
  const isClient = selectedRole === "Client";
  const isCounselor = selectedRole === "Counselor";

  const META = {
    1: {
      title: "Create your account",
      subtitle: "Start with your email and a secure password.",
    },
    2: {
      title: isClient ? "Tell us about you" : "Your details",
      subtitle: isClient
        ? "So your mentor knows who they're helping."
        : "Your professional details for the NextStep team.",
    },
    3: {
      title: "Almost there",
      subtitle: isClient
        ? "A few last details, plus an emergency contact."
        : "Share a little about your background.",
    },
  };

  const renderStep = () => {
    let i = 0;
    const item = (key, node) => (
      <Animated.View
        key={key}
        entering={FadeInDown.delay(60 + i++ * 45).duration(350)}
        exiting={FadeOut.duration(150)}
        layout={LinearTransition.duration(250)}
      >
        {node}
      </Animated.View>
    );

    const order = fieldOrder(step, selectedRole, formData.religion);

    const textField = (name, label, icon, opts = {}) => {
      const { filter, right, ...props } = opts;
      const isLast = order[order.length - 1] === name;
      return item(
        name,
        <Field error={errors[name]}>
          <FloatingInput
            inputRef={(r) => {
              inputRefs.current[name] = r;
            }}
            label={label}
            icon={icon}
            value={formData[name]}
            onChangeText={(v) => updateField(name, filter ? filter(v) : v)}
            error={!!errors[name]}
            editable={!loading}
            returnKeyType={isLast ? "done" : "next"}
            onSubmitEditing={() => focusNext(name)}
            right={right}
            {...props}
          />
        </Field>,
      );
    };

    const chips = (key, label, options, field, required = true) =>
      item(
        key,
        <ChipGroup
          label={label}
          required={required}
          options={options}
          value={formData[field]}
          onChange={(v) => updateField(field, v)}
          error={errors[field]}
          disabled={loading}
        />,
      );

    const eye = (shown, toggle, extra = null) => (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {extra}
        <Pressable
          onPress={toggle}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={shown ? "Hide password" : "Show password"}
          style={styles.eye}
        >
          <Ionicons
            name={shown ? "eye-outline" : "eye-off-outline"}
            size={22}
            color="#64748B"
          />
        </Pressable>
      </View>
    );

    /* ---- Step 1 ---- */
    if (step === 1) {
      const matches = formData.confirmPassword.length > 0;
      const ok = matches && formData.password === formData.confirmPassword;
      return [
        textField("email", "Email address", "mail-outline", {
          keyboardType: "email-address",
          autoCapitalize: "none",
          autoCorrect: false,
          autoComplete: "email",
          textContentType: "emailAddress",
        }),
        textField("password", "Password", "lock-closed-outline", {
          secureTextEntry: !showPassword,
          autoCapitalize: "none",
          autoCorrect: false,
          textContentType: "newPassword",
          right: eye(showPassword, () => setShowPassword((v) => !v)),
        }),
        formData.password
          ? item("strength", <PasswordStrength password={formData.password} />)
          : null,
        textField(
          "confirmPassword",
          "Confirm password",
          "shield-checkmark-outline",
          {
            secureTextEntry: !showConfirm,
            autoCapitalize: "none",
            autoCorrect: false,
            textContentType: "newPassword",
            right: eye(
              showConfirm,
              () => setShowConfirm((v) => !v),
              matches && (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  style={styles.matchIcon}
                >
                  <Ionicons
                    name={ok ? "checkmark-circle" : "close-circle"}
                    size={20}
                    color={ok ? "#16A34A" : "#EF4444"}
                  />
                </Animated.View>
              ),
            ),
          },
        ),
        item(
          "login",
          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account?</Text>
            <Pressable onPress={goToLogin} disabled={loading} hitSlop={8}>
              <Text style={styles.linkAccent}>Sign in</Text>
            </Pressable>
          </View>,
        ),
      ];
    }

    /* ---- Step 2 ---- */
    if (step === 2) {
      const list = [
        textField("firstName", "First name", "person-outline", {
          autoCapitalize: "words",
          textContentType: "givenName",
        }),
        textField("middleName", "Middle name (optional)", "person-outline", {
          autoCapitalize: "words",
        }),
        textField("surname", "Surname", "person-outline", {
          autoCapitalize: "words",
          textContentType: "familyName",
        }),
        textField("phoneNo", "Phone number", "call-outline", {
          keyboardType: "phone-pad",
          filter: phoneChars,
          textContentType: "telephoneNumber",
          maxLength: 16,
        }),
      ];

      if (!isClient) {
        list.push(
          textField(
            "altPhoneNo",
            "Alternative phone (optional)",
            "phone-portrait-outline",
            {
              keyboardType: "phone-pad",
              filter: phoneChars,
              maxLength: 16,
            },
          ),
        );
      }

      if (isClient) {
        list.push(
          chips("gender", "Gender", GENDER_OPTIONS, "gender"),
          textField("age", "Age", "calendar-outline", {
            keyboardType: "number-pad",
            filter: digitsOnly,
            maxLength: 3,
          }),
          textField("county", "County of residence", "location-outline", {
            autoCapitalize: "words",
          }),
        );
      }

      if (isCounselor) {
        list.push(
          chips("gender", "Gender", GENDER_OPTIONS, "gender"),
          textField(
            "yearsOfExperience",
            "Years of experience",
            "briefcase-outline",
            {
              keyboardType: "number-pad",
              filter: digitsOnly,
              maxLength: 2,
            },
          ),
          item(
            "specs",
            <View>
              <View style={styles.groupLabelRow}>
                <Text style={styles.groupLabel}>
                  Areas of specialization
                  <Text style={styles.requiredStar}> *</Text>
                </Text>
                {formData.specializations.length < 8 && (
                  <Pressable
                    onPress={addSpecialization}
                    style={styles.addSpecButton}
                    hitSlop={8}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={ACCENT}
                    />
                    <Text style={styles.addSpecText}>Add more</Text>
                  </Pressable>
                )}
              </View>
              {formData.specializations.map((s, idx) => (
                <Animated.View
                  key={s.id}
                  entering={FadeInDown.duration(250)}
                  exiting={FadeOutRight.duration(200)}
                  layout={LinearTransition.duration(250)}
                  style={styles.specRow}
                >
                  <View style={{ flex: 1 }}>
                    <FloatingInput
                      label={`Specialization ${idx + 1}`}
                      icon="ribbon-outline"
                      value={s.text}
                      onChangeText={(t) => updateSpecialization(s.id, t)}
                      error={!!errors.specializations && idx === 0}
                      editable={!loading}
                      autoCapitalize="sentences"
                    />
                  </View>
                  {formData.specializations.length > 1 && (
                    <Pressable
                      onPress={() => removeSpecialization(s.id)}
                      style={styles.specRemove}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove specialization ${idx + 1}`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#DC2626"
                      />
                    </Pressable>
                  )}
                </Animated.View>
              ))}
              {!!errors.specializations && (
                <Animated.Text
                  entering={FadeIn.duration(200)}
                  style={styles.fieldError}
                >
                  {errors.specializations}
                </Animated.Text>
              )}
            </View>,
          ),
        );
      }
      return list;
    }

    /* ---- Step 3 ---- */
    const list = [];
    if (!isClient) {
      list.push(
        textField("age", "Age", "calendar-outline", {
          keyboardType: "number-pad",
          filter: digitsOnly,
          maxLength: 3,
        }),
      );
    }
    list.push(
      chips(
        "relationshipStatus",
        "Relationship status",
        RELATIONSHIP_OPTIONS,
        "relationshipStatus",
      ),
      chips("religion", "Religion", RELIGION_OPTIONS, "religion"),
    );
    if (formData.religion === "Other") {
      list.push(
        textField(
          "otherReligion",
          "Specify your religion",
          "sparkles-outline",
          { autoCapitalize: "words" },
        ),
      );
    }
    if (isClient) {
      list.push(
        textField("emergencyPhone", "Emergency contact phone", "call-outline", {
          keyboardType: "phone-pad",
          filter: phoneChars,
          maxLength: 16,
        }),
        textField(
          "emergencyRelationship",
          "Their relationship to you (e.g. Parent)",
          "people-outline",
          {
            autoCapitalize: "words",
          },
        ),
        item(
          "privacy",
          <View style={styles.noteRow}>
            <Ionicons
              name="lock-closed-outline"
              size={16}
              color="#64748B"
              style={{ marginTop: 1 }}
            />
            <Text style={styles.noteText}>
              Your emergency contact is only used if we're worried about your
              safety. Your details are handled under Kenya's Data Protection
              Act, 2019.
            </Text>
          </View>,
        ),
      );
    } else {
      list.push(
        textField(
          "about",
          "About you and your professional background",
          "document-text-outline",
          {
            multiline: true,
            autoCapitalize: "sentences",
            numberOfLines: 4,
          },
        ),
      );
    }
    return list;
  };

  const bottomInset = (keyboardOpen ? 0 : insets.bottom) + 12;

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <LinearGradient
        colors={["#FF7A45", "#F05A2B", "#E14B1F"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AuroraBlobs width={width} height={height} />

      {/* ---- Header: back, title, step count, animated stepper ---- */}
      <Animated.View style={[styles.header, headerStyle, sideInsets]}>
        <View style={[styles.headerRow, { marginTop: insets.top + 12 }]}>
          {done ? (
            <View style={styles.backSpacer} />
          ) : (
            <Pressable
              onPress={handleBack}
              disabled={loading}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </Pressable>
          )}
          <Animated.Text
            entering={FadeInDown.duration(500)}
            style={styles.headerTitle}
          >
            {done ? "All done!" : "Create account"}
          </Animated.Text>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>{done ? "✓" : `${step}/3`}</Text>
          </View>
        </View>

        <Animated.View style={stepperStyle}>
          <StepIndicator
            step={done ? 4 : step}
            onStepPress={(n) => !done && !loading && n < step && goToStep(n)}
          />
        </Animated.View>
      </Animated.View>

      {/* ---- Sheet ---- */}
      <Animated.View
        entering={SlideInDown.duration(700).springify().damping(20)}
        style={styles.sheet}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.sheetContent,
            sideInsets,
            { paddingBottom: 28 },
          ]}
        >
          <View style={styles.column}>
            {done ? (
              <SuccessView
                role={selectedRole}
                firstName={formData.firstName.trim()}
                onContinue={goToLogin}
              />
            ) : (
              <Animated.View style={contentStyle}>
                <Text style={[styles.stepTitle, isTablet && { fontSize: 30 }]}>
                  {META[step].title}
                </Text>
                <Text style={styles.stepSubtitle}>{META[step].subtitle}</Text>

                {step > 1 && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    style={styles.rolePill}
                  >
                    <Ionicons
                      name={ROLE_ICON[selectedRole]}
                      size={14}
                      color="#9A3412"
                    />
                    <Text style={styles.rolePillText}>
                      Signing up as {selectedRole}
                    </Text>
                  </Animated.View>
                )}

                {formError && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    exiting={FadeOutUp.duration(200)}
                    style={styles.errorBanner}
                    accessibilityRole="alert"
                  >
                    <Ionicons name="alert-circle" size={20} color="#DC2626" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.errorText}>{formError.message}</Text>
                      {formError.action === "login" && (
                        <Pressable onPress={goToLogin} hitSlop={8}>
                          <Text style={styles.errorAction}>
                            Sign in instead →
                          </Text>
                        </Pressable>
                      )}
                      {formError.action === "support" && (
                        <Pressable
                          onPress={() =>
                            Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(
                              () => {},
                            )
                          }
                          hitSlop={8}
                        >
                          <Text style={styles.errorAction}>
                            Email support →
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </Animated.View>
                )}

                <Animated.View key={step} style={[styles.form, shakeStyle]}>
                  {renderStep()}
                </Animated.View>
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* ---- Sticky footer, respects the navigation bar ---- */}
        {!done && (
          <View
            style={[styles.footer, sideInsets, { paddingBottom: bottomInset }]}
          >
            <View style={styles.footerInner}>
              {step > 1 && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(150)}
                  style={styles.footerBack}
                >
                  <ShimmerButton
                    variant="secondary"
                    label="Back"
                    onPress={handleBack}
                    disabled={loading}
                  />
                </Animated.View>
              )}
              <Animated.View
                layout={LinearTransition.duration(250)}
                style={styles.footerNext}
              >
                <ShimmerButton
                  label={step === 3 ? "Create account" : "Continue"}
                  onPress={handleNext}
                  loading={loading}
                />
              </Animated.View>
            </View>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
