import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Chip, FAB, Searchbar, Text, Title, useTheme, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { get } from '../lib/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import shared types from your main schema
import { AssetWithDetails } from '../../../shared/schema';

const AssetsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [assets, setAssets] = useState<AssetWithDetails[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await get<AssetWithDetails[]>('/api/assets/details');
      setAssets(data);
      setFilteredAssets(data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchAssets();
  }, []);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAssets();
  }, []);
  
  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredAssets(assets);
    } else {
      const filtered = assets.filter(
        (asset) => 
          asset.description?.toLowerCase().includes(query.toLowerCase()) ||
          asset.assetNumber.toLowerCase().includes(query.toLowerCase()) ||
          asset.location?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredAssets(filtered);
    }
  };
  
  const navigateToDetail = (asset: AssetWithDetails) => {
    navigation.navigate('AssetDetail', { assetId: asset.id });
  };
  
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
  
  const renderAssetCard = ({ item }: { item: AssetWithDetails }) => {
    return (
      <TouchableOpacity onPress={() => navigateToDetail(item)}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.assetNumber}>{item.assetNumber}</Text>
              <Chip 
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                textStyle={{ color: 'white', fontSize: 12 }}
              >
                {formatStatus(item.status)}
              </Chip>
            </View>
            
            <Title style={styles.title}>{item.description}</Title>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="tag" size={16} color="#666" style={styles.icon} />
                <Text style={styles.detailText}>
                  {item.type?.name || 'Unknown Type'}
                </Text>
              </View>
              
              {item.location && (
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#666" style={styles.icon} />
                  <Text style={styles.detailText}>{item.location}</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search assets"
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading assets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssets}
          renderItem={renderAssetCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="dolly" 
                size={64} 
                color="#ccc" 
              />
              <Text style={styles.emptyText}>No assets found</Text>
            </View>
          }
        />
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('NewAsset')}
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
  assetNumber: {
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
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    marginRight: 4,
  },
  detailText: {
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

export default AssetsScreen;