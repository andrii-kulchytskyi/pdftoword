import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
  onSelectDifferent: () => void;
}

export function ErrorView({ message, onRetry, onSelectDifferent }: ErrorViewProps) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const retryScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRetry = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry();
  };

  const handleSelectDifferent = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDifferent();
  };

  const retryPressIn = () =>
    Animated.spring(retryScaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const retryPressOut = () =>
    Animated.spring(retryScaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <Animated.View
        style={[styles.errorCircle, { transform: [{ translateX: shakeAnim }] }]}
      >
        <Ionicons name="close" size={38} color={Colors.surface} />
      </Animated.View>

      <Text style={styles.title}>Something Went Wrong</Text>

      <View style={styles.messageBox}>
        <Text style={styles.message}>{message}</Text>
      </View>

      <Pressable
        onPress={handleRetry}
        onPressIn={retryPressIn}
        onPressOut={retryPressOut}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Animated.View style={[styles.retryBtn, { transform: [{ scale: retryScaleAnim }] }]}>
          <Text style={styles.retryLabel}>Try Again</Text>
        </Animated.View>
      </Pressable>

      <Pressable
        onPress={handleSelectDifferent}
        accessibilityRole="button"
        accessibilityLabel="Select different file"
      >
        <Text style={styles.selectDifferentLink}>Select Different File</Text>
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
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  messageBox: {
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  message: {
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: Colors.error,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  retryLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.surface,
    letterSpacing: -0.3,
  },
  selectDifferentLink: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
