import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
    listItem: {
      padding: 12,
      backgroundColor: '#f0f0f0',
      marginVertical: 4,
      borderRadius: 6
    },
    input: {
      borderWidth: 1,
      padding: 10,
      marginVertical: 10,
      borderRadius: 6
    },
    navButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20
    }
})