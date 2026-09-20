import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  addBtn: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
  },
  loader: {
    marginTop: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    fontStyle: "italic",
  },

  // Program Card
  programCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  posterThumb: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#E2E8F0",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#64748B",
  },
  programTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  freeTag: {
    backgroundColor: "#DCFCE7",
  },
  freeTagText: {
    color: "#15803D",
  },
  paidTag: {
    backgroundColor: "#FEF3C7",
  },
  paidTagText: {
    color: "#B45309",
  },
  infoTag: {
    backgroundColor: "#F1F5F9",
  },
  infoTagText: {
    color: "#475569",
  },
  descriptionText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewParticipantsBtn: {
    flex: 1,
    backgroundColor: "#1E3A8A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewParticipantsText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  // Full Screen Participants Modal
  fullModalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  closeBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleGroup: {
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalHeaderSub: {
    fontSize: 12,
    color: "#64748B",
  },
  participantsList: {
    padding: 16,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 20,
  },

  // Participant Card & Accordion
  participantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  participantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clientMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  participantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusTag: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D97706",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTagAttended: {
    color: "#15803D",
    backgroundColor: "#DCFCE7",
  },
  participantDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#475569",
  },
  participantActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  partActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  participatedBtn: {
    backgroundColor: "#DCFCE7",
  },
  participatedBtnText: {
    color: "#15803D",
    fontSize: 13,
    fontWeight: "700",
  },
  removeBtn: {
    backgroundColor: "#FEE2E2",
  },
  removeBtnText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },
  disabledBtn: {
    backgroundColor: "#F1F5F9",
  },
  disabledBtnText: {
    color: "#94A3B8",
  },

  // Create/Edit Program Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  formModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },
  formModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  formScroll: {
    flexGrow: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    marginBottom: 12,
  },
  lastInput: {
    marginBottom: 0,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },

  // Date & time
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    marginBottom: 12,
  },
  dateButtonText: {
    fontSize: 14,
    color: "#0F172A",
  },
  iosPickerRow: {
    alignItems: "flex-start",
    marginBottom: 12,
  },

  // Option chips (location type, free/paid)
  optionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  optionChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionChipActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  optionChipTextActive: {
    color: "#FFFFFF",
  },

  // Amount
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    marginBottom: 12,
  },
  currencyBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRightWidth: 1,
    borderRightColor: "#CBD5E1",
  },
  currencyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
  },

  // Poster
  posterPicker: {
    height: 110,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    marginBottom: 12,
    gap: 4,
  },
  posterPickerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  posterHint: {
    fontSize: 11,
    color: "#94A3B8",
  },
  posterPreviewWrap: {
    position: "relative",
    marginBottom: 12,
  },
  posterPreview: {
    width: "100%",
    height: 170,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  posterActions: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 8,
  },
  posterActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Moderators
  moderatorCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  moderatorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
  },

  // Footer buttons
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: "#64748B",
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 110,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
