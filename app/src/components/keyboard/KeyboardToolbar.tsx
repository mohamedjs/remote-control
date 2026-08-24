import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ActiveTab } from './keyboard.types';

interface KeyboardToolbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onClose: () => void;
  compact?: boolean;
}

const TABS: { id: ActiveTab; icon: string; label: string }[] = [
  { id: 'mouse', icon: '🖱', label: 'Mouse' },
  { id: 'keyboard', icon: '⌨', label: 'Keyboard' },
  { id: 'shortcuts', icon: '⚡', label: 'Shortcuts' },
];

export const KeyboardToolbar: React.FC<KeyboardToolbarProps> = React.memo(({
  activeTab,
  onTabChange,
  onClose,
  compact,
}) => {
  return (
    <View style={[styles.toolbar, compact && styles.toolbarCompact]}>
      <View style={styles.tabGroup}>
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                compact && styles.tabCompact,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              {!compact && (
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onClose}
        style={[styles.closeBtn, compact && styles.closeBtnCompact]}
        activeOpacity={0.6}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
});

KeyboardToolbar.displayName = 'KeyboardToolbar';

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(235, 240, 245, 0.95)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(180, 195, 210, 0.3)',
  },
  toolbarCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tabGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  tabCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#8a9bb0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7c8d',
  },
  tabLabelActive: {
    color: '#1a202c',
    fontWeight: '600',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(200, 210, 220, 0.5)',
  },
  closeBtnCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  closeText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '700',
  },
});
