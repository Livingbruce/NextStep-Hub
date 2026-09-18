import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(admin)/pricing";

const PRESET_PRICES = [1500, 2000, 2500, 3000, 5000];

export default function Pricing() {
  const [price, setPrice] = useState("2500");
  const [currency, setCurrency] = useState("KES");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedPrice, setLastSavedPrice] = useState("2500");

  const handlePriceChange = (text) => {
    // Keep only numeric values
    const numericValue = text.replace(/[^0-9]/g, "");
    setPrice(numericValue);
  };

  const handleSelectPreset = (value) => {
    setPrice(value.toString());
  };

  const handleSavePrice = () => {
    if (!price || parseFloat(price) <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid appointment price.");
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);

    // Simulate saving to database/backend
    setTimeout(() => {
      setIsSaving(false);
      setLastSavedPrice(price);
      Alert.alert(
        "Pricing Updated",
        `Appointment base fee updated to ${currency} ${Number(price).toLocaleString()}.`,
      );
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Appointment Pricing</Text>
            <Text style={styles.headerSubtitle}>
              Set the default standard fee charged per counseling or mentorship
              session.
            </Text>
          </View>

          {/* Current Active Price Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Active Base Rate</Text>
            <Text style={styles.summaryAmount}>
              {currency} {Number(lastSavedPrice || 0).toLocaleString()}
            </Text>
            <Text style={styles.summarySubtext}>Per individual session</Text>
          </View>

          {/* Input Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Set New Session Price</Text>
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Price Per Appointment</Text>

              <View style={styles.inputContainer}>
                <View style={styles.currencyBadge}>
                  <Text style={styles.currencyText}>{currency}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={handlePriceChange}
                  keyboardType="numeric"
                  placeholder="e.g. 2500"
                  placeholderTextColor="#94A3B8"
                  maxLength={7}
                />
              </View>

              {/* Quick Select Presets */}
              <Text style={styles.presetLabel}>
                Quick Presets ({currency}):
              </Text>
              <View style={styles.presetRow}>
                {PRESET_PRICES.map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.presetChip,
                      price === val.toString() && styles.activePresetChip,
                    ]}
                    onPress={() => handleSelectPreset(val)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        price === val.toString() && styles.activePresetText,
                      ]}
                    >
                      {val.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save Action Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSavePrice}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Updating Price..." : "Save Pricing Rate"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
