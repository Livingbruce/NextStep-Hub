import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../../styles/(counselor)/programs";

const INITIAL_PROGRAMS = [
  {
    id: "p1",
    title: "Campus Readiness Workshop 2026",
    category: "Pre-Campus Transition",
    date: "Sept 25, 2026 • 2:00 PM",
    location: "Virtual (Google Meet)",
    description:
      "A comprehensive guide to course registration, budgeting, and social adaptation for new university students.",
    status: "Available",
    participants: [
      {
        id: "c1",
        name: "Brian Kiprop",
        email: "brian.kiprop@example.com",
        phone: "0712345678",
        county: "Meru",
        educationLevel: "High School Leaver",
        status: "Registered",
      },
      {
        id: "c2",
        name: "Wanjiru Kamau",
        email: "wanjiru.k@example.com",
        phone: "0798765432",
        county: "Nairobi",
        educationLevel: "Form 4 Graduate",
        status: "Registered",
      },
    ],
  },
  {
    id: "p2",
    title: "Career Pitching & CV Masterclass",
    category: "Post-Campus Career Pitching",
    date: "Aug 10, 2026",
    location: "Nairobi Innovation Hub",
    description:
      "Practical session on writing high-impact resumes and interviewing for entry-level tech roles.",
    status: "Past",
    participants: [
      {
        id: "c3",
        name: "Mercy Chebet",
        email: "mercy.c@example.com",
        phone: "0722112233",
        county: "Nakuru",
        educationLevel: "Degree Holder",
        status: "Participated",
      },
    ],
  },
];

export default function Programs() {
  const [programs, setPrograms] = useState(INITIAL_PROGRAMS);

  // Full-screen Participants Modal State
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [expandedParticipantId, setExpandedParticipantId] = useState(null);

  // Edit / Add Program Modal State
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Program Handlers
  const handleOpenAddModal = () => {
    setEditingProgram(null);
    setFormTitle("");
    setFormCategory("");
    setFormDate("");
    setFormLocation("");
    setFormDescription("");
    setIsProgramModalOpen(true);
  };

  const handleOpenEditModal = (prog) => {
    setEditingProgram(prog);
    setFormTitle(prog.title);
    setFormCategory(prog.category);
    setFormDate(prog.date);
    setFormLocation(prog.location);
    setFormDescription(prog.description);
    setIsProgramModalOpen(true);
  };

  const handleSaveProgram = () => {
    if (!formTitle || !formDate) {
      Alert.alert(
        "Error",
        "Please fill in at least the program title and date.",
      );
      return;
    }

    if (editingProgram) {
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === editingProgram.id
            ? {
                ...p,
                title: formTitle,
                category: formCategory,
                date: formDate,
                location: formLocation,
                description: formDescription,
              }
            : p,
        ),
      );
    } else {
      const newProg = {
        id: `p_${Date.now()}`,
        title: formTitle,
        category: formCategory || "General Mentorship",
        date: formDate,
        location: formLocation || "Online",
        description: formDescription,
        status: "Available",
        participants: [],
      };
      setPrograms((prev) => [newProg, ...prev]);
    }

    setIsProgramModalOpen(false);
  };

  const handleDeleteProgram = (id) => {
    Alert.alert(
      "Delete Program",
      "Are you sure you want to delete this program?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setPrograms((prev) => prev.filter((p) => p.id !== id));
          },
        },
      ],
    );
  };

  // Participant Management Handlers
  const handleOpenParticipants = (prog) => {
    setSelectedProgram(prog);
    setIsParticipantsModalOpen(true);
    setExpandedParticipantId(null);
  };

  const toggleExpandParticipant = (id) => {
    setExpandedParticipantId((prev) => (prev === id ? null : id));
  };

  const handleMarkParticipated = (participantId) => {
    if (!selectedProgram) return;

    const updatedParticipants = selectedProgram.participants.map((p) =>
      p.id === participantId ? { ...p, status: "Participated" } : p,
    );

    updateProgramParticipants(selectedProgram.id, updatedParticipants);
  };

  const handleRemoveParticipant = (participantId) => {
    if (!selectedProgram) return;

    Alert.alert(
      "Remove Participant",
      "Remove this client from the registered list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updatedParticipants = selectedProgram.participants.filter(
              (p) => p.id !== participantId,
            );
            updateProgramParticipants(selectedProgram.id, updatedParticipants);
          },
        },
      ],
    );
  };

  const updateProgramParticipants = (progId, newParticipants) => {
    const updatedProg = { ...selectedProgram, participants: newParticipants };
    setSelectedProgram(updatedProg);

    setPrograms((prev) => prev.map((p) => (p.id === progId ? updatedProg : p)));
  };

  const availablePrograms = programs.filter((p) => p.status === "Available");
  const pastPrograms = programs.filter((p) => p.status === "Past");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Mentorship Programs</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
          <Ionicons name="add-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Program</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Available Programs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Programs</Text>
          {availablePrograms.length === 0 ? (
            <Text style={styles.emptyText}>No active programs available.</Text>
          ) : (
            availablePrograms.map((prog) => (
              <ProgramCard
                key={prog.id}
                program={prog}
                onEdit={() => handleOpenEditModal(prog)}
                onDelete={() => handleDeleteProgram(prog.id)}
                onViewParticipants={() => handleOpenParticipants(prog)}
              />
            ))
          )}
        </View>

        {/* Past Programs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Programs</Text>
          {pastPrograms.length === 0 ? (
            <Text style={styles.emptyText}>No past programs recorded.</Text>
          ) : (
            pastPrograms.map((prog) => (
              <ProgramCard
                key={prog.id}
                program={prog}
                onEdit={() => handleOpenEditModal(prog)}
                onDelete={() => handleDeleteProgram(prog.id)}
                onViewParticipants={() => handleOpenParticipants(prog)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FULL SCREEN PARTICIPANTS MODAL */}
      <Modal
        visible={isParticipantsModalOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsParticipantsModalOpen(false)}
      >
        <SafeAreaView style={styles.fullModalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsParticipantsModalOpen(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="close-outline" size={24} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedProgram?.title}
              </Text>
              <Text style={styles.modalHeaderSub}>Registered Participants</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.participantsList}>
            {selectedProgram?.participants.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyText}>
                  No clients registered for this program yet.
                </Text>
              </View>
            ) : (
              selectedProgram?.participants.map((client) => {
                const isExpanded = expandedParticipantId === client.id;
                const isAttended = client.status === "Participated";

                return (
                  <View key={client.id} style={styles.participantCard}>
                    {/* Expandable Header / Client Name */}
                    <TouchableOpacity
                      style={styles.participantHeader}
                      onPress={() => toggleExpandParticipant(client.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.clientMainInfo}>
                        <Text style={styles.participantName}>
                          {client.name}
                        </Text>
                        <Text
                          style={[
                            styles.statusTag,
                            isAttended && styles.statusTagAttended,
                          ]}
                        >
                          {client.status}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>

                    {/* Collapsible Info Drawer */}
                    {isExpanded && (
                      <View style={styles.participantDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="mail-outline"
                            size={16}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>{client.email}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>{client.phone}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>
                            County: {client.county}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="school-outline"
                            size={16}
                            color="#64748B"
                          />
                          <Text style={styles.detailText}>
                            Level: {client.educationLevel}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Participant Actions Row */}
                    <View style={styles.participantActions}>
                      <TouchableOpacity
                        style={[
                          styles.partActionBtn,
                          styles.participatedBtn,
                          isAttended && styles.disabledBtn,
                        ]}
                        disabled={isAttended}
                        onPress={() => handleMarkParticipated(client.id)}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={16}
                          color={isAttended ? "#94A3B8" : "#15803D"}
                        />
                        <Text
                          style={[
                            styles.participatedBtnText,
                            isAttended && styles.disabledBtnText,
                          ]}
                        >
                          {isAttended ? "Attended" : "Participated"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.partActionBtn, styles.removeBtn]}
                        onPress={() => handleRemoveParticipant(client.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#B91C1C"
                        />
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* CREATE / EDIT PROGRAM MODAL */}
      <Modal
        visible={isProgramModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsProgramModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <Text style={styles.formModalTitle}>
              {editingProgram ? "Edit Program" : "Create New Program"}
            </Text>

            <TextInput
              style={styles.formInput}
              placeholder="Program Title"
              placeholderTextColor="#94A3B8"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <TextInput
              style={styles.formInput}
              placeholder="Category (e.g. Pre-Campus Transition)"
              placeholderTextColor="#94A3B8"
              value={formCategory}
              onChangeText={setFormCategory}
            />

            <TextInput
              style={styles.formInput}
              placeholder="Date & Time (e.g. Oct 12, 10:00 AM)"
              placeholderTextColor="#94A3B8"
              value={formDate}
              onChangeText={setFormDate}
            />

            <TextInput
              style={styles.formInput}
              placeholder="Location or Virtual Link"
              placeholderTextColor="#94A3B8"
              value={formLocation}
              onChangeText={setFormLocation}
            />

            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Program Description"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={formDescription}
              onChangeText={setFormDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsProgramModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProgram}
              >
                <Text style={styles.saveBtnText}>Save Program</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Sub-component for Program Cards
function ProgramCard({ program, onEdit, onDelete, onViewParticipants }) {
  return (
    <View style={styles.programCard}>
      <View style={styles.cardTop}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{program.category}</Text>
        </View>
        <Text style={styles.dateText}>{program.date}</Text>
      </View>

      <Text style={styles.programTitle}>{program.title}</Text>
      <Text style={styles.locationText}>📍 {program.location}</Text>
      <Text style={styles.descriptionText} numberOfLines={2}>
        {program.description}
      </Text>

      {/* Card Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.viewParticipantsBtn}
          onPress={onViewParticipants}
        >
          <Ionicons name="people-outline" size={16} color="#FFFFFF" />
          <Text style={styles.viewParticipantsText}>
            View Participants ({program.participants.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconActionBtn} onPress={onEdit}>
          <Ionicons name="pencil-outline" size={18} color="#0284C7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconActionBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
