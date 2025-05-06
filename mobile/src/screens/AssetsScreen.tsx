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
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import axios from 'axios';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Asset interface
interface Asset {
  id: number;
  assetNumber: string;
  description: string;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: string;
  purchaseDate: string;
  installDate: string;
  warrantyExpirationDate: string;
  lastMaintenanceDate: string;
  notes: string;
  parentId: number | null;
  typeId: number;
  type?: {
    name: string;
    description: string;
  };
  parent?: {
    assetNumber: string;
    description: string;
  };
}

const AssetsScreen = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [assetTypes, setAssetTypes] = useState<Array<{id: number, name: string}>>([]);
  
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 768;

  // Fetch assets
  useEffect(() => {
    fetchAssets();
    fetchAssetTypes();
  }, []);

  // Apply filters
  useEffect(() => {
    filterAssets();
  }, [searchQuery, statusFilter, typeFilter, assets]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/assets/details');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchAssetTypes = async () => {
    try {
      const response = await axios.get('/api/asset-types');
      setAssetTypes(response.data);
    } catch (error) {
      console.error('Error fetching asset types:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssets();
  };

  const filterAssets = () => {
    let filtered = [...assets];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        asset => 
          asset.assetNumber.toLowerCase().includes(query) ||
          asset.description.toLowerCase().includes(query) ||
          asset.location.toLowerCase().includes(query) ||
          asset.manufacturer.toLowerCase().includes(query) ||
          asset.model.toLowerCase().includes(query) ||
          asset.serialNumber.toLowerCase().includes(query) ||
          (asset.type?.name && asset.type.name.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(asset => asset.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(asset => asset.typeId === typeFilter);
    }
    
    setFilteredAssets(filtered);
  };

  const onSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setStatusFilter(null);
    setTypeFilter(null);
    setFilterVisible(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return '#10b981';
      case 'needs-maintenance':
        return '#f59e0b';
      case 'under-repair':
        return '#8b5cf6';
      case 'out-of-service':
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
  
  const getAssetTypeName = (typeId: number) => {
    const type = assetTypes.find(t => t.id === typeId);
    return type ? type.name : 'Unknown';
  };

  // Render an asset item
  const renderAssetItem = ({ item }: { item: Asset }) => (
    <Card style={styles.assetCard}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('AssetDetail', { assetId: item.id })}
      >
        <Card.Content>
          <View style={styles.assetHeader}>
            <Text style={styles.assetNumber}>{item.assetNumber}</Text>
            <Badge 
              style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(item.status) }
              ]}
            >
              {formatStatus(item.status)}
            </Badge>
          </View>
          
          <Text style={styles.assetTitle}>{item.description}</Text>
          
          <View style={styles.assetDetailRow}>
            <MaterialCommunityIcons name="tag" size={16} color="#6b7280" />
            <Text style={styles.assetDetailText}>
              {item.type ? item.type.name : getAssetTypeName(item.typeId)}
            </Text>
          </View>
          
          {item.location && (
            <View style={styles.assetDetailRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
              <Text style={styles.assetDetailText}>{item.location}</Text>
            </View>
          )}
          
          <View style={styles.assetDetailRow}>
            <MaterialCommunityIcons name="factory" size={16} color="#6b7280" />
            <Text style={styles.assetDetailText}>
              {item.manufacturer} {item.model}
            </Text>
          </View>
          
          {item.serialNumber && (
            <View style={styles.assetDetailRow}>
              <MaterialCommunityIcons name="barcode" size={16} color="#6b7280" />
              <Text style={styles.assetDetailText}>SN: {item.serialNumber}</Text>
            </View>
          )}
          
          {item.parent && (
            <View style={styles.assetDetailRow}>
              <MaterialCommunityIcons name="connection" size={16} color="#6b7280" />
              <Text style={styles.assetDetailText}>
                Part of: {item.parent.description} ({item.parent.assetNumber})
              </Text>
            </View>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.assetFooter}>
            <View style={styles.assetDateRow}>
              <Text style={styles.assetDateLabel}>Installed:</Text>
              <Text style={styles.assetDate}>{formatDate(item.installDate)}</Text>
            </View>
            
            <View style={styles.assetDateRow}>
              <Text style={styles.assetDateLabel}>Last Maintenance:</Text>
              <Text style={styles.assetDate}>{formatDate(item.lastMaintenanceDate)}</Text>
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="dolly" 
        size={60} 
        color="#d1d5db" 
      />
      <Text style={styles.emptyStateText}>
        {searchQuery || statusFilter || typeFilter
          ? 'No assets match your search criteria'
          : 'No assets found'}
      </Text>
      {(searchQuery || statusFilter || typeFilter) && (
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
            placeholder="Search assets"
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
              color={statusFilter || typeFilter ? theme.colors.primary : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Active filters display */}
        {(statusFilter || typeFilter) && (
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
              
              {typeFilter && (
                <Chip 
                  mode="outlined"
                  onClose={() => setTypeFilter(null)}
                  style={styles.filterChip}
                >
                  Type: {getAssetTypeName(typeFilter)}
                </Chip>
              )}
            </ScrollView>
          </View>
        )}
        
        <FlatList
          data={filteredAssets}
          renderItem={renderAssetItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.assetList}
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
          label={isSmallScreen ? undefined : "New Asset"}
        />
        
        {/* Filter Dialog */}
        <Portal>
          <Dialog
            visible={filterVisible}
            onDismiss={() => setFilterVisible(false)}
            style={styles.filterDialog}
          >
            <Dialog.Title>Filter Assets</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.filterChipsContainer}>
                {['operational', 'needs-maintenance', 'under-repair', 'out-of-service'].map(status => (
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
              
              <Text style={styles.filterSectionTitle}>Asset Type</Text>
              <ScrollView style={styles.typeFilterScrollView}>
                <View style={styles.filterChipsContainer}>
                  {assetTypes.map(type => (
                    <Chip
                      key={type.id}
                      selected={typeFilter === type.id}
                      onPress={() => setTypeFilter(typeFilter === type.id ? null : type.id)}
                      style={[
                        styles.filterOptionChip,
                        typeFilter === type.id && { backgroundColor: theme.colors.primary }
                      ]}
                      textStyle={typeFilter === type.id ? styles.selectedChipText : undefined}
                    >
                      {type.name}
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
  assetList: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  assetCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 8,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  statusBadge: {
    height: 22,
  },
  assetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  assetDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  assetDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  divider: {
    marginVertical: 10,
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetDateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 4,
  },
  assetDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
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
  typeFilterScrollView: {
    maxHeight: 150,
  },
});

export default AssetsScreen;