import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { TAB_BAR_HEIGHT } from '../navigation/TabNavigator';
import { useConversion } from '../hooks/useConversion';
import { FilePicker } from '../components/FilePicker';
import { FileCard } from '../components/FileCard';
import { ConvertButton } from '../components/ConvertButton';
import { ProgressSteps } from '../components/ProgressSteps';
import { SuccessView } from '../components/SuccessView';
import { ErrorView } from '../components/ErrorView';

export function HomeScreen() {
  const { state, pickFile, removeFile, startConversion, cancelConversion, reset, retry } =
    useConversion();

  const renderContent = () => {
    switch (state.phase) {
      case 'idle':
        return (
          <View style={styles.idleContainer}>
            {/* Logo area */}
            <View style={styles.logoArea}>
              <View style={styles.logoIcon}>
                <View style={styles.logoIconBox}><Ionicons name="document-text-outline" size={28} color="#DC2626" /></View>
                <View style={styles.arrowBadge}>
                  <Ionicons name="arrow-forward" size={14} color={Colors.surface} />
                </View>
                <View style={styles.logoIconBox}><Ionicons name="document-outline" size={28} color={Colors.primary} /></View>
              </View>
              <Text style={styles.headline}>PDF to Word</Text>
              <Text style={styles.subtext}>
                Convert your PDF files to editable{'\n'}Word documents instantly
              </Text>
            </View>

            {/* Drop zone */}
            <FilePicker onPress={pickFile} />

            {/* Feature hints */}
            <View style={styles.hints}>
              {([
                { icon: 'flash-outline' as const, label: 'Fast conversion' },
                { icon: 'shield-checkmark-outline' as const, label: 'Private & secure' },
                { icon: 'phone-portrait-outline' as const, label: 'Save to Files' },
              ] as const).map((h) => (
                <View key={h.label} style={styles.hintItem}>
                  <Ionicons name={h.icon} size={22} color={Colors.textSecondary} />
                  <Text style={styles.hintLabel}>{h.label}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'file_selected':
        return (
          <View style={styles.selectedContainer}>
            <Text style={styles.sectionTitle}>Selected File</Text>
            <FileCard
              name={state.file.name}
              size={state.file.size}
              type="pdf"
              onRemove={removeFile}
            />
            <View style={styles.spacer} />
            <ConvertButton onPress={startConversion} />
            <Text style={styles.helpText}>
              Your file will be uploaded and converted on our secure server
            </Text>
          </View>
        );

      case 'converting':
        return (
          <ProgressSteps
            step={state.step}
            uploadProgress={state.uploadProgress}
            onCancel={cancelConversion}
          />
        );

      case 'success':
        return (
          <SuccessView
            docxName={state.docxName}
            docxPath={state.docxPath}
            docxSize={state.docxSize}
            onConvertAnother={reset}
          />
        );

      case 'error':
        return (
          <ErrorView
            message={state.message}
            onRetry={retry}
            onSelectDifferent={reset}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PDF to Word</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Free</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>{renderContent()}</View>
      </ScrollView>
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
  headerBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: TAB_BAR_HEIGHT + 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },

  // Idle state
  idleContainer: {
    gap: 32,
  },
  logoArea: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  logoIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  arrowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  subtext: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  hints: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  hintItem: {
    alignItems: 'center',
    gap: 4,
  },
  hintLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },

  // File selected state
  selectedContainer: {
    gap: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  helpText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
