import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PROGRAMS } from "../../components/client/Programs";
import { styles } from "../../styles/(client)/Programs";

export default function ProgramsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.maxContainer}>
        {/* Top Bar Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Programs</Text>
        </View>

        {/* Scrollable List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Enrolled Status Card */}
          <View style={styles.myProgramsSection}>
            <Text style={styles.sectionTitle}>My Programs</Text>
            <Text style={styles.sectionDescription}>
              You are currently not enrolled in any guidance programs.
            </Text>
          </View>

          {/* Available Programs List */}
          <View style={styles.availablePrograms}>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
              Available Programs
            </Text>
            {PROGRAMS.map((item) => (
              <View key={item.id} style={styles.categoryItem}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryIconCircle}>
                    <Ionicons name={item.icon} size={22} color="#0F172A" />
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>

                <Text style={styles.categoryDescription} numberOfLines={3}>
                  {item.description}
                </Text>

                <TouchableOpacity
                  style={styles.enrollButton}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/programs/${item.id}`)}
                >
                  <Text style={styles.enrollButtonText}>Explore</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
