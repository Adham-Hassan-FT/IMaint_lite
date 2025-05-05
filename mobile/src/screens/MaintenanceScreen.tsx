import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Text, Title, useTheme, ActivityIndicator, Chip, Button, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Calendar, CalendarUtils, DateData } from 'react-native-calendars';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Simulated maintenance data type
interface MaintenanceTask {
  id: number;
  assetId: number;
  assetName: string;
  assetNumber: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
}

// Simulated maintenance data
const mockMaintenanceTasks: MaintenanceTask[] = [
  {
    id: 1,
    assetId: 1,
    assetName: 'Air Compressor #1',
    assetNumber: 'EQ-AC-001',
    title: 'Oil Change',
    description: 'Regular oil change for air compressor',
    dueDate: '2025-05-10',
    completed: false,
    frequency: 'monthly'
  },
  {
    id: 2,
    assetId: 2,
    assetName: 'Conveyor Belt A',
    assetNumber: 'EQ-CB-002',
    title: 'Belt Tension Check',
    description: 'Check and adjust belt tension',
    dueDate: '2025-05-07',
    completed: false,
    frequency: 'weekly'
  },
  {
    id: 3,
    assetId: 3,
    assetName: 'HVAC System',
    assetNumber: 'EQ-HV-003',
    title: 'Filter Replacement',
    description: 'Replace HVAC filters',
    dueDate: '2025-05-15',
    completed: false,
    frequency: 'quarterly'
  },
  {
    id: 4,
    assetId: 4,
    assetName: 'Forklift #2',
    assetNumber: 'EQ-FL-004',
    title: 'Safety Inspection',
    description: 'Regular safety inspection of forklift',
    dueDate: '2025-05-03',
    completed: true,
    frequency: 'monthly'
  },
  {
    id: 5,
    assetId: 5,
    assetName: 'Production Line B',
    assetNumber: 'EQ-PL-005',
    title: 'Lubrication',
    description: 'Lubricate moving parts',
    dueDate: '2025-05-08',
    completed: false,
    frequency: 'weekly'
  }
];

const MaintenanceScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>(mockMaintenanceTasks);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    CalendarUtils.getCalendarDateString(new Date())
  );
  const [markedDates, setMarkedDates] = useState<{[date: string]: any}>({});
  const [tasksOnSelectedDate, setTasksOnSelectedDate] = useState<MaintenanceTask[]>([]);
  
  // Function to mark calendar dates with tasks
  const updateMarkedDates = (tasks: MaintenanceTask[]) => {
    const marks: {[date: string]: any} = {};
    
    tasks.forEach(task => {
      const color = task.completed ? '#22c55e' : isTaskOverdue(task) ? '#ef4444' : '#f59e0b';
      marks[task.dueDate] = {
        marked: true,
        dotColor: color,
        selected: task.dueDate === selectedDate,
        selectedColor: task.dueDate === selectedDate ? 'rgba(59, 130, 246, 0.1)' : undefined
      };
    });
    
    // Also mark the selected date if it has no tasks
    if (!marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: 'rgba(59, 130, 246, 0.1)'
      };
    }
    
    setMarkedDates(marks);
  };
  
  // Check if task is overdue
  const isTaskOverdue = (task: MaintenanceTask) => {
    if (task.completed) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  };
  
  // Update tasks for the selected date
  const updateTasksForSelectedDate = () => {
    const filtered = maintenanceTasks.filter(task => task.dueDate === selectedDate);
    setTasksOnSelectedDate(filtered);
  };
  
  // Load maintenance data
  const fetchMaintenanceData = async () => {
    setLoading(true);
    try {
      // In a real app, you would fetch from API:
      // const data = await get<MaintenanceTask[]>('/api/maintenance');
      // setMaintenanceTasks(data);
      
      // For now, using mock data
      setMaintenanceTasks(mockMaintenanceTasks);
      updateMarkedDates(mockMaintenanceTasks);
      updateTasksForSelectedDate();
    } catch (error) {
      console.error('Failed to fetch maintenance tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchMaintenanceData();
  }, []);
  
  useEffect(() => {
    updateMarkedDates(maintenanceTasks);
    updateTasksForSelectedDate();
  }, [selectedDate, maintenanceTasks]);
  
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchMaintenanceData();
  }, []);
  
  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };
  
  const toggleTaskStatus = (taskId: number) => {
    const updatedTasks = maintenanceTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setMaintenanceTasks(updatedTasks);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          theme={{
            todayTextColor: theme.colors.primary,
            arrowColor: theme.colors.primary,
          }}
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading maintenance schedule...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.taskListContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.dateHeader}>
            <Text style={styles.dateText}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.taskCountText}>
              {tasksOnSelectedDate.length} {tasksOnSelectedDate.length === 1 ? 'task' : 'tasks'}
            </Text>
          </View>
          
          {tasksOnSelectedDate.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="calendar-check" 
                size={64} 
                color="#ccc" 
              />
              <Text style={styles.emptyText}>No maintenance tasks scheduled for this date</Text>
            </View>
          ) : (
            tasksOnSelectedDate.map(task => (
              <Card key={task.id} style={styles.taskCard}>
                <Card.Content>
                  <View style={styles.taskHeader}>
                    <Title style={styles.taskTitle}>{task.title}</Title>
                    <Chip
                      mode="flat"
                      style={[
                        styles.statusChip, 
                        { 
                          backgroundColor: task.completed 
                            ? '#22c55e' 
                            : isTaskOverdue(task) 
                              ? '#ef4444' 
                              : '#f59e0b'
                        }
                      ]}
                      textStyle={{ color: 'white', fontSize: 12 }}
                    >
                      {task.completed 
                        ? 'Completed' 
                        : isTaskOverdue(task) 
                          ? 'Overdue' 
                          : 'Pending'}
                    </Chip>
                  </View>
                  
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  
                  <View style={styles.assetDetails}>
                    <MaterialCommunityIcons 
                      name="engine" 
                      size={16} 
                      color="#666" 
                    />
                    <Text style={styles.assetText}>
                      {task.assetNumber} - {task.assetName}
                    </Text>
                  </View>
                  
                  <View style={styles.taskFrequency}>
                    <MaterialCommunityIcons 
                      name="calendar-repeat" 
                      size={16} 
                      color="#666" 
                    />
                    <Text style={styles.frequencyText}>
                      Frequency: {task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1)}
                    </Text>
                  </View>
                  
                  <View style={styles.taskActions}>
                    <Button
                      mode={task.completed ? "outlined" : "contained"}
                      onPress={() => toggleTaskStatus(task.id)}
                      icon={task.completed ? "close" : "check"}
                      style={{ marginRight: 8 }}
                    >
                      {task.completed ? "Mark Incomplete" : "Mark Complete"}
                    </Button>
                    
                    <Button
                      mode="outlined"
                      onPress={() => navigation.navigate('MaintenanceTaskDetail', { taskId: task.id })}
                      icon="information-outline"
                    >
                      Details
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => navigation.navigate('NewMaintenanceTask')}
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
  calendarContainer: {
    backgroundColor: 'white',
    paddingBottom: 10,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  taskListContainer: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  taskCountText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
  },
  taskCard: {
    margin: 8,
    marginTop: 4,
    marginBottom: 12,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 24,
    alignSelf: 'flex-start',
  },
  taskDescription: {
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
  },
  assetDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetText: {
    marginLeft: 8,
    color: '#666',
  },
  taskFrequency: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  frequencyText: {
    marginLeft: 8,
    color: '#666',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bottomPadding: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default MaintenanceScreen;