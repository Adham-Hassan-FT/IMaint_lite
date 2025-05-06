import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  IconButton,
  Card,
  Title,
  Paragraph,
  useTheme,
  List,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import { BarCodeScanner } from 'expo-barcode-scanner';
import axios from 'axios';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

type ScannedItem = {
  type: 'asset' | 'inventory' | 'unknown';
  id: number;
  number: string;
  description: string;
  details: string[];
};

const ScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [cameraFacing, setCameraFacing] = useState(BarCodeScanner.Constants.Type.back);
  
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { width } = Dimensions.get('window');

  // Request camera permission
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setHasPermission(true);
        return;
      }
      
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle barcode scanning
  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setScanning(false);
    setLoading(true);
    
    try {
      // Try to find the scanned item
      console.log(`Barcode with type ${type} and data ${data} has been scanned`);
      
      // Check if it's an asset
      const assetResponse = await axios.get(`/api/assets/by-number/${data}`);
      if (assetResponse.data) {
        const asset = assetResponse.data;
        setScannedItem({
          type: 'asset',
          id: asset.id,
          number: asset.assetNumber,
          description: asset.description,
          details: [
            `Type: ${asset.type?.name || 'Unknown'}`,
            `Status: ${formatStatus(asset.status)}`,
            `Location: ${asset.location || 'N/A'}`,
            `Manufacturer: ${asset.manufacturer || 'N/A'}`,
            `Model: ${asset.model || 'N/A'}`,
            `Serial Number: ${asset.serialNumber || 'N/A'}`,
          ],
        });
        setLoading(false);
        return;
      }
    } catch (error) {
      // Not an asset, try inventory
      try {
        const inventoryResponse = await axios.get(`/api/inventory/by-number/${data}`);
        if (inventoryResponse.data) {
          const item = inventoryResponse.data;
          setScannedItem({
            type: 'inventory',
            id: item.id,
            number: item.partNumber,
            description: item.description,
            details: [
              `Category: ${item.category?.name || 'Unknown'}`,
              `Quantity: ${item.quantity} ${item.unit}`,
              `Location: ${item.location || 'N/A'}`,
              `Unit Cost: ${formatCurrency(item.unitCost)}`,
              `Min Quantity: ${item.minQuantity}`,
              `Status: ${item.quantity === 0 ? 'Out of Stock' : item.quantity <= item.minQuantity ? 'Low Stock' : 'In Stock'}`,
            ],
          });
          setLoading(false);
          return;
        }
      } catch (error) {
        // Not found in either assets or inventory
        setScannedItem({
          type: 'unknown',
          id: 0,
          number: data,
          description: 'Unknown Item',
          details: [
            'This barcode does not match any known asset or inventory item.',
            'Would you like to add it to the system?'
          ],
        });
        setLoading(false);
      }
    }
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleViewDetails = () => {
    if (!scannedItem) return;
    
    if (scannedItem.type === 'asset') {
      navigation.navigate('AssetDetail', { assetId: scannedItem.id });
    } else if (scannedItem.type === 'inventory') {
      navigation.navigate('InventoryDetail', { itemId: scannedItem.id });
    }
  };
  
  const handleAddNewItem = () => {
    if (!scannedItem) return;
    
    // For now, just show an alert. In a real app, navigate to the appropriate form.
    Alert.alert(
      'Add New Item',
      `Would you like to add ${scannedItem.number} as an asset or inventory item?`,
      [
        {
          text: 'Asset',
          onPress: () => {
            // Navigate to add asset form with pre-filled barcode
            Alert.alert('Not implemented', 'This functionality is not yet implemented.');
          },
        },
        {
          text: 'Inventory',
          onPress: () => {
            // Navigate to add inventory form with pre-filled barcode
            Alert.alert('Not implemented', 'This functionality is not yet implemented.');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(true);
    setScannedItem(null);
  };
  
  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };
  
  const toggleCamera = () => {
    setCameraFacing(
      cameraFacing === BarCodeScanner.Constants.Type.back
        ? BarCodeScanner.Constants.Type.front
        : BarCodeScanner.Constants.Type.back
    );
  };

  // Handle permission states
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons 
          name="camera-off" 
          size={50} 
          color="#ef4444" 
        />
        <Text style={styles.text}>No access to camera</Text>
        <Text style={styles.subText}>
          Camera access is required to scan barcodes. Please enable camera permissions in your device settings.
        </Text>
        <Button 
          mode="contained" 
          onPress={() => {
            if (Platform.OS !== 'web') {
              BarCodeScanner.requestPermissionsAsync();
            }
          }}
          style={{ marginTop: 20 }}
        >
          Request Permission Again
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {scanning ? (
        <View style={styles.scannerContainer}>
          {Platform.OS !== 'web' ? (
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
              type={cameraFacing}
              barCodeTypes={[
                BarCodeScanner.Constants.BarCodeType.qr,
                BarCodeScanner.Constants.BarCodeType.code128,
                BarCodeScanner.Constants.BarCodeType.code39,
                BarCodeScanner.Constants.BarCodeType.ean13,
                BarCodeScanner.Constants.BarCodeType.ean8,
                BarCodeScanner.Constants.BarCodeType.upc_e,
              ]}
              flashMode={
                flashOn
                  ? BarCodeScanner.Constants.FlashMode.torch
                  : BarCodeScanner.Constants.FlashMode.off
              }
            />
          ) : (
            <View style={styles.webCameraPlaceholder}>
              <MaterialCommunityIcons 
                name="camera" 
                size={50} 
                color="#fff" 
              />
              <Text style={styles.webCameraText}>
                Camera access is limited in web browsers.
              </Text>
              <Button 
                mode="contained" 
                onPress={() => {
                  // Simulate a barcode scan for web demo
                  handleBarCodeScanned({ 
                    type: 'QR', 
                    data: 'A-001' 
                  });
                }}
                style={{ marginTop: 20 }}
              >
                Simulate Asset Scan
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => {
                  // Simulate a barcode scan for web demo
                  handleBarCodeScanned({ 
                    type: 'QR', 
                    data: 'INV-001' 
                  });
                }}
                style={{ marginTop: 10 }}
              >
                Simulate Inventory Scan
              </Button>
            </View>
          )}
          
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTargetRow}>
              <View style={styles.scannerTargetCorner} />
              <View style={styles.scannerTargetSpacer} />
              <View style={[styles.scannerTargetCorner, styles.scannerTargetTopRight]} />
            </View>
            
            <View style={styles.scannerTargetMiddle}>
              <View style={styles.scannerTargetSide} />
              <View style={styles.scannerTargetCenter} />
              <View style={styles.scannerTargetSide} />
            </View>
            
            <View style={styles.scannerTargetRow}>
              <View style={[styles.scannerTargetCorner, styles.scannerTargetBottomLeft]} />
              <View style={styles.scannerTargetSpacer} />
              <View style={[styles.scannerTargetCorner, styles.scannerTargetBottomRight]} />
            </View>
          </View>
          
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <Text style={styles.scannerSubtitle}>Position barcode within frame</Text>
          </View>
          
          <View style={styles.controlsContainer}>
            {Platform.OS !== 'web' && (
              <>
                <IconButton
                  icon={flashOn ? "flash" : "flash-off"}
                  iconColor="#fff"
                  size={30}
                  onPress={toggleFlash}
                  style={styles.controlButton}
                />
                <IconButton
                  icon="camera-switch"
                  iconColor="#fff"
                  size={30}
                  onPress={toggleCamera}
                  style={styles.controlButton}
                />
              </>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Searching for item...</Text>
            </View>
          ) : scannedItem ? (
            <Card style={styles.resultCard}>
              <Card.Content>
                <View style={styles.resultHeader}>
                  <MaterialCommunityIcons
                    name={
                      scannedItem.type === 'asset'
                        ? 'dolly'
                        : scannedItem.type === 'inventory'
                        ? 'package-variant'
                        : 'help-circle'
                    }
                    size={36}
                    color={
                      scannedItem.type === 'asset'
                        ? '#3b82f6'
                        : scannedItem.type === 'inventory'
                        ? '#10b981'
                        : '#f59e0b'
                    }
                  />
                  <View style={styles.resultHeaderText}>
                    <Text style={styles.resultType}>
                      {scannedItem.type === 'asset'
                        ? 'Asset'
                        : scannedItem.type === 'inventory'
                        ? 'Inventory Item'
                        : 'Unknown Item'}
                    </Text>
                    <Text style={styles.resultNumber}>{scannedItem.number}</Text>
                  </View>
                </View>

                <Divider style={styles.resultDivider} />
                
                <Text style={styles.resultTitle}>{scannedItem.description}</Text>
                
                <List.Section>
                  {scannedItem.details.map((detail, index) => (
                    <List.Item
                      key={index}
                      title={detail}
                      left={() => 
                        <List.Icon 
                          icon={
                            detail.includes('Type') || detail.includes('Category')
                              ? 'tag'
                              : detail.includes('Status')
                              ? 'information'
                              : detail.includes('Location')
                              ? 'map-marker'
                              : detail.includes('Manufacturer') || detail.includes('Model')
                              ? 'factory'
                              : detail.includes('Serial')
                              ? 'barcode'
                              : detail.includes('Quantity')
                              ? 'counter'
                              : detail.includes('Cost')
                              ? 'currency-usd'
                              : 'text'
                          }
                        />
                      }
                      titleStyle={styles.detailText}
                    />
                  ))}
                </List.Section>
                
                <View style={styles.actionButtonsContainer}>
                  {scannedItem.type !== 'unknown' ? (
                    <Button
                      mode="contained"
                      onPress={handleViewDetails}
                      style={styles.viewDetailsButton}
                    >
                      View Details
                    </Button>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={handleAddNewItem}
                      style={styles.viewDetailsButton}
                    >
                      Add New Item
                    </Button>
                  )}
                  
                  <Button
                    mode="outlined"
                    onPress={resetScanner}
                    style={styles.scanAgainButton}
                  >
                    Scan Again
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={50}
                color="#ef4444"
              />
              <Text style={styles.errorText}>Error scanning barcode</Text>
              <Button
                mode="contained"
                onPress={resetScanner}
                style={{ marginTop: 20 }}
              >
                Try Again
              </Button>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scannerContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerHeader: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 20,
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  scannerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 8,
  },
  scannerTargetRow: {
    flexDirection: 'row',
    width: 250,
    height: 30,
  },
  scannerTargetMiddle: {
    flexDirection: 'row',
    width: 250,
    height: 190,
  },
  scannerTargetCorner: {
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  scannerTargetTopRight: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  scannerTargetBottomLeft: {
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  scannerTargetBottomRight: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  scannerTargetSpacer: {
    flex: 1,
  },
  scannerTargetSide: {
    width: 30,
  },
  scannerTargetCenter: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
  },
  controlButton: {
    margin: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  webCameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  webCameraText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  resultsContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#4b5563',
  },
  resultCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultHeaderText: {
    marginLeft: 10,
  },
  resultType: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  resultDivider: {
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#111827',
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  actionButtonsContainer: {
    marginTop: 20,
  },
  viewDetailsButton: {
    marginBottom: 10,
  },
  scanAgainButton: {
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    marginTop: 20,
    fontSize: 18,
    color: '#4b5563',
  },
  text: {
    fontSize: 18,
    marginTop: 20,
    color: '#4b5563',
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    marginTop: 10,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default ScannerScreen;