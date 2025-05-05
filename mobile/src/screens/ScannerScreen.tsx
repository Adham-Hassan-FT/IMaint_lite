import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { IconButton, ActivityIndicator, Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { get } from '../lib/api';
import { Asset, WorkOrder, InventoryItem } from '../../../shared/schema';

// Types for scan data
interface ScanResult {
  type: 'asset' | 'workOrder' | 'inventoryItem' | 'unknown';
  data: Asset | WorkOrder | InventoryItem | null;
  code: string;
}

const ScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  useEffect(() => {
    // Reset scan when screen is focused again
    if (isFocused) {
      setScanned(false);
      setScanResult(null);
    }
  }, [isFocused]);
  
  const handleBarCodeScanned = async ({ type, data }: BarCodeScannerResult) => {
    setScanned(true);
    setLoading(true);
    
    try {
      // Check the format to determine what was scanned
      if (data.startsWith('ASSET-')) {
        const assetNumber = data.replace('ASSET-', '');
        await handleAssetScan(assetNumber);
      } else if (data.startsWith('WO-')) {
        const workOrderNumber = data;
        await handleWorkOrderScan(workOrderNumber);
      } else if (data.startsWith('INV-')) {
        const partNumber = data.replace('INV-', '');
        await handleInventoryScan(partNumber);
      } else {
        // Try to identify the code format
        if (/^[A-Za-z]{2,3}-\d{4,}$/.test(data)) {
          // Could be a custom format, try all APIs
          await tryIdentifyScan(data);
        } else {
          // Unknown format
          setScanResult({
            type: 'unknown',
            data: null,
            code: data
          });
        }
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      Alert.alert('Scan Error', 'Failed to process the scan. Please try again.');
      setScanResult({
        type: 'unknown',
        data: null,
        code: data
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssetScan = async (assetNumber: string) => {
    try {
      const asset = await get<Asset>(`/api/assets/byNumber/${assetNumber}`);
      
      if (asset) {
        setScanResult({
          type: 'asset',
          data: asset,
          code: assetNumber
        });
      } else {
        setScanResult({
          type: 'unknown',
          data: null,
          code: assetNumber
        });
      }
    } catch (error) {
      console.error('Asset lookup error:', error);
      setScanResult({
        type: 'unknown',
        data: null,
        code: assetNumber
      });
    }
  };
  
  const handleWorkOrderScan = async (workOrderNumber: string) => {
    try {
      const workOrder = await get<WorkOrder>(`/api/work-orders/byNumber/${workOrderNumber}`);
      
      if (workOrder) {
        setScanResult({
          type: 'workOrder',
          data: workOrder,
          code: workOrderNumber
        });
      } else {
        setScanResult({
          type: 'unknown',
          data: null,
          code: workOrderNumber
        });
      }
    } catch (error) {
      console.error('Work order lookup error:', error);
      setScanResult({
        type: 'unknown',
        data: null,
        code: workOrderNumber
      });
    }
  };
  
  const handleInventoryScan = async (partNumber: string) => {
    try {
      const inventoryItem = await get<InventoryItem>(`/api/inventory-items/byPartNumber/${partNumber}`);
      
      if (inventoryItem) {
        setScanResult({
          type: 'inventoryItem',
          data: inventoryItem,
          code: partNumber
        });
      } else {
        setScanResult({
          type: 'unknown',
          data: null,
          code: partNumber
        });
      }
    } catch (error) {
      console.error('Inventory lookup error:', error);
      setScanResult({
        type: 'unknown',
        data: null,
        code: partNumber
      });
    }
  };
  
  const tryIdentifyScan = async (code: string) => {
    try {
      // Try asset first
      try {
        const asset = await get<Asset>(`/api/assets/byNumber/${code}`);
        if (asset) {
          setScanResult({
            type: 'asset',
            data: asset,
            code
          });
          return;
        }
      } catch (e) {
        // Continue to next check
      }
      
      // Try work order
      try {
        const workOrder = await get<WorkOrder>(`/api/work-orders/byNumber/${code}`);
        if (workOrder) {
          setScanResult({
            type: 'workOrder',
            data: workOrder,
            code
          });
          return;
        }
      } catch (e) {
        // Continue to next check
      }
      
      // Try inventory
      try {
        const inventoryItem = await get<InventoryItem>(`/api/inventory-items/byPartNumber/${code}`);
        if (inventoryItem) {
          setScanResult({
            type: 'inventoryItem',
            data: inventoryItem,
            code
          });
          return;
        }
      } catch (e) {
        // Continue to fallback
      }
      
      // If we get here, nothing was found
      setScanResult({
        type: 'unknown',
        data: null,
        code
      });
      
    } catch (error) {
      console.error('Scan identification error:', error);
      setScanResult({
        type: 'unknown',
        data: null,
        code
      });
    }
  };
  
  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.torch
        : Camera.Constants.FlashMode.off
    );
  };
  
  const scanAgain = () => {
    setScanned(false);
    setScanResult(null);
  };
  
  const navigateToScannedItem = () => {
    if (!scanResult || !scanResult.data) return;
    
    switch (scanResult.type) {
      case 'asset':
        navigation.navigate('AssetDetail', { assetId: (scanResult.data as Asset).id });
        break;
      case 'workOrder':
        navigation.navigate('WorkOrderDetail', { workOrderId: (scanResult.data as WorkOrder).id });
        break;
      case 'inventoryItem':
        navigation.navigate('InventoryDetail', { itemId: (scanResult.data as InventoryItem).id });
        break;
      default:
        Alert.alert('Error', 'Cannot navigate to this item type');
    }
  };
  
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#ef4444" />
        <Text style={styles.text}>No access to camera</Text>
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
  
  const renderScanResult = () => {
    if (!scanResult) return null;
    
    let icon, title, subtitle, color;
    
    switch (scanResult.type) {
      case 'asset':
        icon = 'engine';
        title = (scanResult.data as Asset)?.description || 'Asset';
        subtitle = `Asset #${scanResult.code}`;
        color = '#3b82f6';
        break;
      case 'workOrder':
        icon = 'clipboard-text';
        title = (scanResult.data as WorkOrder)?.title || 'Work Order';
        subtitle = `Work Order #${scanResult.code}`;
        color = '#f59e0b';
        break;
      case 'inventoryItem':
        icon = 'package-variant-closed';
        title = (scanResult.data as InventoryItem)?.description || 'Inventory Item';
        subtitle = `Part #${scanResult.code}`;
        color = '#10b981';
        break;
      default:
        icon = 'help-circle';
        title = 'Unknown Item';
        subtitle = `Code: ${scanResult.code}`;
        color = '#9ca3af';
    }
    
    return (
      <Card style={styles.resultCard}>
        <Card.Content style={styles.resultContent}>
          <MaterialCommunityIcons name={icon as any} size={48} color={color} style={styles.resultIcon} />
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultTitle}>{title}</Text>
            <Text style={styles.resultSubtitle}>{subtitle}</Text>
          </View>
        </Card.Content>
        <Card.Actions style={styles.resultActions}>
          {scanResult.type !== 'unknown' && scanResult.data && (
            <Button 
              mode="contained" 
              onPress={navigateToScannedItem}
              style={{ backgroundColor: color }}
            >
              View Details
            </Button>
          )}
          <Button 
            mode="outlined" 
            onPress={scanAgain}
            style={{ marginLeft: 8 }}
          >
            Scan Again
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      {!scanned ? (
        <>
          <Camera
            style={styles.camera}
            type={Camera.Constants.Type.back}
            flashMode={flashMode}
            barCodeScannerSettings={{
              barCodeTypes: [
                BarCodeScanner.Constants.BarCodeType.qr,
                BarCodeScanner.Constants.BarCodeType.code128,
                BarCodeScanner.Constants.BarCodeType.code39,
                BarCodeScanner.Constants.BarCodeType.code93,
                BarCodeScanner.Constants.BarCodeType.ean13,
                BarCodeScanner.Constants.BarCodeType.ean8,
                BarCodeScanner.Constants.BarCodeType.upc_e,
              ],
            }}
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={styles.scanAreaCorner} />
                <View style={styles.scanAreaCorner} />
                <View style={styles.scanAreaCorner} />
                <View style={styles.scanAreaCorner} />
              </View>
              
              <Text style={styles.instructions}>
                Align barcode or QR code within the frame
              </Text>
              
              <IconButton
                icon={flashMode === Camera.Constants.FlashMode.torch ? "flash" : "flash-off"}
                iconColor="white"
                size={30}
                onPress={toggleFlash}
                style={styles.flashButton}
              />
            </View>
          </Camera>
        </>
      ) : (
        <View style={styles.resultContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Processing scan...</Text>
            </View>
          ) : (
            renderScanResult()
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAreaCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#3b82f6',
  },
  instructions: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
  },
  flashButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    fontSize: 16,
    marginTop: 20,
    color: '#333',
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultCard: {
    width: '100%',
    elevation: 4,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  resultIcon: {
    marginRight: 16,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  resultActions: {
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 0,
  },
});

export default ScannerScreen;