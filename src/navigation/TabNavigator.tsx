import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';

export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 100 : 80;

type TabConfig = {
  name: string;
  label: string;
  activeIcon: React.ComponentProps<typeof Ionicons>['name'];
  inactiveIcon: React.ComponentProps<typeof Ionicons>['name'];
};

const TABS: TabConfig[] = [
  {
    name: 'Home',
    label: 'Convert',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
  },
  {
    name: 'History',
    label: 'History',
    activeIcon: 'time',
    inactiveIcon: 'time-outline',
  },
];

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    // pointerEvents as a JSX prop (not in StyleSheet) so touches pass through the gaps
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + 12 }]}
    >
      {/*
        Shadow lives on its own View. It needs a backgroundColor so iOS renders
        the shadow and Android elevation works. We use transparent white so it
        doesn't bleed through the BlurView tint.
      */}
      <View style={styles.shadow}>
        <BlurView style={styles.pill} intensity={85} tint="light">
          <View style={styles.row}>
            {state.routes.map((route, index) => {
              const tab = TABS.find((t) => t.name === route.name);
              if (!tab) return null;

              const isFocused = state.index === index;
              const { options } = descriptors[route.key];
              const label = (options.tabBarLabel as string | undefined) ?? tab.label;

              const onPress = async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isFocused }}
                  accessibilityLabel={label}
                  style={styles.tabItem}
                >
                  <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                    <Ionicons
                      name={isFocused ? tab.activeIcon : tab.inactiveIcon}
                      size={22}
                      color={isFocused ? Colors.primary : Colors.textTertiary}
                    />
                  </View>
                  <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Outer wrapper: absolutely positioned left/right with 24 px margin each side
  // bottom is set dynamically via safe area insets + spacing
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'stretch',
  },

  // Shadow layer — needs a background color so iOS shadow renders
  // and Android elevation paints correctly
  shadow: {
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 18,
  },

  // BlurView is the actual pill; overflow:hidden clips the blur to the pill shape
  pill: {
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },

  // Inner row — generous vertical padding, small horizontal gap between tabs
  row: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },

  // Each tab fills equal space
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },

  // Icon circle — active gets tinted background
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryLight,
  },

  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  labelActive: {
    color: Colors.primary,
  },
  labelInactive: {
    color: Colors.textTertiary,
  },
});
