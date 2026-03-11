import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { FileCard } from './FileCard';

interface SuccessViewProps {
  docxName: string;
  docxPath: string;
  docxSize: number;
  onConvertAnother: () => void;
}

export function SuccessView({ docxName, docxPath, docxSize, onConvertAnother }: SuccessViewProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;
  const shareScaleAnim = useRef(new Animated.Value(1)).current;
  const anotherScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 14,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(checkScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 16,
        bounciness: 20,
      }),
    ]).start();
  }, []);

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(docxPath, {
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        dialogTitle: 'Save your Word document',
        UTI: 'org.openxmlformats.wordprocessingml.document',
      });
    }
  };

  const handleConvertAnother = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConvertAnother();
  };

  const sharePressIn = () =>
    Animated.spring(shareScaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const sharePressOut = () =>
    Animated.spring(shareScaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  const anotherPressIn = () =>
    Animated.spring(anotherScaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const anotherPressOut = () =>
    Animated.spring(anotherScaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Success icon */}
      <Animated.View
        style={[styles.successCircle, { transform: [{ scale: checkScaleAnim }] }]}
      >
        <Ionicons name="checkmark" size={44} color={Colors.surface} />
      </Animated.View>

      <Text style={styles.title}>Conversion Complete!</Text>
      <Text style={styles.subtitle}>Your Word document is ready to share</Text>

      {/* DOCX file card */}
      <View style={styles.cardWrapper}>
        <FileCard name={docxName} size={docxSize} type="docx" />
      </View>

      {/* Share button */}
      <Pressable
        onPress={handleShare}
        onPressIn={sharePressIn}
        onPressOut={sharePressOut}
        accessibilityRole="button"
        accessibilityLabel="Share or save Word document"
      >
        <Animated.View style={[styles.shareBtn, { transform: [{ scale: shareScaleAnim }] }]}>
          <Ionicons name="share-outline" size={20} color={Colors.surface} />
          <Text style={styles.shareLabel}>Share / Save</Text>
        </Animated.View>
      </Pressable>

      {/* Convert another */}
      <Pressable
        onPress={handleConvertAnother}
        onPressIn={anotherPressIn}
        onPressOut={anotherPressOut}
        accessibilityRole="button"
        accessibilityLabel="Convert another PDF"
      >
        <Animated.View
          style={[styles.anotherBtn, { transform: [{ scale: anotherScaleAnim }] }]}
        >
          <Text style={styles.anotherLabel}>Convert Another</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  cardWrapper: {
    width: '100%',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    gap: 10,
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  shareLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.surface,
    letterSpacing: -0.3,
  },
  anotherBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    width: '100%',
    alignItems: 'center',
  },
  anotherLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
