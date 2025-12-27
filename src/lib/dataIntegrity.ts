/**
 * Data integrity validation and recovery service
 * Requirements: 8.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Profile, Transaction } from './types';
import { DataCorruptionHandler, DataCorruptionError } from './errorHandling';

export interface DataBackup {
  timestamp: string;
  version: string;
  profile: Profile | null;
  transactions: Transaction[];
  metadata: {
    totalTransactions: number;
    lastSyncTime: string;
    backupReason: string;
  };
}

export interface IntegrityCheckResult {
  isValid: boolean;
  errors: DataCorruptionError[];
  warnings: string[];
  canRecover: boolean;
  backupAvailable: boolean;
}

/**
 * Data Integrity Service
 */
export class DataIntegrityService {
  private static readonly BACKUP_KEY = 'data_backup';
  private static readonly BACKUP_HISTORY_KEY = 'backup_history';
  private static readonly MAX_BACKUPS = 5;
  private static readonly APP_VERSION = '1.0.0';

  /**
   * Perform comprehensive data integrity check on app startup
   */
  static async performStartupIntegrityCheck(
    profile: Profile | null,
    transactions: Transaction[]
  ): Promise<IntegrityCheckResult> {
    const errors: DataCorruptionError[] = [];
    const warnings: string[] = [];

    try {
      // Check profile data integrity
      if (profile) {
        const profileError = DataCorruptionHandler.validateProfileData(profile);
        if (profileError) {
          errors.push(profileError);
        }
      }

      // Check transaction data integrity
      for (const transaction of transactions) {
        const transactionError = DataCorruptionHandler.validateTransactionData(transaction);
        if (transactionError) {
          errors.push(transactionError);
        }
      }

      // Check logical consistency between profile and transactions
      if (profile && transactions.length > 0) {
        const consistencyErrors = this.validateDataConsistency(profile, transactions);
        errors.push(...consistencyErrors);
      }

      // Check for duplicate transactions
      const duplicateWarnings = this.checkForDuplicateTransactions(transactions);
      warnings.push(...duplicateWarnings);

      // Check backup availability
      const backupAvailable = await this.hasValidBackup();

      const result: IntegrityCheckResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        canRecover: errors.some(e => e.recoverable),
        backupAvailable,
      };

      console.log('Data integrity check completed:', {
        isValid: result.isValid,
        errorCount: errors.length,
        warningCount: warnings.length,
        canRecover: result.canRecover,
        backupAvailable: result.backupAvailable,
      });

      return result;
    } catch (error) {
      console.error('Integrity check failed:', error);
      
      const criticalError = DataCorruptionHandler.createDataCorruptionError(
        'STORAGE_CORRUPTION',
        'Failed to perform integrity check',
        'HIGH',
        false
      );

      return {
        isValid: false,
        errors: [criticalError],
        warnings: [],
        canRecover: false,
        backupAvailable: await this.hasValidBackup(),
      };
    }
  }

  /**
   * Create a backup of current data
   */
  static async createBackup(
    profile: Profile | null,
    transactions: Transaction[],
    reason: string = 'Manual backup'
  ): Promise<boolean> {
    try {
      const backup: DataBackup = {
        timestamp: new Date().toISOString(),
        version: this.APP_VERSION,
        profile,
        transactions,
        metadata: {
          totalTransactions: transactions.length,
          lastSyncTime: new Date().toISOString(),
          backupReason: reason,
        },
      };

      // Store the backup
      await AsyncStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));

      // Update backup history
      await this.updateBackupHistory(backup);

      console.log(`Data backup created: ${reason}`);
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * Restore data from backup
   */
  static async restoreFromBackup(): Promise<{ profile: Profile | null; transactions: Transaction[] } | null> {
    try {
      const backupData = await AsyncStorage.getItem(this.BACKUP_KEY);
      
      if (!backupData) {
        console.log('No backup data available');
        return null;
      }

      const backup: DataBackup = JSON.parse(backupData);

      // Validate backup data
      const backupIntegrity = await this.validateBackupIntegrity(backup);
      if (!backupIntegrity.isValid) {
        console.error('Backup data is corrupted:', backupIntegrity.errors);
        return null;
      }

      console.log(`Restored data from backup created at ${backup.timestamp}`);
      return {
        profile: backup.profile,
        transactions: backup.transactions,
      };
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return null;
    }
  }

  /**
   * Handle data corruption with recovery options
   */
  static async handleDataCorruption(
    errors: DataCorruptionError[],
    notifyParent?: (message: string) => Promise<void>
  ): Promise<{ recovered: boolean; backupRestored: boolean }> {
    let recovered = false;
    let backupRestored = false;

    // Sort errors by severity
    const criticalErrors = errors.filter(e => e.severity === 'HIGH');
    const mediumErrors = errors.filter(e => e.severity === 'MEDIUM');
    const lowErrors = errors.filter(e => e.severity === 'LOW');

    // Handle critical errors first
    for (const error of criticalErrors) {
      const result = await DataCorruptionHandler.handleDataCorruption(
        error,
        this.restoreFromBackup,
        notifyParent
      );
      
      if (result.backupRestored) {
        backupRestored = true;
        recovered = true;
        break; // If backup restored, no need to handle other errors
      }
    }

    // If backup wasn't restored, try to fix medium and low severity errors
    if (!backupRestored) {
      for (const error of [...mediumErrors, ...lowErrors]) {
        if (error.recoverable) {
          try {
            // Attempt automatic recovery based on error type
            const fixResult = await this.attemptAutomaticFix(error);
            if (fixResult) {
              recovered = true;
              console.log(`Automatically fixed error: ${error.type}`);
            }
          } catch (fixError) {
            console.error(`Failed to fix error ${error.type}:`, fixError);
          }
        }
      }
    }

    return { recovered, backupRestored };
  }

  /**
   * Clean up old backups to save storage space
   */
  static async cleanupOldBackups(): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(this.BACKUP_HISTORY_KEY);
      if (!historyData) return;

      const history: string[] = JSON.parse(historyData);
      
      if (history.length > this.MAX_BACKUPS) {
        const toKeep = history.slice(-this.MAX_BACKUPS);
        await AsyncStorage.setItem(this.BACKUP_HISTORY_KEY, JSON.stringify(toKeep));
        
        console.log(`Cleaned up ${history.length - toKeep.length} old backups`);
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Get backup status and information
   */
  static async getBackupInfo(): Promise<{
    hasBackup: boolean;
    lastBackupTime?: string;
    backupCount: number;
  }> {
    try {
      const backupData = await AsyncStorage.getItem(this.BACKUP_KEY);
      const historyData = await AsyncStorage.getItem(this.BACKUP_HISTORY_KEY);
      
      const hasBackup = !!backupData;
      let lastBackupTime: string | undefined;
      let backupCount = 0;

      if (backupData) {
        const backup: DataBackup = JSON.parse(backupData);
        lastBackupTime = backup.timestamp;
      }

      if (historyData) {
        const history: string[] = JSON.parse(historyData);
        backupCount = history.length;
      }

      return {
        hasBackup,
        lastBackupTime,
        backupCount,
      };
    } catch (error) {
      console.error('Failed to get backup info:', error);
      return {
        hasBackup: false,
        backupCount: 0,
      };
    }
  }

  // Private helper methods

  private static validateDataConsistency(profile: Profile, transactions: Transaction[]): DataCorruptionError[] {
    const errors: DataCorruptionError[] = [];

    try {
      // Calculate expected balance from transactions
      const earnTransactions = transactions.filter(t => t.type === 'earn');
      const spendTransactions = transactions.filter(t => t.type === 'spend');
      
      const totalEarned = earnTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalSpent = spendTransactions.reduce((sum, t) => sum + t.amount, 0);
      const expectedBalance = totalEarned - totalSpent;

      // Check balance consistency
      if (Math.abs(profile.balance - expectedBalance) > 0.01) { // Allow for small floating point errors
        errors.push(DataCorruptionHandler.createDataCorruptionError(
          'PROFILE_CORRUPTION',
          `Profile balance (${profile.balance}) doesn't match calculated balance (${expectedBalance})`,
          'MEDIUM',
          true,
          true
        ));
      }

      // Check total_earned consistency
      if (Math.abs(profile.total_earned - totalEarned) > 0.01) {
        errors.push(DataCorruptionHandler.createDataCorruptionError(
          'PROFILE_CORRUPTION',
          `Profile total_earned (${profile.total_earned}) doesn't match calculated total (${totalEarned})`,
          'LOW',
          true,
          true
        ));
      }

      // Check total_spent consistency
      if (Math.abs(profile.total_spent - totalSpent) > 0.01) {
        errors.push(DataCorruptionHandler.createDataCorruptionError(
          'PROFILE_CORRUPTION',
          `Profile total_spent (${profile.total_spent}) doesn't match calculated total (${totalSpent})`,
          'LOW',
          true,
          true
        ));
      }

    } catch (error) {
      errors.push(DataCorruptionHandler.createDataCorruptionError(
        'PROFILE_CORRUPTION',
        'Failed to validate data consistency',
        'MEDIUM',
        true,
        true
      ));
    }

    return errors;
  }

  private static checkForDuplicateTransactions(transactions: Transaction[]): string[] {
    const warnings: string[] = [];
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const transaction of transactions) {
      // Create a unique key based on transaction properties (excluding ID)
      const key = `${transaction.user_id}-${transaction.amount}-${transaction.type}-${transaction.description}-${transaction.timestamp}`;
      
      if (seen.has(key)) {
        duplicates.add(key);
      } else {
        seen.add(key);
      }
    }

    if (duplicates.size > 0) {
      warnings.push(`Found ${duplicates.size} potential duplicate transactions`);
    }

    return warnings;
  }

  private static async hasValidBackup(): Promise<boolean> {
    try {
      const backupData = await AsyncStorage.getItem(this.BACKUP_KEY);
      if (!backupData) return false;

      const backup: DataBackup = JSON.parse(backupData);
      const integrity = await this.validateBackupIntegrity(backup);
      
      return integrity.isValid;
    } catch (error) {
      return false;
    }
  }

  private static async validateBackupIntegrity(backup: DataBackup): Promise<IntegrityCheckResult> {
    const errors: DataCorruptionError[] = [];
    const warnings: string[] = [];

    try {
      // Check backup structure
      if (!backup.timestamp || !backup.version || !backup.metadata) {
        errors.push(DataCorruptionHandler.createDataCorruptionError(
          'STORAGE_CORRUPTION',
          'Backup structure is invalid',
          'HIGH',
          false
        ));
      }

      // Check backup age (warn if older than 7 days)
      const backupAge = Date.now() - new Date(backup.timestamp).getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (backupAge > sevenDays) {
        warnings.push(`Backup is ${Math.floor(backupAge / (24 * 60 * 60 * 1000))} days old`);
      }

      // Validate profile data if present
      if (backup.profile) {
        const profileError = DataCorruptionHandler.validateProfileData(backup.profile);
        if (profileError) {
          errors.push(profileError);
        }
      }

      // Validate transaction data
      for (const transaction of backup.transactions) {
        const transactionError = DataCorruptionHandler.validateTransactionData(transaction);
        if (transactionError) {
          errors.push(transactionError);
        }
      }

    } catch (error) {
      errors.push(DataCorruptionHandler.createDataCorruptionError(
        'STORAGE_CORRUPTION',
        'Failed to validate backup integrity',
        'HIGH',
        false
      ));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      canRecover: false,
      backupAvailable: false,
    };
  }

  private static async updateBackupHistory(backup: DataBackup): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(this.BACKUP_HISTORY_KEY);
      const history: string[] = historyData ? JSON.parse(historyData) : [];
      
      history.push(backup.timestamp);
      
      // Keep only the most recent backups
      const recentHistory = history.slice(-this.MAX_BACKUPS);
      
      await AsyncStorage.setItem(this.BACKUP_HISTORY_KEY, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Failed to update backup history:', error);
    }
  }

  private static async attemptAutomaticFix(error: DataCorruptionError): Promise<boolean> {
    try {
      switch (error.type) {
        case 'PROFILE_CORRUPTION':
          // For profile corruption, we could recalculate totals from transactions
          // This would require access to the current transaction data
          console.log('Profile corruption detected, manual intervention may be required');
          return false;

        case 'TRANSACTION_CORRUPTION':
          // For transaction corruption, we could remove invalid transactions
          // This would require careful consideration of data loss
          console.log('Transaction corruption detected, manual intervention may be required');
          return false;

        case 'STORAGE_CORRUPTION':
          // For storage corruption, we could clear corrupted data
          // This is risky and should only be done with user consent
          console.log('Storage corruption detected, backup restoration recommended');
          return false;

        default:
          return false;
      }
    } catch (fixError) {
      console.error('Automatic fix failed:', fixError);
      return false;
    }
  }
}

/**
 * Hook for using data integrity service in components
 */
export const useDataIntegrity = () => {
  const performIntegrityCheck = async (profile: Profile | null, transactions: Transaction[]) => {
    return await DataIntegrityService.performStartupIntegrityCheck(profile, transactions);
  };

  const createBackup = async (profile: Profile | null, transactions: Transaction[], reason?: string) => {
    return await DataIntegrityService.createBackup(profile, transactions, reason);
  };

  const restoreFromBackup = async () => {
    return await DataIntegrityService.restoreFromBackup();
  };

  const handleCorruption = async (errors: DataCorruptionError[], notifyParent?: (message: string) => Promise<void>) => {
    return await DataIntegrityService.handleDataCorruption(errors, notifyParent);
  };

  const getBackupInfo = async () => {
    return await DataIntegrityService.getBackupInfo();
  };

  return {
    performIntegrityCheck,
    createBackup,
    restoreFromBackup,
    handleCorruption,
    getBackupInfo,
  };
};