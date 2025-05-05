import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Title, Divider, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { get } from '../lib/api';

// Dashboard summary types
interface WorkOrderSummary {
  total: number;
  pending: number;
  inProgress: number;
  overdue: number;
}

interface MaintenanceSummary {
  total: number;
  upcoming: number;
  overdue: number;
}

interface AssetSummary {
  total: number;
  operational: number;
  underMaintenance: number;
  broken: number;
}

interface InventorySummary {
  total: number;
  lowStock: number;
}

const DashboardScreen = () => {
  const { user } = useAuth();
  const theme = useTheme();

  const [workOrderSummary, setWorkOrderSummary] = useState<WorkOrderSummary | null>(null);
  const [maintenanceSummary, setMaintenanceSummary] = useState<MaintenanceSummary | null>(null);
  const [assetSummary, setAssetSummary] = useState<AssetSummary | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // For now, use simulated data
      // In production, these would be actual API calls like:
      // const woSummary = await get<WorkOrderSummary>('/api/dashboard/work-orders');
      
      // Simulated data for demonstration
      const woSummary: WorkOrderSummary = {
        total: 24,
        pending: 8,
        inProgress: 12,
        overdue: 4
      };
      
      const mainSummary: MaintenanceSummary = {
        total: 32,
        upcoming: 6,
        overdue: 2
      };
      
      const astSummary: AssetSummary = {
        total: 156,
        operational: 142,
        underMaintenance: 10,
        broken: 4
      };
      
      const invSummary: InventorySummary = {
        total: 278,
        lowStock: 12
      };
      
      setWorkOrderSummary(woSummary);
      setMaintenanceSummary(mainSummary);
      setAssetSummary(astSummary);
      setInventorySummary(invSummary);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Title style={styles.title}>Dashboard</Title>
        <Text style={styles.subtitle}>Welcome back, {user?.fullName || 'User'}</Text>
      </View>

      <View style={styles.summaryContainer}>
        {/* Work Orders Summary */}
        <Card style={styles.card}>
          <Card.Title 
            title="Work Orders" 
            left={(props) => <MaterialCommunityIcons name="clipboard-list" {...props} size={30} color={theme.colors.primary} />}
          />
          <Card.Content>
            <View style={styles.statsRow}>
              <StatItem 
                value={workOrderSummary?.total || 0} 
                label="Total" 
                icon="clipboard-list" 
                color={theme.colors.primary}
              />
              <StatItem 
                value={workOrderSummary?.pending || 0} 
                label="Pending" 
                icon="clock-outline" 
                color="#f59e0b"
              />
            </View>
            <View style={styles.statsRow}>
              <StatItem 
                value={workOrderSummary?.inProgress || 0} 
                label="In Progress" 
                icon="progress-wrench" 
                color="#10b981"
              />
              <StatItem 
                value={workOrderSummary?.overdue || 0} 
                label="Overdue" 
                icon="alert" 
                color="#ef4444"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Preventive Maintenance Summary */}
        <Card style={styles.card}>
          <Card.Title 
            title="Preventive Maintenance" 
            left={(props) => <MaterialCommunityIcons name="calendar-check" {...props} size={30} color={theme.colors.primary} />}
          />
          <Card.Content>
            <View style={styles.statsRow}>
              <StatItem 
                value={maintenanceSummary?.total || 0} 
                label="Total" 
                icon="clipboard-list" 
                color={theme.colors.primary}
              />
              <StatItem 
                value={maintenanceSummary?.upcoming || 0} 
                label="Upcoming" 
                icon="calendar-clock" 
                color="#f59e0b"
              />
              <StatItem 
                value={maintenanceSummary?.overdue || 0} 
                label="Overdue" 
                icon="alert" 
                color="#ef4444"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Assets Summary */}
        <Card style={styles.card}>
          <Card.Title 
            title="Assets" 
            left={(props) => <MaterialCommunityIcons name="dolly" {...props} size={30} color={theme.colors.primary} />}
          />
          <Card.Content>
            <View style={styles.statsRow}>
              <StatItem 
                value={assetSummary?.total || 0} 
                label="Total" 
                icon="clipboard-list" 
                color={theme.colors.primary}
              />
              <StatItem 
                value={assetSummary?.operational || 0} 
                label="Operational" 
                icon="check-circle" 
                color="#10b981"
              />
            </View>
            <View style={styles.statsRow}>
              <StatItem 
                value={assetSummary?.underMaintenance || 0} 
                label="Under Maintenance" 
                icon="wrench" 
                color="#f59e0b"
              />
              <StatItem 
                value={assetSummary?.broken || 0} 
                label="Broken" 
                icon="alert-circle" 
                color="#ef4444"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Inventory Summary */}
        <Card style={styles.card}>
          <Card.Title 
            title="Inventory" 
            left={(props) => <MaterialCommunityIcons name="package-variant-closed" {...props} size={30} color={theme.colors.primary} />}
          />
          <Card.Content>
            <View style={styles.statsRow}>
              <StatItem 
                value={inventorySummary?.total || 0} 
                label="Total Items" 
                icon="package-variant-closed" 
                color={theme.colors.primary}
              />
              <StatItem 
                value={inventorySummary?.lowStock || 0} 
                label="Low Stock" 
                icon="alert-outline" 
                color="#ef4444"
              />
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

// Stat Item Component
interface StatItemProps {
  value: number;
  label: string;
  icon: string;
  color: string;
}

const StatItem = ({ value, label, icon, color }: StatItemProps) => {
  return (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  header: {
    padding: 16,
    backgroundColor: '#3b82f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  summaryContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default DashboardScreen;