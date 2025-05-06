import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Badge,
  Divider,
  Button,
  ActivityIndicator,
  List,
  Portal,
  Dialog,
  TextInput,
  useTheme,
  FAB,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainNavigator';
import axios from 'axios';

type WorkOrderScreenRouteProp = {
  params: {
    workOrderId: number;
  };
};

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const WorkOrderDetailScreen = () => {
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [notesDialogVisible, setNotesDialogVisible] = useState(false);
  const [notes, setNotes] = useState('');
  
  const theme = useTheme();
  const route = useRoute<WorkOrderScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  
  const { workOrderId } = route.params;

  useEffect(() => {
    fetchWorkOrder();
  }, [workOrderId]);

  const fetchWorkOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/work-orders/${workOrderId}/details`);
      setWorkOrder(response.data);
      setNotes(response.data.notes || '');
      setSelectedStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching work order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setLoading(true);
      await axios.patch(`/api/work-orders/${workOrderId}`, {
        status: selectedStatus,
      });
      
      // Refresh work order details
      await fetchWorkOrder();
      setStatusDialogVisible(false);
    } catch (error) {
      console.error('Error updating work order status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotes = async () => {
    try {
      setLoading(true);
      await axios.patch(`/api/work-orders/${workOrderId}`, {
        notes,
      });
      
      // Refresh work order details
      await fetchWorkOrder();
      setNotesDialogVisible(false);
    } catch (error) {
      console.error('Error updating work order notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority) => {
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

  const getStatusColor = (status) => {
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

  const formatStatus = (status) => {
    if (!status) return '';
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading && !workOrder) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (!workOrder) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={50} color="#ef4444" />
        <Text style={styles.errorText}>Work order not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.workOrderHeader}>
              <View style={styles.workOrderTitleContainer}>
                <Text style={styles.workOrderNumber}>{workOrder.workOrderNumber}</Text>
                <Text style={styles.workOrderTitle}>{workOrder.title}</Text>
              </View>
              
              <View style={styles.workOrderBadges}>
                <Badge 
                  style={[
                    styles.priorityBadge, 
                    { backgroundColor: getPriorityColor(workOrder.priority) }
                  ]}
                >
                  {workOrder.priority}
                </Badge>
                
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
            
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Asset:</Text>
                <Text style={styles.detailValue}>
                  {workOrder.asset ? workOrder.asset.description : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>
                  {workOrder.type ? workOrder.type.name : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requested:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(workOrder.dateRequested)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Needed By:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(workOrder.dateNeeded)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requested By:</Text>
                <Text style={styles.detailValue}>
                  {workOrder.requestedBy ? workOrder.requestedBy.fullName : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned To:</Text>
                <Text style={styles.detailValue}>
                  {workOrder.assignedTo ? workOrder.assignedTo.fullName : 'Unassigned'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.contentCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{workOrder.description || 'No description provided.'}</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.contentCard}>
          <Card.Content>
            <View style={styles.notesHeader}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Button 
                mode="text" 
                onPress={() => setNotesDialogVisible(true)}
                labelStyle={styles.editButton}
              >
                Edit
              </Button>
            </View>
            <Text style={styles.notes}>{workOrder.notes || 'No notes added.'}</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.contentCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Labor</Text>
            {workOrder.laborEntries && workOrder.laborEntries.length > 0 ? (
              workOrder.laborEntries.map((entry, index) => (
                <View key={index} style={styles.laborEntry}>
                  <View style={styles.laborHeader}>
                    <Text style={styles.laborTechnician}>{entry.technician}</Text>
                    <Text style={styles.laborHours}>{entry.hours} hours</Text>
                  </View>
                  <Text style={styles.laborDate}>{formatDate(entry.date)}</Text>
                  {entry.notes && <Text style={styles.laborNotes}>{entry.notes}</Text>}
                  {index < workOrder.laborEntries.length - 1 && <Divider style={styles.entryDivider} />}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No labor entries.</Text>
            )}
            
            <Button 
              mode="outlined" 
              icon="plus" 
              onPress={() => {}}
              style={styles.addButton}
            >
              Add Labor
            </Button>
          </Card.Content>
        </Card>
        
        <Card style={styles.contentCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Parts</Text>
            {workOrder.parts && workOrder.parts.length > 0 ? (
              workOrder.parts.map((part, index) => (
                <View key={index} style={styles.partEntry}>
                  <View style={styles.partHeader}>
                    <Text style={styles.partName}>
                      {part.inventoryItem ? part.inventoryItem.description : 'Unknown Part'}
                    </Text>
                    <View style={styles.partQuantity}>
                      <Text style={styles.partAmount}>{part.quantity}</Text>
                      <Text style={styles.partUnit}>
                        {part.inventoryItem ? part.inventoryItem.unit : 'units'}
                      </Text>
                    </View>
                  </View>
                  {index < workOrder.parts.length - 1 && <Divider style={styles.entryDivider} />}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No parts used.</Text>
            )}
            
            <Button 
              mode="outlined" 
              icon="plus" 
              onPress={() => {}}
              style={styles.addButton}
            >
              Add Parts
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <FAB
        icon="square-edit-outline"
        label="Update Status"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setStatusDialogVisible(true)}
      />
      
      {/* Status Dialog */}
      <Portal>
        <Dialog visible={statusDialogVisible} onDismiss={() => setStatusDialogVisible(false)}>
          <Dialog.Title>Update Status</Dialog.Title>
          <Dialog.Content>
            <List.Section>
              {['requested', 'assigned', 'in-progress', 'on-hold', 'completed', 'cancelled'].map((status) => (
                <List.Item
                  key={status}
                  title={formatStatus(status)}
                  left={props => 
                    <List.Icon
                      {...props}
                      icon={selectedStatus === status ? 'radiobox-marked' : 'radiobox-blank'}
                      color={selectedStatus === status ? getStatusColor(status) : '#6b7280'}
                    />
                  }
                  onPress={() => setSelectedStatus(status)}
                />
              ))}
            </List.Section>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStatusDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleUpdateStatus}>Update</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Notes Dialog */}
      <Portal>
        <Dialog visible={notesDialogVisible} onDismiss={() => setNotesDialogVisible(false)}>
          <Dialog.Title>Update Notes</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={6}
              value={notes}
              onChangeText={setNotes}
              style={styles.notesInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNotesDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleUpdateNotes}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginVertical: 20,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 10,
  },
  contentCard: {
    marginBottom: 16,
    borderRadius: 10,
  },
  workOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workOrderTitleContainer: {
    flex: 1,
  },
  workOrderNumber: {
    fontSize: 14,
    color: '#6b7280',
  },
  workOrderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  workOrderBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  priorityBadge: {
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  statusBadge: {
    alignSelf: 'flex-end',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4b5563',
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notes: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4b5563',
  },
  editButton: {
    color: '#3b82f6',
  },
  laborEntry: {
    marginBottom: 12,
  },
  laborHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laborTechnician: {
    fontSize: 14,
    fontWeight: '500',
  },
  laborHours: {
    fontSize: 14,
    fontWeight: '500',
  },
  laborDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  laborNotes: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  entryDivider: {
    marginVertical: 12,
  },
  partEntry: {
    marginBottom: 12,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  partQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partAmount: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  partUnit: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  addButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  notesInput: {
    backgroundColor: '#fff',
  },
});

export default WorkOrderDetailScreen;