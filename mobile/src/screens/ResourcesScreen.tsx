import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, FAB, Searchbar, Text, Title, useTheme, ActivityIndicator, Avatar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { get } from '../lib/api';
import { useNavigation } from '@react-navigation/native';
import { User } from '../../../shared/schema';
import { useAuth } from '../hooks/useAuth';

const ResourcesScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await get<User[]>('/api/users');
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);
  
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) => 
          user.fullName.toLowerCase().includes(query.toLowerCase()) ||
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase()) ||
          user.role.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };
  
  // Helper function to get role color
  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return '#ef4444';
      case 'manager': return '#3b82f6';
      case 'technician': return '#10b981';
      case 'supervisor': return '#f59e0b';
      default: return '#6b7280';
    }
  };
  
  // Helper to get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Helper to get user role icon
  const getUserRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'shield-account';
      case 'manager': return 'account-tie';
      case 'technician': return 'account-wrench';
      case 'supervisor': return 'account-star';
      default: return 'account';
    }
  };
  
  const renderUserCard = ({ item }: { item: User }) => {
    const isCurrentUser = currentUser?.id === item.id;
    const roleColor = getRoleColor(item.role);
    
    return (
      <TouchableOpacity>
        <Card 
          style={[
            styles.card, 
            isCurrentUser && styles.currentUserCard
          ]}
        >
          <Card.Content>
            <View style={styles.userHeader}>
              <Avatar.Text 
                size={50} 
                label={getUserInitials(item.fullName)}
                style={{ backgroundColor: roleColor }}
              />
              <View style={styles.userInfo}>
                <Title style={styles.userName}>{item.fullName}</Title>
                <View style={styles.roleContainer}>
                  <MaterialCommunityIcons 
                    name={getUserRoleIcon(item.role)} 
                    size={16} 
                    color={roleColor} 
                    style={styles.roleIcon}
                  />
                  <Text style={[styles.roleText, { color: roleColor }]}>
                    {item.role}
                  </Text>
                </View>
              </View>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.contactContainer}>
              <View style={styles.contactItem}>
                <MaterialCommunityIcons 
                  name="account" 
                  size={16} 
                  color="#666" 
                  style={styles.contactIcon}
                />
                <Text style={styles.contactText}>{item.username}</Text>
              </View>
              
              <View style={styles.contactItem}>
                <MaterialCommunityIcons 
                  name="email" 
                  size={16} 
                  color="#666" 
                  style={styles.contactIcon}
                />
                <Text style={styles.contactText}>{item.email}</Text>
              </View>
            </View>
            
            {isCurrentUser && (
              <View style={styles.currentUserBadge}>
                <Text style={styles.currentUserText}>You</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="account-group" 
                size={64} 
                color="#ccc" 
              />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
      
      {currentUser?.role.toLowerCase() === 'admin' && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="account-plus"
          onPress={() => navigation.navigate('AddUser')}
          color="white"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    backgroundColor: 'white',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding for FAB
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roleIcon: {
    marginRight: 4,
  },
  roleText: {
    fontWeight: '500',
  },
  divider: {
    marginVertical: 12,
  },
  contactContainer: {
    marginTop: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactIcon: {
    marginRight: 8,
  },
  contactText: {
    color: '#666',
  },
  currentUserBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentUserText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ResourcesScreen;