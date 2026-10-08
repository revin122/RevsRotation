import { StyleSheet } from 'react-native';

export const ROW_HEIGHT = 64;

export const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  container: {
    flex: 1,
    margin: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 10,
  },
  headerSide: {
    width: 72,
  },
  backButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  header: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  editHint: { color: '#555', marginBottom: 8 },
  row: { height: ROW_HEIGHT, paddingVertical: 4 },
  draggedRow: { zIndex: 10, elevation: 5, opacity: 0.9 },
  listItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  itemName: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  rowControl: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { fontSize: 26, color: '#c62828' },
  handleText: { fontSize: 28, color: '#666' },
  moveBottomText: {
    fontSize: 13,
    color: '#007AFF',
  },
  disabledControl: { opacity: 0.3 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dialog: { backgroundColor: 'white', borderRadius: 12, padding: 20 },
  dialogTitle: { fontSize: 18, fontWeight: '600' },
  dialogButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
    borderRadius: 6,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});
