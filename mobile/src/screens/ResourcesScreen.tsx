import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Avatar,
  Title,
  Paragraph,
  Badge,
  Divider,
  Searchbar,
  FAB,
  Chip,
  Button,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const ResourcesScreen = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState(null);
  
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 768;

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [searchQuery, availabilityFilter, resources]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from the API
      // For now, using mock data
      setTimeout(() => {
        const mockResources = [
          {
            id: 1,
            name: 'John Smith',
            role: 'Technician',
            skills: ['HVAC', 'Electrical', 'Plumbing'],
            email: 'john.smith@example.com',
            phone: '555-123-4567',
            status: 'available',
            currentTask: null,
            avatar: 'JS',
          },
          {
            id: 2,
            name: 'Maria Rodriguez',
            role: 'Inspector',
            skills: ['Quality Control', 'Documentation', 'Safety Compliance'],
            email: 'maria.rodriguez@example.com',
            phone: '555-987-6543',
            status: 'busy',
            currentTask: 'Inspecting Building A',
            avatar: 'MR',
          },
          {
            id: 3,
            name: 'David Chen',
            role: 'Mechanic',
            skills: ['Engines', 'Hydraulics', 'Welding'],
            email: 'david.chen@example.com',
            phone: '555-456-7890',
            status: 'available',
            currentTask: null,
            avatar: 'DC',
          },
        ];
        setResources(mockResources);
        setFilteredResources(mockResources);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = [...resources];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        resource => 
          resource.name.toLowerCase().includes(query) ||
          resource.role.toLowerCase().includes(query) ||
          resource.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }
    
    // Apply availability filter
    if (availabilityFilter) {
      filtered = filtered.filter(resource => resource.status === availabilityFilter);
    }
    
    setFilteredResources(filtered);
  };

  const onSearchChange = (query) => {
    setSearchQuery(query);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#10b981'; // green
      case 'busy':
        return '#f59e0b'; // amber
      case 'unavailable':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const renderResource = ({ item }) => (
    <Card style={styles.resourceCard}>
      <Card.Content>
        <View style={styles.resourceHeader}>
          <View style={styles.resourceInfo}>
            <Avatar.Text
              size={50}
              label={item.avatar}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.resourceDetails}>
              <Title style={styles.resourceName}>{item.name}</Title>
              <Paragraph style={styles.resourceRole}>{item.role}</Paragraph>
            </View>
          </View>
          <Badge 
            style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(item.status) }
            ]}
          >
            {item.status === 'available' ? 'Available' : item.status === 'busy' ? 'Busy' : 'Unavailable'}
          </Badge>
        </View>
        
        {item.currentTask && (
          <View style={styles.currentTaskContainer}>
            <Text style={styles.currentTaskLabel}>Current Task:</Text>
            <Text style={styles.currentTask}>{item.currentTask}</Text>
          </View>
        )}
        
        <View style={styles.skillsContainer}>
          <Text style={styles.skillsLabel}>Skills:</Text>
          <View style={styles.skillsChips}>
            {item.skills.map((skill, index) => (
              <Chip 
                key={index} 
                style={styles.skillChip}
                textStyle={styles.skillChipText}
              >
                {skill}
              </Chip>
            ))}
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.contactContainer}>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="email" size={16} color="#6b7280" />
            <Text style={styles.contactText}>{item.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="phone" size={16} color="#6b7280" />
            <Text style={styles.contactText}>{item.phone}</Text>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          <Button 
            mode="outlined" 
            icon="calendar" 
            style={styles.actionButton}
            onPress={() => {}}
          >
            Schedule
          </Button>
          <Button 
            mode="outlined" 
            icon="account-details" 
            style={styles.actionButton}
            onPress={() => {}}
          >
            Details
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="account-group" 
        size={60} 
        color="#d1d5db" 
      />
      <Text style={styles.emptyStateText}>
        {searchQuery || availabilityFilter
          ? 'No resources match your search criteria'
          : 'No resources found'}
      </Text>
      {(searchQuery || availabilityFilter) && (
        <Button 
          mode="outlined" 
          onPress={() => {
            setSearchQuery('');
            setAvailabilityFilter(null);
          }}
          style={styles.clearFiltersButton}
        >
          Clear Filters
        </Button>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search resources"
          onChangeText={onSearchChange}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
        >
          <Chip
            selected={availabilityFilter === 'available'}
            onPress={() => setAvailabilityFilter(
              availabilityFilter === 'available' ? null : 'available'
            )}
            style={[
              styles.filterChip,
              availabilityFilter === 'available' && { backgroundColor: '#10b981' }
            ]}
            textStyle={availabilityFilter === 'available' ? { color: 'white' } : null}
          >
            Available
          </Chip>
          
          <Chip
            selected={availabilityFilter === 'busy'}
            onPress={() => setAvailabilityFilter(
              availabilityFilter === 'busy' ? null : 'busy'
            )}
            style={[
              styles.filterChip,
              availabilityFilter === 'busy' && { backgroundColor: '#f59e0b' }
            ]}
            textStyle={availabilityFilter === 'busy' ? { color: 'white' } : null}
          >
            Busy
          </Chip>
          
          <Chip
            selected={availabilityFilter === 'unavailable'}
            onPress={() => setAvailabilityFilter(
              availabilityFilter === 'unavailable' ? null : 'unavailable'
            )}
            style={[
              styles.filterChip,
              availabilityFilter === 'unavailable' && { backgroundColor: '#ef4444' }
            ]}
            textStyle={availabilityFilter === 'unavailable' ? { color: 'white' } : null}
          >
            Unavailable
          </Chip>
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredResources}
          renderItem={renderResource}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
        />
      )}
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => {}}
        label={isSmallScreen ? undefined : "Add Resource"}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    backgroundColor: '#f3f4f6',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterChip: {
    margin: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  resourceCard: {
    marginBottom: 16,
    borderRadius: 10,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceDetails: {
    marginLeft: 16,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resourceRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    alignSelf: 'flex-start',
  },
  currentTaskContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTaskLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  currentTask: {
    fontSize: 14,
    color: '#6b7280',
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  skillsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    margin: 4,
  },
  skillChipText: {
    fontSize: 12,
  },
  divider: {
    marginBottom: 16,
  },
  contactContainer: {
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
  },
});

export default ResourcesScreen;