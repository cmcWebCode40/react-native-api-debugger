import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface Tab {
  key: string;
  label: string;
  icon: string;
}

interface BottomTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                isActive && styles.iconContainerActive,
              ]}
            >
              <Text style={[styles.icon, isActive && styles.iconActive]}>
                {tab.icon}
              </Text>
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: '#E3F2FD',
  },
  icon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  },
  iconActive: {
    color: '#007AFF',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  labelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
