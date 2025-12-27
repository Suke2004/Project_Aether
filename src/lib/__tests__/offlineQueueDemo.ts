/**
 * Demo script to test offline queue functionality
 * This can be run to verify the offline queue works correctly
 */

import { offlineQueueManager, networkHelpers, queueHelpers } from '../offlineQueue';

/**
 * Demo function to test offline queue functionality
 */
export const testOfflineQueue = async () => {
  console.log('=== Offline Queue Demo ===');

  try {
    // Initialize the offline queue manager
    console.log('1. Initializing offline queue manager...');
    await offlineQueueManager.initialize();
    console.log('✓ Offline queue manager initialized');

    // Check network status
    console.log('2. Checking network connectivity...');
    const isOnline = await networkHelpers.isOnline();
    console.log(`✓ Network status: ${isOnline ? 'Online' : 'Offline'}`);

    // Queue some test transactions
    console.log('3. Queuing test transactions...');
    
    const earnId = await offlineQueueManager.queueTransaction(
      'earn',
      10,
      'Complete homework',
      { proofImageUrl: 'homework.jpg' }
    );
    console.log(`✓ Queued earn transaction: ${earnId}`);

    const spendId = await offlineQueueManager.queueTransaction(
      'spend',
      5,
      'Play game',
      { appName: 'TestGame' }
    );
    console.log(`✓ Queued spend transaction: ${spendId}`);

    // Check queue status
    console.log('4. Checking queue status...');
    const status = await offlineQueueManager.getStatus();
    console.log(`✓ Queue status:`, {
      queueLength: status.queueLength,
      unsyncedCount: status.unsyncedCount,
      isOnline: status.isOnline,
    });

    // Get unsynced transactions
    console.log('5. Getting unsynced transactions...');
    const unsynced = await queueHelpers.getUnsyncedTransactions();
    console.log(`✓ Found ${unsynced.length} unsynced transactions`);
    unsynced.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.type} ${tx.amount} tokens - ${tx.description}`);
    });

    // Test marking as synced
    if (unsynced.length > 0) {
      console.log('6. Testing mark as synced...');
      await queueHelpers.markAsSynced(unsynced[0].id);
      console.log(`✓ Marked transaction ${unsynced[0].id} as synced`);

      const updatedUnsynced = await queueHelpers.getUnsyncedTransactions();
      console.log(`✓ Unsynced count after marking: ${updatedUnsynced.length}`);
    }

    // Test cleanup
    console.log('7. Testing cleanup...');
    await queueHelpers.cleanupSyncedTransactions();
    console.log('✓ Cleaned up synced transactions');

    const finalStatus = await offlineQueueManager.getStatus();
    console.log(`✓ Final queue length: ${finalStatus.queueLength}`);

    console.log('=== Demo completed successfully! ===');
    return true;
  } catch (error) {
    console.error('Demo failed:', error);
    return false;
  }
};

/**
 * Test network connectivity detection
 */
export const testNetworkDetection = async () => {
  console.log('=== Network Detection Test ===');

  try {
    // Test online detection
    console.log('1. Testing online detection...');
    const isOnline = await networkHelpers.isOnline();
    console.log(`✓ Network status: ${isOnline ? 'Online' : 'Offline'}`);

    // Test storing network status
    console.log('2. Testing network status storage...');
    await networkHelpers.setNetworkStatus(false);
    const storedOffline = await networkHelpers.getNetworkStatus();
    console.log(`✓ Stored offline status: ${storedOffline}`);

    await networkHelpers.setNetworkStatus(true);
    const storedOnline = await networkHelpers.getNetworkStatus();
    console.log(`✓ Stored online status: ${storedOnline}`);

    console.log('=== Network detection test completed! ===');
    return true;
  } catch (error) {
    console.error('Network detection test failed:', error);
    return false;
  }
};

// Export for use in other files
export default {
  testOfflineQueue,
  testNetworkDetection,
};