import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Text, Title, Button, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { get } from '../lib/api';
import { InventoryItemWithDetails } from '../../../shared/schema';

type InventoryDetailParams = {
  itemId: number;
};

const InventoryDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: InventoryDetailParams }, 'params'>>();
  const { itemId } = route.params;
  
  const [item, setItem] = useState<InventoryItemWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchInventoryItemDetails = async () => {
    setLoading(true);
    try {
      const data = await get<InventoryItemWithDetails>(`/api/inventory-items/${itemId}/details`);
      setItem(data);
    } catch (error) {
      console.error('Failed to fetch inventory item details:', error);
      Alert.alert('Error', 'Failed to load inventory item details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchInventoryItemDetails();
  }, [itemId]);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchInventoryItemDetails();
  }, [itemId]);
  
  const getStockStatusColor = (item: InventoryItemWithDetails) => {
    if (!item.minimumStock || item.minimumStock <= 0) {
      return '#22c55e'; // Green for items without minimum stock
    }
    
    if (item.quantityInStock <= 0) {
      return '#ef4444'; // Red for out of stock
    }
    
    if (item.quantityInStock <= item.minimumStock) {
      return '#f59e0b'; // Amber for low stock
    }
    
    return '#22c55e'; // Green for adequate stock
  };
  
  const getStockStatusText = (item: InventoryItemWithDetails) => {
    if (item.quantityInStock <= 0) {
      return 'Out of Stock';
    }
    
    if (item.minimumStock && item.quantityInStock <= item.minimumStock) {
      return 'Low Stock';
    }
    
    return 'In Stock';
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading inventory item details...</Text>
      </View>
    );
  }
  
  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Inventory item not found</Text>
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
          <View style={styles.headerTopRow}>
            <Text style={styles.partNumber}>{item.partNumber}</Text>
            <Chip 
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStockStatusColor(item) }]}
              textStyle={{ color: 'white' }}
            >
              {getStockStatusText(item)}
            </Chip>
          </View>
          
          <Title style={styles.title}>{item.description}</Title>
          
          <View style={styles.quantityRow}>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>
                Quantity: {item.quantityInStock} {item.unitOfMeasure || 'units'}
              </Text>
            </View>
            
            {item.minimumStock !== null && item.minimumStock !== undefined && (
              <View style={styles.minimumBadge}>
                <Text style={styles.minimumText}>
                  Min: {item.minimumStock}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>
              {item.category?.name || 'Uncategorized'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Manufacturer:</Text>
            <Text style={styles.detailValue}>
              {item.manufacturer || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Model:</Text>
            <Text style={styles.detailValue}>
              {item.model || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>
              {item.location || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unit Cost:</Text>
            <Text style={styles.detailValue}>
              {item.unitCost ? `$${item.unitCost}` : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Value:</Text>
            <Text style={styles.detailValue}>
              {item.unitCost ? `$${(parseFloat(item.unitCost) * item.quantityInStock).toFixed(2)}` : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Critical Part:</Text>
            <Text style={styles.detailValue}>
              {item.isCritical ? 'Yes' : 'No'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.detailValue}>
              {item.notes || 'No notes available'}
            </Text>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Stock Actions</Text>
          <View style={styles.actions}>
            <Button 
              mode="contained" 
              icon="plus"
              onPress={() => Alert.alert('Stock In', 'This would open the stock in form')}
              style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
            >
              Stock In
            </Button>
            <Button 
              mode="contained" 
              icon="minus"
              onPress={() => Alert.alert('Stock Out', 'This would open the stock out form')}
              style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
            >
              Stock Out
            </Button>
          </View>
          <View style={styles.actions}>
            <Button 
              mode="outlined" 
              icon="history"
              onPress={() => Alert.alert('Stock History', 'This would show the stock history')}
              style={styles.actionButton}
            >
              History
            </Button>
            <Button 
              mode="outlined" 
              icon="pencil"
              onPress={() => navigation.navigate('EditInventoryItem', { itemId: item.id })}
              style={styles.actionButton}
            >
              Edit
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
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
  },
  partNumber: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 20,
    marginVertical: 8,
  },
  statusChip: {
    height: 28,
  },
  quantityRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  quantityBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  quantityText: {
    color: 'white',
    fontWeight: '500',
  },
  minimumBadge: {
    backgroundColor: '#f59e0b',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  minimumText: {
    color: 'white',
    fontWeight: '500',
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
  actionsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  bottomPadding: {
    height: 40,
  },
});

export default InventoryDetailScreen;