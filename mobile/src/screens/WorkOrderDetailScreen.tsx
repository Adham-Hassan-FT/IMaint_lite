import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Card, Text, Title, List, Divider, Button, Chip, ActivityIndicator, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { get, put } from '../lib/api';
import { WorkOrderWithDetails } from '../../../shared/schema';

type WorkOrderDetailParams = {
  workOrderId: number;
};

const WorkOrderDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: WorkOrderDetailParams }, 'params'>>();
  const { workOrderId } = route.params;
  
  const [workOrder, setWorkOrder] = useState<WorkOrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const fetchWorkOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await get<WorkOrderWithDetails>(`/api/work-orders/${workOrderId}/details`);
      setWorkOrder(data);
    } catch (error) {
      console.error('Failed to fetch work order details:', error);
      Alert.alert('Error', 'Failed to load work order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchWorkOrderDetails();
  }, [workOrderId]);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchWorkOrderDetails();
  }, [workOrderId]);
  
  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return '#9ca3af';
      case 'approved': return '#60a5fa';
      case 'scheduled': return '#f59e0b';
      case 'in_progress': return '#10b981';
      case 'on_hold': return '#a855f7';
      case 'completed': return '#22c55e';
      case 'cancelled': return '#ef4444';
      default: return '#9ca3af';
    }
  };
  
  // Helper to format status text
  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Helper to get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'low': return 'arrow-down';
      case 'medium': return 'arrow-right';
      case 'high': return 'arrow-up';
      case 'critical': return 'alert-circle';
      default: return 'arrow-right';
    }
  };
  
  // Helper to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#7f1d1d';
      default: return '#f59e0b';
    }
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
  
  const updateWorkOrderStatus = async (newStatus: string) => {
    if (!workOrder) return;
    
    try {
      const response = await put<WorkOrderWithDetails>(`/api/work-orders/${workOrderId}`, {
        status: newStatus
      });
      
      setWorkOrder(response);
      Alert.alert('Success', `Work order status updated to ${formatStatus(newStatus)}`);
    } catch (error) {
      console.error('Failed to update work order status:', error);
      Alert.alert('Error', 'Failed to update work order status');
    }
  };
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading work order details...</Text>
      </View>
    );
  }
  
  if (!workOrder) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Work order not found</Text>
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
          <Text style={styles.workOrderNumber}>{workOrder.workOrderNumber}</Text>
          <Title style={styles.title}>{workOrder.title}</Title>
          
          <View style={styles.statusRow}>
            <Chip 
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(workOrder.status) }]}
              textStyle={{ color: 'white' }}
            >
              {formatStatus(workOrder.status)}
            </Chip>
            
            <View style={styles.priorityContainer}>
              <MaterialCommunityIcons 
                name={getPriorityIcon(workOrder.priority)} 
                size={18} 
                color={getPriorityColor(workOrder.priority)} 
              />
              <Text style={[styles.priorityText, { color: getPriorityColor(workOrder.priority) }]}>
                {workOrder.priority.charAt(0).toUpperCase() + workOrder.priority.slice(1)} Priority
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {workOrder.description || 'No description provided'}
          </Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Asset:</Text>
            <Text style={styles.detailValue}>
              {workOrder.asset ? `${workOrder.asset.assetNumber} - ${workOrder.asset.description}` : 'Not assigned'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {workOrder.type?.name || 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested By:</Text>
            <Text style={styles.detailValue}>
              {workOrder.requestedBy?.fullName || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned To:</Text>
            <Text style={styles.detailValue}>
              {workOrder.assignedTo?.fullName || 'Unassigned'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date Requested:</Text>
            <Text style={styles.detailValue}>
              {formatDate(workOrder.dateRequested)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date Needed:</Text>
            <Text style={styles.detailValue}>
              {formatDate(workOrder.dateNeeded)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date Scheduled:</Text>
            <Text style={styles.detailValue}>
              {formatDate(workOrder.dateScheduled)}
            </Text>
          </View>
          
          {workOrder.dateStarted && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date Started:</Text>
              <Text style={styles.detailValue}>
                {formatDate(workOrder.dateStarted)}
              </Text>
            </View>
          )}
          
          {workOrder.dateCompleted && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date Completed:</Text>
              <Text style={styles.detailValue}>
                {formatDate(workOrder.dateCompleted)}
              </Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Hours:</Text>
            <Text style={styles.detailValue}>
              {workOrder.estimatedHours || 'Not estimated'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Actual Hours:</Text>
            <Text style={styles.detailValue}>
              {workOrder.actualHours || 'Not completed'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estimated Cost:</Text>
            <Text style={styles.detailValue}>
              {workOrder.estimatedCost ? `$${workOrder.estimatedCost}` : 'Not estimated'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Actual Cost:</Text>
            <Text style={styles.detailValue}>
              {workOrder.actualCost ? `$${workOrder.actualCost}` : 'Not completed'}
            </Text>
          </View>
        </Card.Content>
      </Card>
      
      <List.Accordion
        title="Labor Entries"
        left={props => <List.Icon {...props} icon="account-wrench" />}
        expanded={expandedSection === 'labor'}
        onPress={() => toggleSection('labor')}
        style={styles.listAccordion}
      >
        {workOrder.laborEntries && workOrder.laborEntries.length > 0 ? (
          workOrder.laborEntries.map((labor) => (
            <Card key={labor.id} style={styles.subCard}>
              <Card.Content>
                <View style={styles.laborHeader}>
                  <Text style={styles.laborUser}>
                    {labor.userId ? workOrder.laborEntries?.find(l => l.id === labor.id)?.user?.fullName || 'Unknown' : 'Unknown'}
                  </Text>
                  <Text style={styles.laborDate}>{formatDate(labor.datePerformed)}</Text>
                </View>
                <View style={styles.laborDetails}>
                  <Text style={styles.laborHours}>{labor.hours} hours</Text>
                  {labor.laborCost && (
                    <Text style={styles.laborCost}>${labor.laborCost}</Text>
                  )}
                </View>
                {labor.notes && (
                  <Text style={styles.laborNotes}>{labor.notes}</Text>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptySubCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No labor entries recorded</Text>
            </Card.Content>
          </Card>
        )}
        
        <Button 
          mode="outlined" 
          icon="plus"
          onPress={() => navigation.navigate('AddLabor', { workOrderId: workOrder.id })}
          style={styles.addButton}
        >
          Add Labor
        </Button>
      </List.Accordion>
      
      <List.Accordion
        title="Parts Used"
        left={props => <List.Icon {...props} icon="tools" />}
        expanded={expandedSection === 'parts'}
        onPress={() => toggleSection('parts')}
        style={styles.listAccordion}
      >
        {workOrder.parts && workOrder.parts.length > 0 ? (
          workOrder.parts.map((part) => (
            <Card key={part.id} style={styles.subCard}>
              <Card.Content>
                <View style={styles.partHeader}>
                  <Text style={styles.partName}>
                    {part.inventoryItem?.partNumber} - {part.inventoryItem?.description}
                  </Text>
                  <Text style={styles.partDate}>{formatDate(part.dateIssued)}</Text>
                </View>
                <View style={styles.partDetails}>
                  <Text style={styles.partQuantity}>Qty: {part.quantity}</Text>
                  {part.unitCost && (
                    <Text style={styles.partCost}>${part.unitCost} each</Text>
                  )}
                  {part.totalCost && (
                    <Text style={styles.partTotalCost}>Total: ${part.totalCost}</Text>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptySubCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No parts recorded</Text>
            </Card.Content>
          </Card>
        )}
        
        <Button 
          mode="outlined" 
          icon="plus"
          onPress={() => navigation.navigate('AddPart', { workOrderId: workOrder.id })}
          style={styles.addButton}
        >
          Add Part
        </Button>
      </List.Accordion>
      
      {workOrder.completionNotes && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Completion Notes</Text>
            <Text style={styles.descriptionText}>{workOrder.completionNotes}</Text>
          </Card.Content>
        </Card>
      )}
      
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.statusActions}>
            {workOrder.status === 'requested' && (
              <>
                <Button 
                  mode="contained" 
                  icon="check"
                  onPress={() => updateWorkOrderStatus('approved')}
                  style={[styles.actionButton, { backgroundColor: '#60a5fa' }]}
                >
                  Approve
                </Button>
                <Button 
                  mode="contained" 
                  icon="calendar"
                  onPress={() => updateWorkOrderStatus('scheduled')}
                  style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
                >
                  Schedule
                </Button>
              </>
            )}
            
            {workOrder.status === 'approved' && (
              <Button 
                mode="contained" 
                icon="calendar"
                onPress={() => updateWorkOrderStatus('scheduled')}
                style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
              >
                Schedule
              </Button>
            )}
            
            {workOrder.status === 'scheduled' && (
              <Button 
                mode="contained" 
                icon="play"
                onPress={() => updateWorkOrderStatus('in_progress')}
                style={[styles.actionButton, { backgroundColor: '#10b981' }]}
              >
                Start Work
              </Button>
            )}
            
            {workOrder.status === 'in_progress' && (
              <>
                <Button 
                  mode="contained" 
                  icon="check-circle"
                  onPress={() => updateWorkOrderStatus('completed')}
                  style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
                >
                  Complete
                </Button>
                <Button 
                  mode="contained" 
                  icon="pause-circle"
                  onPress={() => updateWorkOrderStatus('on_hold')}
                  style={[styles.actionButton, { backgroundColor: '#a855f7' }]}
                >
                  On Hold
                </Button>
              </>
            )}
            
            {workOrder.status === 'on_hold' && (
              <Button 
                mode="contained" 
                icon="play-circle"
                onPress={() => updateWorkOrderStatus('in_progress')}
                style={[styles.actionButton, { backgroundColor: '#10b981' }]}
              >
                Resume
              </Button>
            )}
            
            {workOrder.status !== 'cancelled' && workOrder.status !== 'completed' && (
              <Button 
                mode="contained" 
                icon="close-circle"
                onPress={() => updateWorkOrderStatus('cancelled')}
                style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              >
                Cancel
              </Button>
            )}
            
            <Button 
              mode="outlined" 
              icon="pencil"
              onPress={() => navigation.navigate('EditWorkOrder', { workOrderId: workOrder.id })}
              style={styles.editButton}
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
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
  },
  workOrderNumber: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 20,
    marginVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusChip: {
    height: 28,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  listAccordion: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  subCard: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  emptySubCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  addButton: {
    margin: 16,
  },
  laborHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  laborUser: {
    fontWeight: '500',
  },
  laborDate: {
    color: '#666',
    fontSize: 12,
  },
  laborDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  laborHours: {
    fontSize: 14,
  },
  laborCost: {
    fontSize: 14,
    color: '#666',
  },
  laborNotes: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  partName: {
    fontWeight: '500',
    flex: 1,
  },
  partDate: {
    color: '#666',
    fontSize: 12,
  },
  partDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  partQuantity: {
    fontSize: 14,
    marginRight: 8,
  },
  partCost: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  partTotalCost: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  statusActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  editButton: {
    marginBottom: 8,
  },
  bottomPadding: {
    height: 40,
  },
});

export default WorkOrderDetailScreen;