import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface FileCardProps {
  name: string;
  size: number;
  type?: 'pdf' | 'docx';
  onRemove?: () => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function truncateName(name: string, maxLen = 32): string {
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

export function FileCard({ name, size, type = 'pdf', onRemove }: FileCardProps) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isPdf = type === 'pdf';
  const iconBg = isPdf ? '#FEE2E2' : Colors.primaryLight;
  const iconColor = isPdf ? '#DC2626' : Colors.primary;
  const extLabel = isPdf ? 'PDF' : 'DOCX';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons
          name={isPdf ? 'file-pdf-box' : 'file-word-box'}
          size={32}
          color={iconColor}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {truncateName(name)}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.ext}>{extLabel}</Text>
          <View style={styles.dot} />
          <Text style={styles.size}>{formatSize(size)}</Text>
        </View>
      </View>

      {onRemove && (
        <Pressable
          onPress={onRemove}
          style={styles.removeBtn}
          accessibilityLabel="Remove file"
          hitSlop={8}
        >
          <Ionicons name="close" size={14} color={Colors.textSecondary} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ext: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
  },
  size: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
