import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { ConversionRecord } from '../services/storage';

interface HistoryRowProps {
  record: ConversionRecord;
  onPress: () => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'short' });
  } else {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function truncateName(name: string, maxLen = 28): string {
  if (name.length <= maxLen) return name;
  const ext = name.lastIndexOf('.');
  if (ext > 0) {
    const base = name.slice(0, ext);
    const extension = name.slice(ext);
    const allowedBase = maxLen - extension.length - 3;
    return `${base.slice(0, allowedBase)}...${extension}`;
  }
  return `${name.slice(0, maxLen - 3)}...`;
}

export function HistoryRow({ record, onPress, onDelete }: HistoryRowProps) {
  const deleteScaleAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;
  const isSuccess = record.status === 'success';
  const [swiped, setSwiped] = React.useState(false);

  const handleLongPress = () => {
    if (swiped) {
      // Swipe back
      Animated.spring(translateAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
      }).start(() => {
        Animated.timing(deleteScaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => setSwiped(false));
      });
    } else {
      // Reveal delete button
      setSwiped(true);
      Animated.parallel([
        Animated.spring(translateAnim, {
          toValue: -80,
          useNativeDriver: true,
          speed: 20,
        }),
        Animated.spring(deleteScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
        }),
      ]).start();
    }
  };

  const handleDelete = () => {
    Animated.timing(translateAnim, {
      toValue: -400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDelete());
  };

  return (
    <View style={styles.wrapper}>
      {/* Delete button behind */}
      <Animated.View
        style={[styles.deleteBtn, { transform: [{ scale: deleteScaleAnim }] }]}
      >
        <Pressable onPress={handleDelete} style={styles.deletePressable}>
          <Ionicons name="trash-outline" size={20} color={Colors.surface} />
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      </Animated.View>

      {/* Main row */}
      <Animated.View style={{ transform: [{ translateX: translateAnim }] }}>
        <Pressable
          onPress={isSuccess ? onPress : undefined}
          onLongPress={handleLongPress}
          style={({ pressed }) => [
            styles.row,
            pressed && isSuccess && styles.rowPressed,
          ]}
          accessibilityRole={isSuccess ? 'button' : 'none'}
          accessibilityLabel={`${record.originalName}, ${record.status}`}
        >
          {/* Icon */}
          <View style={[styles.iconBox, isSuccess ? styles.iconBoxSuccess : styles.iconBoxError]}>
            <MaterialCommunityIcons name="file-pdf-box" size={24} color={isSuccess ? Colors.primary : Colors.error} />
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {truncateName(record.originalName)}
            </Text>
            <Text style={styles.date}>{formatDate(record.convertedAt)}</Text>
          </View>

          {/* Status badge */}
          <View style={[styles.badge, isSuccess ? styles.badgeSuccess : styles.badgeError]}>
            <View style={styles.badgeInner}>
              <Ionicons name={isSuccess ? 'checkmark' : 'close'} size={11} color={isSuccess ? Colors.success : Colors.error} />
              <Text style={[styles.badgeText, isSuccess ? styles.badgeTextSuccess : styles.badgeTextError]}>
                {isSuccess ? 'Done' : 'Failed'}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 72,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: Colors.error,
  },
  deletePressable: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    gap: 2,
  },
  deleteLabel: {
    fontSize: 11,
    color: Colors.surface,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowPressed: {
    backgroundColor: Colors.background,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSuccess: {
    backgroundColor: Colors.primaryLight,
  },
  iconBoxError: {
    backgroundColor: Colors.errorLight,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  date: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '400',
  },
  badgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeSuccess: {
    backgroundColor: Colors.successLight,
  },
  badgeError: {
    backgroundColor: Colors.errorLight,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeTextSuccess: {
    color: Colors.success,
  },
  badgeTextError: {
    color: Colors.error,
  },
});
