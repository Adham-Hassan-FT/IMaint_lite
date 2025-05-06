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
  Card,
  List,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import axios from 'axios';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Inventory Item interface
interface InventoryItem {
  id: number;
  partNumber: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  location: string;
  minQuantity: number;
  categoryId: number;
  notes: string;
  category?: {
    name: string;
    description: string;
  };
}

const InventoryScreen = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null); // 'low', 'in-stock', 'out-of-stock'
  const [filterVisible, setFilterVisible] = useState(false);
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 768;

  // Fetch inventory
  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  // Apply filters
  useEffect(() => {
    filterInventory();
  }, [searchQuery, categoryFilter, stockFilter, inventoryItems]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory/details');
      setInventoryItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/inventory/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const filterInventory = () => {
    let filtered = [...inventoryItems];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.partNumber.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query) ||
          (item.category?.name && item.category.name.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.categoryId === categoryFilter);
    }
    
    // Apply stock filter
    if (stockFilter) {
      switch (stockFilter) {
        case 'low':
          filtered = filtered.filter(item => item.quantity <= item.minQuantity && item.quantity > 0);
          break;
        case 'out-of-stock':
          filtered = filtered.filter(item => item.quantity === 0);
          break;
        case 'in-stock':
          filtered = filtered.filter(item => item.quantity > item.minQuantity);
          break;
      }
    }
    
    setFilteredItems(filtered);
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setCategoryFilter(null);
    setStockFilter(null);
    setFilterVisible(false);
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return '#ef4444'; // red for out of stock
    } else if (item.quantity <= item.minQuantity) {
      return '#f59e0b'; // amber for low stock
    } else {
      return '#10b981'; // green for in stock
    }
  };

  const getStockStatusText = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return 'Out of Stock';
    } else if (item.quantity <= item.minQuantity) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };
  
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Render an inventory item
  const renderInventoryItem = ({ item }: { item: InventoryItem }) => (
    <Card style={styles.itemCard}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('InventoryDetail', { itemId: item.id })}
      >
        <Card.Content>
          <View style={styles.itemHeader}>
            <Text style={styles.partNumber}>{item.partNumber}</Text>
            <Badge 
              style={[
                styles.stockBadge, 
                { backgroundColor: getStockStatusColor(item) }
              ]}
            >
              {getStockStatusText(item)}
            </Badge>
          </View>
          
          <Text style={styles.itemTitle}>{item.description}</Text>
          
          <View style={styles.itemDetailRow}>
            <MaterialCommunityIcons name="tag" size={16} color="#6b7280" />
            <Text style={styles.itemDetailText}>
              {item.category ? item.category.name : getCategoryName(item.categoryId)}
            </Text>
          </View>
          
          {item.location && (
            <View style={styles.itemDetailRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
              <Text style={styles.itemDetailText}>{item.location}</Text>
            </View>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.itemFooter}>
            <View>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityDisplay}>
                <Text style={[
                  styles.quantityValue,
                  { color: getStockStatusColor(item) }
                ]}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={styles.minimumText}>
                  (Min: {item.minQuantity})
                </Text>
              </View>
            </View>
            
            <View>
              <Text style={styles.costLabel}>Unit Cost:</Text>
              <Text style={styles.costValue}>{formatCurrency(item.unitCost)}</Text>
            </View>
          </View>
          
          <View style={styles.totalValueContainer}>
            <Text style={styles.totalValueLabel}>Total Value:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(item.quantity * item.unitCost)}
            </Text>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="package-variant" 
        size={60} 
        color="#d1d5db" 
      />
      <Text style={styles.emptyStateText}>
        {searchQuery || categoryFilter || stockFilter
          ? 'No inventory items match your search criteria'
          : 'No inventory items found'}
      </Text>
      {(searchQuery || categoryFilter || stockFilter) && (
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
            placeholder="Search inventory"
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
              color={categoryFilter || stockFilter ? theme.colors.primary : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Active filters display */}
        {(categoryFilter || stockFilter) && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersContent}
            >
              {categoryFilter && (
                <Chip 
                  mode="outlined"
                  onClose={() => setCategoryFilter(null)}
                  style={styles.filterChip}
                >
                  Category: {getCategoryName(categoryFilter)}
                </Chip>
              )}
              
              {stockFilter && (
                <Chip 
                  mode="outlined"
                  onClose={() => setStockFilter(null)}
                  style={[
                    styles.filterChip, 
                    { 
                      borderColor: stockFilter === 'out-of-stock' 
                        ? '#ef4444' 
                        : stockFilter === 'low' 
                          ? '#f59e0b' 
                          : '#10b981' 
                    }
                  ]}
                  textStyle={{ 
                    color: stockFilter === 'out-of-stock' 
                      ? '#ef4444' 
                      : stockFilter === 'low' 
                        ? '#f59e0b' 
                        : '#10b981' 
                  }}
                >
                  {stockFilter === 'out-of-stock' 
                    ? 'Out of Stock' 
                    : stockFilter === 'low' 
                      ? 'Low Stock' 
                      : 'In Stock'}
                </Chip>
              )}
            </ScrollView>
          </View>
        )}
        
        <FlatList
          data={filteredItems}
          renderItem={renderInventoryItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.itemList}
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
          label={isSmallScreen ? undefined : "Add Item"}
        />
        
        {/* Filter Dialog */}
        <Portal>
          <Dialog
            visible={filterVisible}
            onDismiss={() => setFilterVisible(false)}
            style={styles.filterDialog}
          >
            <Dialog.Title>Filter Inventory</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.filterSectionTitle}>Stock Status</Text>
              <View style={styles.filterChipsContainer}>
                <Chip
                  selected={stockFilter === 'in-stock'}
                  onPress={() => setStockFilter(stockFilter === 'in-stock' ? null : 'in-stock')}
                  style={[
                    styles.filterOptionChip,
                    stockFilter === 'in-stock' && { backgroundColor: '#10b981' }
                  ]}
                  textStyle={stockFilter === 'in-stock' ? styles.selectedChipText : undefined}
                >
                  In Stock
                </Chip>
                
                <Chip
                  selected={stockFilter === 'low'}
                  onPress={() => setStockFilter(stockFilter === 'low' ? null : 'low')}
                  style={[
                    styles.filterOptionChip,
                    stockFilter === 'low' && { backgroundColor: '#f59e0b' }
                  ]}
                  textStyle={stockFilter === 'low' ? styles.selectedChipText : undefined}
                >
                  Low Stock
                </Chip>
                
                <Chip
                  selected={stockFilter === 'out-of-stock'}
                  onPress={() => setStockFilter(stockFilter === 'out-of-stock' ? null : 'out-of-stock')}
                  style={[
                    styles.filterOptionChip,
                    stockFilter === 'out-of-stock' && { backgroundColor: '#ef4444' }
                  ]}
                  textStyle={stockFilter === 'out-of-stock' ? styles.selectedChipText : undefined}
                >
                  Out of Stock
                </Chip>
              </View>
              
              <Text style={styles.filterSectionTitle}>Category</Text>
              <ScrollView style={styles.categoryFilterScrollView}>
                <View style={styles.filterChipsContainer}>
                  {categories.map(category => (
                    <Chip
                      key={category.id}
                      selected={categoryFilter === category.id}
                      onPress={() => setCategoryFilter(categoryFilter === category.id ? null : category.id)}
                      style={[
                        styles.filterOptionChip,
                        categoryFilter === category.id && { backgroundColor: theme.colors.primary }
                      ]}
                      textStyle={categoryFilter === category.id ? styles.selectedChipText : undefined}
                    >
                      {category.name}
                    </Chip>
                  ))}
                </View>
              </ScrollView>
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
  itemList: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  itemCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  stockBadge: {
    height: 22,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  itemDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  divider: {
    marginVertical: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  minimumText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  costLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  costValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  totalValueContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  totalValueLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 4,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
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
  categoryFilterScrollView: {
    maxHeight: 150,
  },
});

export default InventoryScreen;