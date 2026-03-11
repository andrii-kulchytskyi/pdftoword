import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { ConversionStep } from '../hooks/useConversion';

interface ProgressStepsProps {
  step: ConversionStep;
  uploadProgress: number;
  onCancel: () => void;
}

const STEPS: { key: ConversionStep; label: string; icon: 'cloud-upload-outline' | 'sync-outline' | 'download-outline' }[] = [
  { key: 'uploading', label: 'Uploading', icon: 'cloud-upload-outline' },
  { key: 'converting', label: 'Converting', icon: 'sync-outline' },
  { key: 'preparing', label: 'Preparing download', icon: 'download-outline' },
];

const STEP_WEIGHTS = { uploading: 0.4, converting: 0.45, preparing: 0.15 };

function getOverallProgress(step: ConversionStep, uploadProgress: number): number {
  const weights = STEP_WEIGHTS;
  switch (step) {
    case 'uploading':
      return weights.uploading * uploadProgress;
    case 'converting':
      return weights.uploading + weights.converting * 0.5;
    case 'preparing':
      return weights.uploading + weights.converting + weights.preparing * 0.7;
  }
}

function AnimatedDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <Text style={styles.dots}>{dots}</Text>;
}

export function ProgressSteps({ step, uploadProgress, onCancel }: ProgressStepsProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const overall = getOverallProgress(step, uploadProgress);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: overall,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [overall]);

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const cancelPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  };
  const cancelPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Converting your PDF</Text>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <Text style={styles.percentText}>
        {Math.round(overall * 100)}%
      </Text>

      {/* Step list */}
      <View style={styles.steps}>
        {STEPS.map((s, i) => {
          const isDone = i < stepIndex;
          const isActive = i === stepIndex;
          const isPending = i > stepIndex;
          return (
            <View key={s.key} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  isDone && styles.stepDotDone,
                  isActive && styles.stepDotActive,
                  isPending && styles.stepDotPending,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color={Colors.surface} />
                ) : (
                  <Ionicons name={s.icon} size={14} color={isActive ? Colors.surface : Colors.textTertiary} />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isDone && styles.stepLabelDone,
                  isActive && styles.stepLabelActive,
                  isPending && styles.stepLabelPending,
                ]}
              >
                {s.label}
                {isActive && <AnimatedDots />}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Cancel */}
      <Pressable
        onPress={onCancel}
        onPressIn={cancelPressIn}
        onPressOut={cancelPressOut}
        accessibilityRole="button"
        accessibilityLabel="Cancel conversion"
      >
        <Animated.View style={[styles.cancelBtn, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="close" size={15} color={Colors.textSecondary} />
          <Text style={styles.cancelText}>Cancel</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
    paddingVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  barTrack: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: -8,
  },
  steps: {
    width: '100%',
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: Colors.success,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotPending: {
    backgroundColor: Colors.border,
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '500',
    flexDirection: 'row',
  },
  stepLabelDone: {
    color: Colors.success,
    textDecorationLine: 'line-through',
    textDecorationColor: Colors.success,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  stepLabelPending: {
    color: Colors.textTertiary,
  },
  dots: {
    color: Colors.primary,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
