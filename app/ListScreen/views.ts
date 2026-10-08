import { StyleSheet } from 'react-native'

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
