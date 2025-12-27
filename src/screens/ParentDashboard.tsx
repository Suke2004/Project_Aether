/**
 * Parent Dashboard Screen
 * Displays real-time balance, transaction history, and analytics charts
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.5
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth, useWallet } from '../context';
import { Transaction, Profile } from '../lib/types';
import { dbHelpers, realtimeHelpers, getSupabaseClient } from '../lib/supabase';
import { QuestManagement } from '../components';

const { width: screenWidth } = Dimensions.get('window');

interface ChildProfile extends Profile {
  name?: string; // We'll use email as name for now
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

/**
 * Parent Dashboard Component
 * Provides comprehensive monitoring and analytics for child accounts
 * Includes real-time data synchronization and multiple concurrent session handling
 */
const ParentDashboard: React.FC = () => {
  const { user, profile, hasRole } = useAuth();
  const { refreshBalance } = useWallet();
  
  // State for child profiles and data
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [childTransactions, setChildTransactions] = useState<Transaction[]>([]);
  
  // Loading and refresh states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  // Quest management modal state
  const [showQuestManagement, setShowQuestManagement] = useState(false);
  
  // Chart data
  const [earningSpendingData, setEarningSpendingData] = useState<ChartData | null>(null);
  const [dailyActivityData, setDailyActivityData] = useState<ChartData | null>(null);

  // Real-time subscription management
  const profileSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const transactionSubscriptionRef = useRef<RealtimeChannel | null>(null);
  const supabase = getSupabaseClient();

  // Check if user has parent role
  useEffect(() => {
    if (!hasRole('parent')) {
      Alert.alert(
        'Access Denied',
        'This dashboard is only available to parent accounts.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    loadChildProfiles();
  }, [profile]);

  // Load selected child data when selection changes
  useEffect(() => {
    if (selectedChildId) {
      loadChildData(selectedChildId);
      setupRealtimeSubscriptions(selectedChildId);
    } else {
      cleanupRealtimeSubscriptions();
    }
    
    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, [selectedChildId]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, []);

  /**
   * Load all child profiles associated with this parent
   * For now, we'll load all child profiles (in a real app, you'd have parent-child relationships)
   */
  const loadChildProfiles = async () => {
    try {
      setIsLoading(true);
      
      // Get all child profiles (simplified - in production you'd have parent-child relationships)
      const profiles = await dbHelpers.getChildProfiles();
      
      // Add email as name for display
      const childProfilesWithNames = profiles.map(profile => ({
        ...profile,
        name: `Child ${profile.id.slice(0, 8)}`, // Simplified name
      }));
      
      setChildProfiles(childProfilesWithNames);
      
      // Auto-select first child if available
      if (childProfilesWithNames.length > 0 && !selectedChildId) {
        setSelectedChildId(childProfilesWithNames[0].id);
      }
      
    } catch (error) {
      console.error('Failed to load child profiles:', error);
      Alert.alert('Error', 'Failed to load child profiles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load data for selected child
   */
  const loadChildData = async (childId: string) => {
    try {
      setIsLoading(true);
      
      // Get child profile
      const childProfile = await dbHelpers.getProfile(childId);
      if (!childProfile) {
        throw new Error('Child profile not found');
      }
      
      setSelectedChild({
        ...childProfile,
        name: `Child ${childProfile.id.slice(0, 8)}`,
      });
      
      // Get child transactions (last 50 for performance)
      const transactions = await dbHelpers.getTransactions(childId, 50);
      setChildTransactions(transactions);
      
      // Generate chart data
      generateChartData(transactions, childProfile);
      
    } catch (error) {
      console.error('Failed to load child data:', error);
      Alert.alert('Error', 'Failed to load child data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate chart data from transactions
   */
  const generateChartData = (transactions: Transaction[], profile: Profile) => {
    // Generate earning vs spending chart data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });
    
    const earningData = last7Days.map(date => {
      return transactions
        .filter(t => t.type === 'earn' && t.timestamp.startsWith(date))
        .reduce((sum, t) => sum + t.amount, 0);
    });
    
    const spendingData = last7Days.map(date => {
      return transactions
        .filter(t => t.type === 'spend' && t.timestamp.startsWith(date))
        .reduce((sum, t) => sum + t.amount, 0);
    });
    
    setEarningSpendingData({
      labels: last7Days.map(date => new Date(date).toLocaleDateString('en', { weekday: 'short' })),
      datasets: [
        {
          data: earningData,
          color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`, // Green for earning
          strokeWidth: 2,
        },
        {
          data: spendingData,
          color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`, // Red for spending
          strokeWidth: 2,
        },
      ],
    });
    
    // Generate daily activity chart (total transactions per day)
    const activityData = last7Days.map(date => {
      return transactions.filter(t => t.timestamp.startsWith(date)).length;
    });
    
    setDailyActivityData({
      labels: last7Days.map(date => new Date(date).toLocaleDateString('en', { weekday: 'short' })),
      datasets: [
        {
          data: activityData,
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`, // Blue for activity
        },
      ],
    });
  };

  /**
   * Set up real-time subscriptions for selected child
   * Requirements: 3.2, 7.5
   */
  const setupRealtimeSubscriptions = (childId: string) => {
    try {
      setConnectionStatus('connecting');
      
      // Clean up existing subscriptions first
      cleanupRealtimeSubscriptions();

      console.log('Setting up real-time subscriptions for child:', childId);

      // Subscribe to profile changes for balance updates
      const profileChannel = supabase
        .channel(`parent-dashboard-profile-${childId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${childId}`,
          },
          (payload) => {
            console.log('Profile updated via realtime:', payload.new);
            const updatedProfile = payload.new as Profile;
            
            // Update selected child data
            setSelectedChild(prev => prev ? {
              ...prev,
              ...updatedProfile,
              name: prev.name, // Preserve the display name
            } : null);
            
            // Regenerate charts with updated profile data
            generateChartData(childTransactions, updatedProfile);
          }
        )
        .subscribe((status) => {
          console.log('Profile subscription status:', status);
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('disconnected');
            console.error('Profile subscription failed:', status);
          }
        });

      // Subscribe to new transactions
      const transactionChannel = supabase
        .channel(`parent-dashboard-transactions-${childId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${childId}`,
          },
          (payload) => {
            console.log('New transaction via realtime:', payload.new);
            const newTransaction = payload.new as Transaction;
            
            // Add new transaction to the list
            setChildTransactions(prev => {
              const updated = [newTransaction, ...prev];
              
              // Regenerate charts with new transaction data
              if (selectedChild) {
                generateChartData(updated, selectedChild);
              }
              
              return updated;
            });
          }
        )
        .subscribe((status) => {
          console.log('Transaction subscription status:', status);
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Transaction subscription failed:', status);
          }
        });

      // Store subscription references for cleanup
      profileSubscriptionRef.current = profileChannel;
      transactionSubscriptionRef.current = transactionChannel;

      console.log('Real-time subscriptions established for child:', childId);
    } catch (error) {
      console.error('Failed to set up real-time subscriptions:', error);
      setConnectionStatus('disconnected');
    }
  };

  /**
   * Clean up real-time subscriptions
   */
  const cleanupRealtimeSubscriptions = () => {
    try {
      if (profileSubscriptionRef.current) {
        console.log('Cleaning up profile subscription');
        supabase.removeChannel(profileSubscriptionRef.current);
        profileSubscriptionRef.current = null;
      }
      
      if (transactionSubscriptionRef.current) {
        console.log('Cleaning up transaction subscription');
        supabase.removeChannel(transactionSubscriptionRef.current);
        transactionSubscriptionRef.current = null;
      }
      
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Error cleaning up subscriptions:', error);
    }
  };

  /**
   * Handle refresh with real-time reconnection
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadChildProfiles();
      if (selectedChildId) {
        await loadChildData(selectedChildId);
        // Reconnect real-time subscriptions
        setupRealtimeSubscriptions(selectedChildId);
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Error', 'Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Render connection status indicator
   */
  const renderConnectionStatus = () => (
    <View style={styles.connectionStatus}>
      <View style={[
        styles.connectionIndicator,
        connectionStatus === 'connected' && styles.connectionConnected,
        connectionStatus === 'connecting' && styles.connectionConnecting,
        connectionStatus === 'disconnected' && styles.connectionDisconnected,
      ]} />
      <Text style={styles.connectionText}>
        {connectionStatus === 'connected' && 'Live Updates Active'}
        {connectionStatus === 'connecting' && 'Connecting...'}
        {connectionStatus === 'disconnected' && 'Offline Mode'}
      </Text>
      {connectionStatus === 'connecting' && (
        <ActivityIndicator size="small" color="#00d4ff" style={styles.connectionSpinner} />
      )}
    </View>
  );

  /**
   * Render child selector
   */
  const renderChildSelector = () => (
    <View style={styles.childSelector}>
      <Text style={styles.sectionTitle}>Select Child</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {childProfiles.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[
              styles.childButton,
              selectedChildId === child.id && styles.childButtonSelected,
            ]}
            onPress={() => setSelectedChildId(child.id)}
          >
            <Text
              style={[
                styles.childButtonText,
                selectedChildId === child.id && styles.childButtonTextSelected,
              ]}
            >
              {child.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  /**
   * Render management section with quest configuration
   */
  const renderManagementSection = () => (
    <View style={styles.managementSection}>
      <Text style={styles.sectionTitle}>Management</Text>
      <View style={styles.managementButtons}>
        <TouchableOpacity
          style={styles.managementButton}
          onPress={() => setShowQuestManagement(true)}
        >
          <Text style={styles.managementButtonText}>🎯 Manage Quest Types</Text>
          <Text style={styles.managementButtonSubtext}>
            Create, edit, and configure quest rewards
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Render balance overview
   */
  const renderBalanceOverview = () => {
    if (!selectedChild) return null;
    
    return (
      <View style={styles.balanceOverview}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        <View style={styles.balanceGrid}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>{selectedChild.balance}</Text>
            <Text style={styles.balanceUnit}>tokens</Text>
          </View>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Earned</Text>
            <Text style={[styles.balanceValue, styles.earnedValue]}>
              {selectedChild.total_earned}
            </Text>
            <Text style={styles.balanceUnit}>tokens</Text>
          </View>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Spent</Text>
            <Text style={[styles.balanceValue, styles.spentValue]}>
              {selectedChild.total_spent}
            </Text>
            <Text style={styles.balanceUnit}>tokens</Text>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render analytics charts
   */
  const renderAnalytics = () => {
    if (!earningSpendingData || !dailyActivityData) return null;
    
    const chartConfig = {
      backgroundColor: '#1a1a2e',
      backgroundGradientFrom: '#16213e',
      backgroundGradientTo: '#0f3460',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '6',
        strokeWidth: '2',
        stroke: '#ffa726',
      },
    };
    
    return (
      <View style={styles.analytics}>
        <Text style={styles.sectionTitle}>Analytics</Text>
        
        {/* Earning vs Spending Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Earning vs Spending (Last 7 Days)</Text>
          <LineChart
            data={earningSpendingData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
              <Text style={styles.legendText}>Earned</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
              <Text style={styles.legendText}>Spent</Text>
            </View>
          </View>
        </View>
        
        {/* Daily Activity Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Daily Activity (Transactions)</Text>
          <BarChart
            data={dailyActivityData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
      </View>
    );
  };

  /**
   * Render transaction history
   */
  const renderTransactionHistory = () => (
    <View style={styles.transactionHistory}>
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {childTransactions.length === 0 ? (
        <Text style={styles.emptyText}>No transactions yet</Text>
      ) : (
        childTransactions.slice(0, 10).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription}>
                {transaction.description}
              </Text>
              <Text style={styles.transactionTime}>
                {formatTimestamp(transaction.timestamp)}
              </Text>
              {transaction.app_name && (
                <Text style={styles.transactionApp}>App: {transaction.app_name}</Text>
              )}
            </View>
            <View style={styles.transactionAmount}>
              <Text
                style={[
                  styles.transactionAmountText,
                  transaction.type === 'earn' ? styles.earnedAmount : styles.spentAmount,
                ]}
              >
                {transaction.type === 'earn' ? '+' : '-'}{transaction.amount}
              </Text>
              <Text style={styles.transactionType}>
                {transaction.type === 'earn' ? 'earned' : 'spent'}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  // Show access denied if not parent
  if (!hasRole('parent')) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Parent account required.</Text>
      </View>
    );
  }

  // Show loading state
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Show empty state if no children
  if (childProfiles.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No child accounts found.</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {renderConnectionStatus()}
      {renderChildSelector()}
      {renderBalanceOverview()}
      {renderManagementSection()}
      {renderAnalytics()}
      {renderTransactionHistory()}
      
      {/* Quest Management Modal */}
      <QuestManagement
        visible={showQuestManagement}
        onClose={() => setShowQuestManagement(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  
  // Connection Status Styles
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionConnected: {
    backgroundColor: '#2ecc71',
  },
  connectionConnecting: {
    backgroundColor: '#f39c12',
  },
  connectionDisconnected: {
    backgroundColor: '#e74c3c',
  },
  connectionText: {
    color: '#8892b0',
    fontSize: 12,
    fontWeight: '500',
  },
  connectionSpinner: {
    marginLeft: 8,
  },
  
  // Child Selector Styles
  childSelector: {
    marginBottom: 20,
  },
  childButton: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  childButtonSelected: {
    backgroundColor: '#00d4ff',
    borderColor: '#00d4ff',
  },
  childButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  childButtonTextSelected: {
    color: '#0a0a0a',
    fontWeight: '600',
  },
  
  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  
  // Balance Overview Styles
  balanceOverview: {
    marginBottom: 30,
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceCard: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  balanceLabel: {
    color: '#8892b0',
    fontSize: 12,
    marginBottom: 5,
  },
  balanceValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  earnedValue: {
    color: '#2ecc71',
  },
  spentValue: {
    color: '#e74c3c',
  },
  balanceUnit: {
    color: '#8892b0',
    fontSize: 10,
    marginTop: 2,
  },
  
  // Management Section Styles
  managementSection: {
    marginBottom: 30,
  },
  managementButtons: {
    gap: 15,
  },
  managementButton: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
  },
  managementButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  managementButtonSubtext: {
    color: '#8892b0',
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Analytics Styles
  analytics: {
    marginBottom: 30,
  },
  chartContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    color: '#8892b0',
    fontSize: 12,
  },
  
  // Transaction History Styles
  transactionHistory: {
    marginBottom: 20,
  },
  transactionItem: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionTime: {
    color: '#8892b0',
    fontSize: 12,
    marginBottom: 2,
  },
  transactionApp: {
    color: '#00d4ff',
    fontSize: 11,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  earnedAmount: {
    color: '#2ecc71',
  },
  spentAmount: {
    color: '#e74c3c',
  },
  transactionType: {
    color: '#8892b0',
    fontSize: 10,
    marginTop: 2,
  },
  
  // State Styles
  loadingText: {
    color: '#8892b0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#8892b0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  refreshButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ParentDashboard;