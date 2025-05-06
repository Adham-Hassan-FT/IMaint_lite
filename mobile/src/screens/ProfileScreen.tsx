import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Title,
  Paragraph,
  List,
  useTheme,
} from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <View style={styles.notAuthenticatedContainer}>
        <MaterialCommunityIcons name="account-off" size={50} color="#9ca3af" />
        <Text style={styles.notAuthenticatedText}>Not authenticated</Text>
        <Button mode="contained" onPress={handleLogout}>
          Go to Login
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar.Text
              size={100}
              label={user.fullName.split(' ').map(n => n[0]).join('')}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <Title style={styles.userName}>{user.fullName}</Title>
            <Paragraph style={styles.userRole}>{user.role}</Paragraph>
          </View>

          <Divider style={styles.divider} />

          <Card.Content>
            <List.Section>
              <List.Item
                title="Username"
                description={user.username}
                left={() => <List.Icon icon="account" />}
              />
              <List.Item
                title="Email"
                description={user.email}
                left={() => <List.Icon icon="email" />}
              />
              <List.Item
                title="Role"
                description={user.role}
                left={() => <List.Icon icon="shield-account" />}
              />
            </List.Section>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard}>
          <Card.Content>
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={() => <List.Icon color={theme.colors.primary} icon="account-edit" />}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="Change Password"
              description="Update your password"
              left={() => <List.Icon color={theme.colors.primary} icon="lock-reset" />}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />}
              onPress={() => {}}
            />
            <Divider />
            <List.Item
              title="Notification Settings"
              description="Manage your notification preferences"
              left={() => <List.Icon color={theme.colors.primary} icon="bell-outline" />}
              right={() => <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />}
              onPress={() => {}}
            />
          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
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
  profileCard: {
    marginBottom: 16,
    borderRadius: 10,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
  },
  userName: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 16,
    color: '#6b7280',
  },
  divider: {
    marginVertical: 8,
  },
  actionCard: {
    marginBottom: 16,
    borderRadius: 10,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notAuthenticatedText: {
    fontSize: 18,
    color: '#6b7280',
    marginVertical: 20,
  },
});

export default ProfileScreen;