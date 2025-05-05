import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Card, Text, Title, Divider, Button, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { get } from '../lib/api';
import { AssetWithDetails } from '../../../shared/schema';

type AssetDetailParams = {
  assetId: number;
};

const AssetDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: AssetDetailParams }, 'params'>>();
  const { assetId } = route.params;
  
  const [asset, setAsset] = useState<AssetWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchAssetDetails = async () => {
    setLoading(true);
    try {
      const data = await get<AssetWithDetails>(`/api/assets/${assetId}/details`);
      setAsset(data);
    } catch (error) {
      console.error('Failed to fetch asset details:', error);
      Alert.alert('Error', 'Failed to load asset details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchAssetDetails();
  }, [assetId]);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAssetDetails();
  }, [assetId]);
  
  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return '#22c55e';
      case 'maintenance': return '#f59e0b';
      case 'broken': return '#ef4444';
      case 'retired': return '#9ca3af';
      default: return '#9ca3af';
    }
  };
  
  // Helper to format status text
  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  // Helper to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading asset details...</Text>
      </View>
    );
  }
  
  if (!asset) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Asset not found</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        >
          Go Back
        </Button>
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
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.assetNumber}>{asset.assetNumber}</Text>
          <Title style={styles.title}>{asset.description}</Title>
          
          <View style={styles.statusRow}>
            <Chip 
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(asset.status) }]}
              textStyle={{ color: 'white' }}
            >
              {formatStatus(asset.status)}
            </Chip>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {asset.type?.name || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Manufacturer:</Text>
            <Text style={styles.detailValue}>
              {asset.manufacturer || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model:</Text>
            <Text style={styles.detailValue}>
              {asset.model || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serial Number:</Text>
            <Text style={styles.detailValue}>
              {asset.serialNumber || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>
              {asset.location || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Acquisition Date:</Text>
            <Text style={styles.detailValue}>
              {asset.acquisitionDate ? formatDate(asset.acquisitionDate) : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase Price:</Text>
            <Text style={styles.detailValue}>
              {asset.purchasePrice ? `$${asset.purchasePrice}` : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parent Asset:</Text>
            <Text style={styles.detailValue}>
              {asset.parent ? `${asset.parent.assetNumber} - ${asset.parent.description}` : 'None'}
            </Text>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Maintenance History</Text>
          
          {asset.workOrders && asset.workOrders.length > 0 ? (
            asset.workOrders.map((workOrder) => (
              <TouchableOpacity 
                key={workOrder.id}
                onPress={() => navigation.navigate('WorkOrderDetail', { workOrderId: workOrder.id })}
              >
                <Card style={styles.workOrderCard}>
                  <Card.Content>
                    <View style={styles.workOrderHeader}>
                      <Text style={styles.workOrderNumber}>{workOrder.workOrderNumber}</Text>
                      <Chip
                        mode="flat"
                        style={[
                          styles.miniStatusChip, 
                          { 
                            backgroundColor: 
                              workOrder.status === 'completed' ? '#22c55e' :
                              workOrder.status === 'cancelled' ? '#ef4444' :
                              workOrder.status === 'in_progress' ? '#10b981' :
                              '#f59e0b'
                          }
                        ]}
                        textStyle={{ color: 'white', fontSize: 10 }}
                      >
                        {workOrder.status.replace('_', ' ').toUpperCase()}
                      </Chip>
                    </View>
                    
                    <Text style={styles.workOrderTitle}>{workOrder.title}</Text>
                    
                    <View style={styles.workOrderDetails}>
                      <View style={styles.workOrderDetail}>
                        <MaterialCommunityIcons 
                          name="calendar" 
                          size={14} 
                          color="#666" 
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.workOrderDetailText}>
                          {formatDate(workOrder.dateRequested)}
                        </Text>
                      </View>
                      
                      {workOrder.estimatedHours && (
                        <View style={styles.workOrderDetail}>
                          <MaterialCommunityIcons 
                            name="clock-outline" 
                            size={14} 
                            color="#666" 
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.workOrderDetailText}>
                            {workOrder.estimatedHours} hours
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No maintenance records found</Text>
          )}
        </Card.Content>
      </Card>
      
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actions}>
            <Button 
              mode="contained" 
              icon="clipboard-plus"
              onPress={() => navigation.navigate('NewWorkOrder', { assetId: asset.id })}
              style={styles.actionButton}
            >
              New Work Order
            </Button>
            <Button 
              mode="outlined" 
              icon="pencil"
              onPress={() => navigation.navigate('EditAsset', { assetId: asset.id })}
              style={styles.actionButton}
            >
              Edit Asset
            </Button>
          </View>
        </Card.Content>
      </Card>
      
      <View style={styles.bottomPadding} />
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
  },
  assetNumber: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 20,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusChip: {
    height: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 120,
    fontWeight: '500',
    color: '#333',
  },
  detailValue: {
    flex: 1,
    color: '#666',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  workOrderCard: {
    marginVertical: 8,
    backgroundColor: '#f9fafb',
  },
  workOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workOrderNumber: {
    fontSize: 12,
    color: '#666',
  },
  workOrderTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginVertical: 4,
  },
  workOrderDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  workOrderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  workOrderDetailText: {
    fontSize: 12,
    color: '#666',
  },
  miniStatusChip: {
    height: 20,
    paddingHorizontal: 4,
  },
  actionsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  bottomPadding: {
    height: 40,
  },
});

export default AssetDetailScreen;