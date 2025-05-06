import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Badge,
  Divider,
  List,
  useTheme,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import axios from 'axios';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Mock data for dashboard widgets
interface WorkOrderSummary {
  status: string;
  count: number;
  color: string;
}

interface AssetStatus {
  status: string;
  count: number;
  color: string;
}

interface WorkOrder {
  id: number;
  workOrderNumber: string;
  title: string;
  status: string;
  priority: string;
  dateNeeded: string;
  asset?: {
    description: string;
  };
}

// Dashboard component
const DashboardScreen = () => {
  const [workOrderSummary, setWorkOrderSummary] = useState<WorkOrderSummary[]>([]);
  const [assetSummary, setAssetSummary] = useState<AssetStatus[]>([]);
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 768;

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get work orders to generate summary
        const workOrdersResponse = await axios.get('/api/work-orders/details');
        const workOrders = workOrdersResponse.data;
        
        // Calculate work order summary
        const woSummary = generateWorkOrderSummary(workOrders);
        setWorkOrderSummary(woSummary);
        
        // Get assets to generate summary
        const assetsResponse = await axios.get('/api/assets');
        const assets = assetsResponse.data;
        
        // Calculate asset summary
        const assetSummary = generateAssetSummary(assets);
        setAssetSummary(assetSummary);
        
        // Set recent work orders (most recent 5)
        const recent = workOrders
          .sort((a: WorkOrder, b: WorkOrder) => 
            new Date(b.dateNeeded).getTime() - new Date(a.dateNeeded).getTime()
          )
          .slice(0, 5);
        setRecentWorkOrders(recent);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Generate work order summary
  const generateWorkOrderSummary = (workOrders: any[]): WorkOrderSummary[] => {
    const statusCounts = {
      'requested': { count: 0, color: '#3b82f6' },
      'assigned': { count: 0, color: '#f59e0b' },
      'in-progress': { count: 0, color: '#8b5cf6' },
      'on-hold': { count: 0, color: '#6b7280' },
      'completed': { count: 0, color: '#10b981' },
      'cancelled': { count: 0, color: '#ef4444' },
    };

    workOrders.forEach(wo => {
      if (statusCounts[wo.status]) {
        statusCounts[wo.status].count++;
      }
    });

    return Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status].count,
      color: statusCounts[status].color,
    }));
  };

  // Generate asset summary
  const generateAssetSummary = (assets: any[]): AssetStatus[] => {
    const statusCounts = {
      'operational': { count: 0, color: '#10b981' },
      'needs-maintenance': { count: 0, color: '#f59e0b' },
      'under-repair': { count: 0, color: '#8b5cf6' },
      'out-of-service': { count: 0, color: '#ef4444' },
    };

    assets.forEach(asset => {
      if (statusCounts[asset.status]) {
        statusCounts[asset.status].count++;
      }
    });

    return Object.keys(statusCounts).map(status => ({
      status,
      count: statusCounts[status].count,
      color: statusCounts[status].color,
    }));
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header section with welcome message */}
        <View style={styles.headerSection}>
          <View>
            <Title style={styles.welcomeText}>Welcome back</Title>
            <Paragraph style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Paragraph>
          </View>
          <IconButton 
            icon="bell" 
            size={24} 
            onPress={() => {}} 
            style={styles.notificationButton}
          />
        </View>

        {/* Work Orders Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Work Orders</Title>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('WorkOrders')}
                labelStyle={styles.viewAllButton}
              >
                View All
              </Button>
            </View>
            
            <View style={isSmallScreen ? styles.statGridMobile : styles.statGrid}>
              {workOrderSummary.map((item, index) => (
                <View key={index} style={styles.statItem}>
                  <Badge
                    size={40}
                    style={[styles.statBadge, { backgroundColor: item.color }]}
                  >
                    {item.count}
                  </Badge>
                  <Text style={styles.statLabel}>
                    {formatStatus(item.status)}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Asset Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Assets Status</Title>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Assets')}
                labelStyle={styles.viewAllButton}
              >
                View All
              </Button>
            </View>
            
            <View style={isSmallScreen ? styles.statGridMobile : styles.statGrid}>
              {assetSummary.map((item, index) => (
                <View key={index} style={styles.statItem}>
                  <Badge
                    size={40}
                    style={[styles.statBadge, { backgroundColor: item.color }]}
                  >
                    {item.count}
                  </Badge>
                  <Text style={styles.statLabel}>
                    {formatStatus(item.status)}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Recent Work Orders */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Recent Work Orders</Title>
            
            {recentWorkOrders.map((workOrder, index) => (
              <TouchableOpacity 
                key={index}
                onPress={() => navigation.navigate('WorkOrderDetail', { workOrderId: workOrder.id })}
              >
                <View style={styles.workOrderItem}>
                  <View style={styles.workOrderContent}>
                    <View style={styles.workOrderHeader}>
                      <Text style={styles.workOrderNumber}>{workOrder.workOrderNumber}</Text>
                      <Badge 
                        style={[
                          styles.priorityBadge, 
                          { backgroundColor: getPriorityColor(workOrder.priority) }
                        ]}
                      >
                        {workOrder.priority}
                      </Badge>
                    </View>
                    <Text style={styles.workOrderTitle}>{workOrder.title}</Text>
                    {workOrder.asset && (
                      <Text style={styles.workOrderAsset}>{workOrder.asset.description}</Text>
                    )}
                    <View style={styles.workOrderFooter}>
                      <Text style={styles.workOrderDate}>
                        Needed by: {formatDate(workOrder.dateNeeded)}
                      </Text>
                      <Badge 
                        style={[
                          styles.statusBadge, 
                          { backgroundColor: getStatusColor(workOrder.status) }
                        ]}
                      >
                        {formatStatus(workOrder.status)}
                      </Badge>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                </View>
                {index < recentWorkOrders.length - 1 && <Divider />}
              </TouchableOpacity>
            ))}

            {recentWorkOrders.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={50} color="#d1d5db" />
                <Text style={styles.emptyStateText}>No recent work orders</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            
            <View style={isSmallScreen ? styles.actionsGridMobile : styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('WorkOrders')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
                  <MaterialCommunityIcons name="clipboard-plus" size={28} color="white" />
                </View>
                <Text style={styles.actionText}>New Work Order</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Scanner')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#8b5cf6' }]}>
                  <MaterialCommunityIcons name="barcode-scan" size={28} color="white" />
                </View>
                <Text style={styles.actionText}>Scan Asset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Inventory')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                  <MaterialCommunityIcons name="package-variant-plus" size={28} color="white" />
                </View>
                <Text style={styles.actionText}>Add Inventory</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Resources')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#f59e0b' }]}>
                  <MaterialCommunityIcons name="account-group" size={28} color="white" />
                </View>
                <Text style={styles.actionText}>Resources</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateText: {
    color: '#6b7280',
  },
  notificationButton: {
    backgroundColor: '#e5e7eb',
  },
  card: {
    marginBottom: 16,
    elevation: 1,
    borderRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#3b82f6',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statBadge: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#4b5563',
  },
  workOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  workOrderContent: {
    flex: 1,
  },
  workOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  workOrderNumber: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workOrderAsset: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  workOrderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  workOrderDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  priorityBadge: {
    fontSize: 10,
    height: 20,
    textTransform: 'capitalize',
  },
  statusBadge: {
    fontSize: 10,
    height: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 10,
    color: '#9ca3af',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionsGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default DashboardScreen;