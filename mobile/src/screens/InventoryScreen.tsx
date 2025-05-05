import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, FAB, Searchbar, Text, Title, useTheme, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { get } from '../lib/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import shared types from your main schema
import { InventoryItemWithDetails } from '../../../shared/schema';

const InventoryScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithDetails[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchInventoryItems = async () => {
    setLoading(true);
    try {
      const data = await get<InventoryItemWithDetails[]>('/api/inventory-items/details');
      setInventoryItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error('Failed to fetch inventory items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchInventoryItems();
  }, []);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchInventoryItems();
  }, []);
  
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredItems(inventoryItems);
    } else {
      const filtered = inventoryItems.filter(
        (item) => 
          item.description?.toLowerCase().includes(query.toLowerCase()) ||
          item.partNumber.toLowerCase().includes(query.toLowerCase()) ||
          item.category?.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  };
  
  const navigateToDetail = (item: InventoryItemWithDetails) => {
    navigation.navigate('InventoryDetail', { itemId: item.id });
  };
  
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
  
  const renderInventoryCard = ({ item }: { item: InventoryItemWithDetails }) => {
    return (
      <TouchableOpacity onPress={() => navigateToDetail(item)}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.partNumber}>{item.partNumber}</Text>
              <Chip 
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getStockStatusColor(item) }]}
                textStyle={{ color: 'white', fontSize: 12 }}
              >
                {getStockStatusText(item)}
              </Chip>
            </View>
            
            <Title style={styles.title}>{item.description}</Title>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="tag" size={16} color="#666" style={styles.icon} />
                <Text style={styles.detailText}>
                  {item.category?.name || 'Uncategorized'}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="package-variant-closed" size={16} color="#666" style={styles.icon} />
                <Text style={styles.detailText}>
                  Qty: {item.quantityInStock}
                </Text>
              </View>
              
              {item.unitCost && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="currency-usd" size={16} color="#666" style={styles.icon} />
                  <Text style={styles.detailText}>
                    ${item.unitCost}
                  </Text>
                </View>
              )}
            </View>
            
            {item.location && (
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#666" style={styles.icon} />
                <Text style={styles.locationText}>{item.location}</Text>
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
        placeholder="Search inventory"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading inventory items...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderInventoryCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="package-variant-closed" 
                size={64} 
                color="#ccc" 
              />
              <Text style={styles.emptyText}>No inventory items found</Text>
            </View>
          }
        />
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('NewInventoryItem')}
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
  partNumber: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 24,
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  icon: {
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
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

export default InventoryScreen;