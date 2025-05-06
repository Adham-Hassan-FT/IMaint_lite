import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Text,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Badge,
  Searchbar,
  FAB,
  Divider,
  Chip,
  Portal,
  Dialog,
  Button,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import axios from 'axios';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// WorkOrder interface
interface WorkOrder {
  id: number;
  workOrderNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dateRequested: string;
  dateNeeded: string;
  asset?: {
    id: number;
    description: string;
  };
  requestedBy?: {
    fullName: string;
  };
  assignedTo?: {
    fullName: string;
  };
  type?: {
    name: string;
  };
}

const WorkOrdersScreen = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 768;

  // Fetch work orders
  useEffect(() => {
    fetchWorkOrders();
  }, []);

  // Apply filters
  useEffect(() => {
    filterWorkOrders();
  }, [searchQuery, statusFilter, priorityFilter, workOrders]);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/work-orders/details');
      setWorkOrders(response.data);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWorkOrders();
  };

  const filterWorkOrders = () => {
    let filtered = [...workOrders];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        wo => 
          wo.workOrderNumber.toLowerCase().includes(query) ||
          wo.title.toLowerCase().includes(query) ||
          wo.description.toLowerCase().includes(query) ||
          (wo.asset?.description && wo.asset.description.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(wo => wo.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(wo => wo.priority === priorityFilter);
    }
    
    setFilteredWorkOrders(filtered);
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setPriorityFilter(null);
    setFilterVisible(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return '#3b82f6';
      case 'assigned':
        return '#f59e0b';
      case 'in-progress':
        return '#8b5cf6';
      case 'on-hold':
        return '#6b7280';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Render a work order item
  const renderWorkOrderItem = ({ item }: { item: WorkOrder }) => (
    <TouchableOpacity 
      style={styles.workOrderItem}
      onPress={() => navigation.navigate('WorkOrderDetail', { workOrderId: item.id })}
    >
      <View style={styles.workOrderHeader}>
        <Text style={styles.workOrderNumber}>{item.workOrderNumber}</Text>
        <Badge 
          style={[
            styles.priorityBadge, 
            { backgroundColor: getPriorityColor(item.priority) }
          ]}
        >
          {item.priority}
        </Badge>
      </View>
      
      <Text style={styles.workOrderTitle}>{item.title}</Text>
      
      {item.asset && (
        <View style={styles.workOrderAssetRow}>
          <MaterialCommunityIcons name="dolly" size={16} color="#6b7280" />
          <Text style={styles.workOrderAsset}>{item.asset.description}</Text>
        </View>
      )}
      
      {item.type && (
        <View style={styles.workOrderTypeRow}>
          <MaterialCommunityIcons name="tag" size={16} color="#6b7280" />
          <Text style={styles.workOrderType}>{item.type.name}</Text>
        </View>
      )}
      
      <View style={styles.workOrderFooter}>
        <View style={styles.workOrderDates}>
          <Text style={styles.workOrderDateLabel}>Needed by:</Text>
          <Text style={styles.workOrderDate}>{formatDate(item.dateNeeded)}</Text>
        </View>
        
        <Badge 
          style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.status) }
          ]}
        >
          {formatStatus(item.status)}
        </Badge>
      </View>
      
      {item.assignedTo && (
        <View style={styles.workOrderAssigneeRow}>
          <MaterialCommunityIcons name="account" size={16} color="#6b7280" />
          <Text style={styles.workOrderAssignee}>
            Assigned to: {item.assignedTo.fullName}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render separator between items
  const renderSeparator = () => <Divider style={styles.divider} />;

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="clipboard-text-outline" 
        size={60} 
        color="#d1d5db" 
      />
      <Text style={styles.emptyStateText}>
        {searchQuery || statusFilter || priorityFilter
          ? 'No work orders match your search criteria'
          : 'No work orders found'}
      </Text>
      {(searchQuery || statusFilter || priorityFilter) && (
        <Button 
          mode="outlined" 
          onPress={clearFilters}
          style={styles.clearFiltersButton}
        >
          Clear Filters
        </Button>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search work orders"
            onChangeText={onSearchChange}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterVisible(true)}
          >
            <MaterialCommunityIcons 
              name="filter-variant" 
              size={24} 
              color={statusFilter || priorityFilter ? theme.colors.primary : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Active filters display */}
        {(statusFilter || priorityFilter) && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersContent}
            >
              {statusFilter && (
                <Chip 
                  mode="outlined"
                  onClose={() => setStatusFilter(null)}
                  style={[styles.filterChip, { borderColor: getStatusColor(statusFilter) }]}
                  textStyle={{ color: getStatusColor(statusFilter) }}
                >
                  Status: {formatStatus(statusFilter)}
                </Chip>
              )}
              
              {priorityFilter && (
                <Chip 
                  mode="outlined"
                  onClose={() => setPriorityFilter(null)}
                  style={[styles.filterChip, { borderColor: getPriorityColor(priorityFilter) }]}
                  textStyle={{ color: getPriorityColor(priorityFilter) }}
                >
                  Priority: {priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                </Chip>
              )}
            </ScrollView>
          </View>
        )}
        
        <FlatList
          data={filteredWorkOrders}
          renderItem={renderWorkOrderItem}
          keyExtractor={item => item.id.toString()}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={styles.workOrderList}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
        
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => {}}
          label={isSmallScreen ? undefined : "New Work Order"}
        />
        
        {/* Filter Dialog */}
        <Portal>
          <Dialog
            visible={filterVisible}
            onDismiss={() => setFilterVisible(false)}
            style={styles.filterDialog}
          >
            <Dialog.Title>Filter Work Orders</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterChipsContainer}>
                {['requested', 'assigned', 'in-progress', 'on-hold', 'completed', 'cancelled'].map(status => (
                  <Chip
                    key={status}
                    selected={statusFilter === status}
                    onPress={() => setStatusFilter(statusFilter === status ? null : status)}
                    style={[
                      styles.filterOptionChip,
                      statusFilter === status && { backgroundColor: getStatusColor(status) }
                    ]}
                    textStyle={statusFilter === status ? styles.selectedChipText : undefined}
                  >
                    {formatStatus(status)}
                  </Chip>
                ))}
              </View>
              
              <Text style={styles.filterSectionTitle}>Priority</Text>
              <View style={styles.filterChipsContainer}>
                {['high', 'medium', 'low'].map(priority => (
                  <Chip
                    key={priority}
                    selected={priorityFilter === priority}
                    onPress={() => setPriorityFilter(priorityFilter === priority ? null : priority)}
                    style={[
                      styles.filterOptionChip,
                      priorityFilter === priority && { backgroundColor: getPriorityColor(priority) }
                    ]}
                    textStyle={priorityFilter === priority ? styles.selectedChipText : undefined}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Chip>
                ))}
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={clearFilters}>Clear All</Button>
              <Button onPress={() => setFilterVisible(false)}>Apply</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#f3f4f6',
  },
  filterButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  activeFiltersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  activeFiltersContent: {
    paddingHorizontal: 8,
  },
  filterChip: {
    marginHorizontal: 4,
    height: 32,
  },
  workOrderList: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  workOrderItem: {
    padding: 16,
    backgroundColor: '#fff',
  },
  workOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workOrderNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  priorityBadge: {
    textTransform: 'capitalize',
    height: 22,
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  workOrderAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  workOrderAsset: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  workOrderTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workOrderType: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  workOrderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  workOrderDates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workOrderDateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 4,
  },
  workOrderDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
  },
  statusBadge: {
    height: 22,
  },
  workOrderAssigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workOrderAssignee: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
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
  filterDialog: {
    borderRadius: 8,
  },
  filterSectionTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOptionChip: {
    margin: 4,
  },
  selectedChipText: {
    color: 'white',
  },
});

export default WorkOrdersScreen;