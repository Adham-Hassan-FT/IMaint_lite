import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  List,
  Switch,
  Divider,
  Card,
  Portal,
  Dialog,
  Button,
  RadioButton,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const theme = useTheme();
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  
  // Dialog state
  const [syncFrequencyDialogVisible, setSyncFrequencyDialogVisible] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState('15min');
  
  // Clear cache confirmation dialog
  const [clearCacheDialogVisible, setClearCacheDialogVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Card style={styles.settingsCard}>
          <Card.Title title="Notifications" />
          <Card.Content>
            <List.Item
              title="Push Notifications"
              description="Receive notifications on your device"
              right={() => 
                <Switch 
                  value={pushNotifications} 
                  onValueChange={setPushNotifications} 
                  color={theme.colors.primary}
                />
              }
            />
            <Divider />
            <List.Item
              title="Email Notifications"
              description="Receive notifications via email"
              right={() => 
                <Switch 
                  value={emailNotifications} 
                  onValueChange={setEmailNotifications}
                  color={theme.colors.primary}
                />
              }
            />
          </Card.Content>
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Title title="Appearance" />
          <Card.Content>
            <List.Item
              title="Dark Mode"
              description="Switch between light and dark theme"
              right={() => 
                <Switch 
                  value={darkMode} 
                  onValueChange={setDarkMode}
                  color={theme.colors.primary}
                />
              }
            />
          </Card.Content>
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Title title="Synchronization" />
          <Card.Content>
            <List.Item
              title="Auto Sync"
              description="Automatically sync data with the server"
              right={() => 
                <Switch 
                  value={autoSync} 
                  onValueChange={setAutoSync}
                  color={theme.colors.primary}
                />
              }
            />
            <Divider />
            <List.Item
              title="Sync Frequency"
              description={getSyncFrequencyDescription(syncFrequency)}
              onPress={() => setSyncFrequencyDialogVisible(true)}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Title title="Data Management" />
          <Card.Content>
            <List.Item
              title="Clear Cache"
              description="Delete temporary files to free up space"
              onPress={() => setClearCacheDialogVisible(true)}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />}
            />
            <Divider />
            <List.Item
              title="Export Data"
              description="Export your data to CSV or Excel format"
              onPress={() => {}}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.settingsCard}>
          <Card.Title title="About" />
          <Card.Content>
            <List.Item
              title="Version"
              description="v1.0.0"
              left={() => <List.Icon icon="information" />}
            />
            <Divider />
            <List.Item
              title="Terms of Service"
              onPress={() => {}}
              left={() => <List.Icon icon="file-document" />}
              right={() => <MaterialCommunityIcons name="open-in-new" size={24} color="#9ca3af" />}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              onPress={() => {}}
              left={() => <List.Icon icon="shield-account" />}
              right={() => <MaterialCommunityIcons name="open-in-new" size={24} color="#9ca3af" />}
            />
            <Divider />
            <List.Item
              title="Contact Support"
              onPress={() => {}}
              left={() => <List.Icon icon="help-circle" />}
              right={() => <MaterialCommunityIcons name="email" size={24} color="#9ca3af" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Sync Frequency Dialog */}
      <Portal>
        <Dialog
          visible={syncFrequencyDialogVisible}
          onDismiss={() => setSyncFrequencyDialogVisible(false)}
        >
          <Dialog.Title>Sync Frequency</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group onValueChange={value => setSyncFrequency(value)} value={syncFrequency}>
              <RadioButton.Item label="Every 15 minutes" value="15min" />
              <RadioButton.Item label="Every 30 minutes" value="30min" />
              <RadioButton.Item label="Every hour" value="60min" />
              <RadioButton.Item label="Every 4 hours" value="240min" />
              <RadioButton.Item label="Only manually" value="manual" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSyncFrequencyDialogVisible(false)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Clear Cache Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={clearCacheDialogVisible}
          onDismiss={() => setClearCacheDialogVisible(false)}
        >
          <Dialog.Title>Clear Cache</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to clear the cache? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearCacheDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={() => {
                // Clear cache logic would go here
                setClearCacheDialogVisible(false);
              }}
            >
              Clear
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const getSyncFrequencyDescription = (frequency: string) => {
  switch (frequency) {
    case '15min':
      return 'Every 15 minutes';
    case '30min':
      return 'Every 30 minutes';
    case '60min':
      return 'Every hour';
    case '240min':
      return 'Every 4 hours';
    case 'manual':
      return 'Only manually';
    default:
      return 'Every 15 minutes';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  settingsCard: {
    marginBottom: 16,
    borderRadius: 10,
  },
});

export default SettingsScreen;