import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { TAB_BAR_HEIGHT } from '../navigation/TabNavigator';
import { ConversionRecord, loadHistory, deleteFromHistory, clearHistory } from '../services/storage';
import { HistoryRow } from '../components/HistoryRow';

function EmptyHistory() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Conversions Yet</Text>
      <Text style={styles.emptySubtext}>
        Your conversion history will appear here{'\n'}after you convert your first PDF
      </Text>
    </View>
  );
}

export function HistoryScreen() {
  const [history, setHistory] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadHistory().then((h) => {
        if (active) {
          setHistory(h);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const handlePress = async (record: ConversionRecord) => {
    if (record.status !== 'success' || !record.docxPath) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Check if file still exists
    const info = await FileSystem.getInfoAsync(record.docxPath);
    if (!info.exists) {
      Alert.alert(
        'File Not Found',
        'The converted file is no longer available on this device.',
        [{ text: 'OK' }],
      );
      return;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(record.docxPath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        dialogTitle: 'Save your Word document',
        UTI: 'org.openxmlformats.wordprocessingml.document',
      });
    }
  };

  const handleDelete = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await deleteFromHistory(id);
    setHistory(updated);
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all conversion history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            setHistory([]);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        {history.length > 0 && (
          <Pressable onPress={handleClearAll} accessibilityRole="button" accessibilityLabel="Clear all history">
            <Text style={styles.clearBtn}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {/* Stats bar */}
      {history.length > 0 && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {history.length} conversion{history.length !== 1 ? 's' : ''} •{' '}
            {history.filter((h) => h.status === 'success').length} successful
          </Text>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryRow
            record={item}
            onPress={() => handlePress(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          history.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? null : <EmptyHistory />}
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  clearBtn: {
    fontSize: 15,
    color: Colors.error,
    fontWeight: '600',
  },
  statsBar: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  statsText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: TAB_BAR_HEIGHT + 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
