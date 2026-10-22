import React from 'react';
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useStoredListController } from '../controllers/useStoredListController';
import ListScreen from './ListScreen';

export default function StoredListScreen(
  props: NativeStackScreenProps<RootStackParamList, 'RevRotation'>,
) {
  const {
    data,
    loading,
    error,
    saving,
    path,
    retry,
    back,
    navigate,
    save,
    copy,
    paste,
    copiedListName,
    canPaste,
  } = useStoredListController(props);

  if (loading || error || !data) {
    return (
      <View style={styles.status}>
        {loading ? (
          <>
            <ActivityIndicator />
            <Text>Loading your list…</Text>
          </>
        ) : (
          <>
            <Text accessibilityRole="alert">
              {error ?? 'List unavailable.'}
            </Text>
            <Button title="Retry" onPress={retry} />
            {path.length > 0 && <Button title="Back" onPress={back} />}
          </>
        )}
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ListScreen
        data={data}
        path={path}
        isRoot={path.length === 0}
        busy={saving}
        copiedListName={copiedListName}
        canPaste={canPaste}
        onCopy={copy}
        onPaste={paste}
        onDataUpdate={save}
        onBack={back}
        onNavigate={navigate}
      />
      {saving && (
        <View style={styles.saving} pointerEvents="none">
          <Text>Working…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  saving: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 4,
  },
});
