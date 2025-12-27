/**
 * Window Manager for Browser-based App Control
 * Handles automatic window closing and detection of user-closed windows
 */

export interface ManagedWindow {
  window: Window | null;
  appName: string;
  url: string;
  startTime: number;
  isActive: boolean;
}

class WindowManager {
  private managedWindows: Map<string, ManagedWindow> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private onWindowClosed?: (appName: string) => void;

  constructor() {
    this.startWindowMonitoring();
  }

  /**
   * Open a new managed window for an app
   */
  openWindow(appName: string, url: string, onClosed?: (appName: string) => void): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Close any existing window for this app
        this.closeWindow(appName);

        // Set the callback for when window is closed
        if (onClosed) {
          this.onWindowClosed = onClosed;
        }

        // Open new window with specific features for better control
        const windowFeatures = [
          'width=1200',
          'height=800',
          'left=100',
          'top=100',
          'toolbar=yes',
          'location=yes',
          'directories=no',
          'status=yes',
          'menubar=yes',
          'scrollbars=yes',
          'copyhistory=no',
          'resizable=yes'
        ].join(',');

        const newWindow = window.open(url, `aether_${appName}`, windowFeatures);

        if (newWindow) {
          const managedWindow: ManagedWindow = {
            window: newWindow,
            appName,
            url,
            startTime: Date.now(),
            isActive: true
          };

          this.managedWindows.set(appName, managedWindow);

          // Focus the new window
          newWindow.focus();

          console.log(`Opened managed window for ${appName}: ${url}`);
          resolve(true);
        } else {
          console.error(`Failed to open window for ${appName} - popup blocked?`);
          resolve(false);
        }
      } catch (error) {
        console.error(`Error opening window for ${appName}:`, error);
        resolve(false);
      }
    });
  }

  /**
   * Close a specific app's window
   */
  closeWindow(appName: string): boolean {
    const managedWindow = this.managedWindows.get(appName);
    
    if (managedWindow && managedWindow.window && !managedWindow.window.closed) {
      try {
        managedWindow.window.close();
        managedWindow.isActive = false;
        console.log(`Closed window for ${appName}`);
        return true;
      } catch (error) {
        console.error(`Error closing window for ${appName}:`, error);
      }
    }

    // Remove from managed windows
    this.managedWindows.delete(appName);
    return false;
  }

  /**
   * Close all managed windows
   */
  closeAllWindows(): void {
    for (const [appName] of this.managedWindows) {
      this.closeWindow(appName);
    }
  }

  /**
   * Check if a window is still open
   */
  isWindowOpen(appName: string): boolean {
    const managedWindow = this.managedWindows.get(appName);
    return managedWindow?.window ? !managedWindow.window.closed : false;
  }

  /**
   * Get all active windows
   */
  getActiveWindows(): string[] {
    const activeWindows: string[] = [];
    
    for (const [appName, managedWindow] of this.managedWindows) {
      if (managedWindow.window && !managedWindow.window.closed) {
        activeWindows.push(appName);
      }
    }
    
    return activeWindows;
  }

  /**
   * Start monitoring windows for closure detection
   */
  private startWindowMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkWindowStatus();
    }, 1000); // Check every second
  }

  /**
   * Check status of all managed windows
   */
  private checkWindowStatus(): void {
    for (const [appName, managedWindow] of this.managedWindows) {
      if (managedWindow.window && managedWindow.window.closed && managedWindow.isActive) {
        // Window was closed by user
        console.log(`Detected that ${appName} window was closed by user`);
        managedWindow.isActive = false;
        
        // Notify callback
        if (this.onWindowClosed) {
          this.onWindowClosed(appName);
        }
        
        // Remove from managed windows
        this.managedWindows.delete(appName);
      }
    }
  }

  /**
   * Set callback for when windows are closed
   */
  setOnWindowClosed(callback: (appName: string) => void): void {
    this.onWindowClosed = callback;
  }

  /**
   * Get window information
   */
  getWindowInfo(appName: string): ManagedWindow | undefined {
    return this.managedWindows.get(appName);
  }

  /**
   * Focus a specific window
   */
  focusWindow(appName: string): boolean {
    const managedWindow = this.managedWindows.get(appName);
    
    if (managedWindow && managedWindow.window && !managedWindow.window.closed) {
      try {
        managedWindow.window.focus();
        return true;
      } catch (error) {
        console.error(`Error focusing window for ${appName}:`, error);
      }
    }
    
    return false;
  }

  /**
   * Cleanup - close all windows and stop monitoring
   */
  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.closeAllWindows();
    this.managedWindows.clear();
  }
}

// Create singleton instance
export const windowManager = new WindowManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    windowManager.cleanup();
  });
}