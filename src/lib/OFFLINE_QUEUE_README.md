# Offline Queue Management

This module implements offline support and synchronization for the Attention Wallet system, allowing the app to function when network connectivity is unavailable.

## Features

- **Network Connectivity Detection**: Automatically detects online/offline status
- **Transaction Queuing**: Queues transactions locally when offline using AsyncStorage
- **Automatic Synchronization**: Syncs queued transactions when connectivity is restored
- **Conflict Resolution**: Server-side precedence for resolving sync conflicts
- **Exponential Backoff**: Retry logic with exponential backoff for failed sync attempts
- **Real-time Status**: Provides real-time queue status and sync progress

## Architecture

### Core Components

1. **offlineQueue.ts**: Main offline queue management module
   - `networkHelpers`: Network connectivity detection
   - `queueHelpers`: Local transaction queue management
   - `syncHelpers`: Synchronization with server
   - `offlineQueueManager`: High-level interface

2. **useOfflineQueue.ts**: React hook for offline queue functionality
   - Provides React interface for queue operations
   - Handles periodic sync attempts
   - Manages app state changes for background sync

3. **WalletContext Integration**: Enhanced wallet context with offline support
   - Automatically queues transactions when offline
   - Optimistic UI updates for offline operations
   - Seamless online/offline mode switching

## Usage

### Basic Usage

```typescript
import { useOfflineQueue } from '../hooks';

const MyComponent = () => {
  const offlineQueue = useOfflineQueue();

  // Queue a transaction
  const handleEarnTokens = async () => {
    await offlineQueue.queueTransaction(
      'earn',
      10,
      'Complete homework',
      { proofImageUrl: 'homework.jpg' }
    );
  };

  // Check queue status
  const { queueLength, unsyncedCount, isOnline, isSyncing } = offlineQueue.status;

  // Manual sync
  const handleSync = async () => {
    const results = await offlineQueue.syncNow();
    console.log(`Synced: ${results.success} success, ${results.failed} failed`);
  };

  return (
    <div>
      <p>Queue: {queueLength} transactions ({unsyncedCount} unsynced)</p>
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
      {isSyncing && <p>Syncing...</p>}
      <button onClick={handleSync}>Sync Now</button>
    </div>
  );
};
```

### WalletContext Integration

The WalletContext automatically handles offline scenarios:

```typescript
import { useWallet } from '../context/WalletContext';

const MyComponent = () => {
  const { earnTokens, offlineStatus } = useWallet();

  // This will automatically queue if offline
  const handleEarnTokens = async () => {
    await earnTokens(10, 'Complete task', 'proof.jpg');
  };

  return (
    <div>
      <p>Offline Queue: {offlineStatus.unsyncedCount} pending</p>
      <button onClick={handleEarnTokens}>Earn Tokens</button>
    </div>
  );
};
```

## Configuration

### Storage Keys

- `@attention_wallet:offline_queue`: Queued transactions
- `@attention_wallet:last_sync`: Last sync timestamp
- `@attention_wallet:network_status`: Cached network status

### Network Detection

- **Check URL**: `https://www.google.com/generate_204`
- **Timeout**: 5 seconds
- **Retry Interval**: 30 seconds
- **Max Retries**: 3 with exponential backoff

## Data Flow

### Offline Transaction Flow

1. User performs action (earn/spend tokens)
2. Check network connectivity
3. If offline:
   - Queue transaction in AsyncStorage
   - Update UI optimistically
   - Show offline indicator
4. If online:
   - Process transaction immediately
   - Update database and UI

### Sync Flow

1. Detect network connectivity restored
2. Retrieve unsynced transactions from queue
3. Process each transaction sequentially
4. Handle conflicts with server-side precedence
5. Mark transactions as synced
6. Clean up synced transactions
7. Update UI with final state

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- Graceful degradation to offline mode
- User feedback for sync failures

### Data Conflicts
- Server-side precedence for conflict resolution
- Preserve user data integrity
- Alert users of any data recovery actions

### Storage Errors
- Fallback to in-memory queue if AsyncStorage fails
- Data validation and corruption detection
- Automatic recovery mechanisms

## Testing

Use the demo script to test offline functionality:

```typescript
import { testOfflineQueue, testNetworkDetection } from '../lib/__tests__/offlineQueueDemo';

// Test basic offline queue functionality
await testOfflineQueue();

// Test network connectivity detection
await testNetworkDetection();
```

## Requirements Satisfied

- **4.4**: WHEN the app is offline, THE Attention_Wallet_System SHALL queue transactions locally and sync when connectivity returns
- **8.1**: WHEN network connectivity is lost, THE Attention_Wallet_System SHALL continue functioning with cached data and queue pending operations

## Performance Considerations

- Minimal battery impact with efficient polling intervals
- Optimized AsyncStorage usage with batch operations
- Smart sync scheduling to avoid overwhelming the server
- Memory-efficient queue management with cleanup

## Security

- All queued data is stored locally on device
- No sensitive data exposed during offline operations
- Secure sync with HTTPS encryption
- Data integrity validation during sync