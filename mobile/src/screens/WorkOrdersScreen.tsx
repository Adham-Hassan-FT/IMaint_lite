import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Chip, FAB, Searchbar, Text, Title, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { get } from '../lib/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import shared types from your main schema
import { WorkOrderWithDetails } from '../../../shared/schema'; 

const WorkOrdersScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const data = await get<WorkOrderWithDetails[]>('/api/work-orders/details');
      setWorkOrders(data);
      setFilteredWorkOrders(data);
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchWorkOrders();
  }, []);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchWorkOrders();
  }, []);
  
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredWorkOrders(workOrders);
    } else {
      const filtered = workOrders.filter(
        (wo) => 
          wo.title.toLowerCase().includes(query.toLowerCase()) ||
          wo.description?.toLowerCase().includes(query.toLowerCase()) ||
          wo.workOrderNumber.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredWorkOrders(filtered);
    }
  };
  
  const navigateToDetail = (workOrder: WorkOrderWithDetails) => {
    navigation.navigate('WorkOrderDetail', { workOrderId: workOrder.id });
  };
  
  const renderWorkOrderCard = ({ item }: { item: WorkOrderWithDetails }) => {
    // Helper function to get status color
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'requested': return '#9ca3af';
        case 'approved': return '#60a5fa';
        case 'scheduled': return '#f59e0b';
        case 'in_progress': return '#10b981';
        case 'on_hold': return '#a855f7';
        case 'completed': return '#22c55e';
        case 'cancelled': return '#ef4444';
        default: return '#9ca3af';
      }
    };
    
    // Helper to format status text
    const formatStatus = (status: string) => {
      return status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    };
    
    // Helper to get priority icon
    const getPriorityIcon = (priority: string) => {
      switch (priority) {
        case 'low': return 'arrow-down';
        case 'medium': return 'arrow-right';
        case 'high': return 'arrow-up';
        case 'critical': return 'alert-circle';
        default: return 'arrow-right';
      }
    };
    
    // Helper to get priority color
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'low': return '#10b981';
        case 'medium': return '#f59e0b';
        case 'high': return '#ef4444';
        case 'critical': return '#7f1d1d';
        default: return '#f59e0b';
      }
    };
    
    return (
      <TouchableOpacity onPress={() => navigateToDetail(item)}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.workOrderNumber}>{item.workOrderNumber}</Text>
              <Chip 
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                textStyle={{ color: 'white', fontSize: 12 }}
              >
                {formatStatus(item.status)}
              </Chip>
            </View>
            
            <Title style={styles.title}>{item.title}</Title>
            <Text numberOfLines={2} style={styles.description}>
              {item.description || 'No description provided'}
            </Text>
            
            <Divider />
            
            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                <MaterialCommunityIcons 
                  name="calendar" 
                  size={16} 
                  color="#666" 
                  style={styles.footerIcon} 
                />
                <Text style={styles.footerText}>
                  {new Date(item.dateRequested).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.footerItem}>
                <MaterialCommunityIcons 
                  name="account" 
                  size={16} 
                  color="#666" 
                  style={styles.footerIcon} 
                />
                <Text style={styles.footerText}>
                  {item.assignedTo?.fullName || 'Unassigned'}
                </Text>
              </View>
              
              <View style={styles.footerItem}>
                <MaterialCommunityIcons 
                  name={getPriorityIcon(item.priority)} 
                  size={16} 
                  color={getPriorityColor(item.priority)} 
                  style={styles.footerIcon} 
                />
                <Text style={[styles.footerText, { color: getPriorityColor(item.priority) }]}>
                  {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search work orders"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading work orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkOrders}
          renderItem={renderWorkOrderCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="clipboard-text-outline" 
                size={64} 
                color="#ccc" 
              />
              <Text style={styles.emptyText}>No work orders found</Text>
            </View>
          }
        />
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('NewWorkOrder')}
        color="white"
      />
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workOrderNumber: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 24,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
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

export default WorkOrdersScreen;