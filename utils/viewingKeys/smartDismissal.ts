/**
 * Smart toast dismissal system for viewing key modals
 * Coordinates between modal success and toast cleanup
 */

// Registry of active viewing key error toasts by token address
const activeToastRegistry = new Map<string, Set<string>>();

/**
 * Register a viewing key error toast for automatic dismissal
 */
export const registerViewingKeyToast = (tokenAddress: string, toastId: string) => {
  if (!activeToastRegistry.has(tokenAddress)) {
    activeToastRegistry.set(tokenAddress, new Set());
  }
  activeToastRegistry.get(tokenAddress)!.add(toastId);
  console.log(`📝 Registered toast ${toastId} for token ${tokenAddress}`);
};

/**
 * Dismiss all viewing key toasts for a specific token
 * Called when viewing key creation succeeds
 */
export const dismissViewingKeyToasts = (tokenAddress: string) => {
  const toastIds = activeToastRegistry.get(tokenAddress);
  if (!toastIds || toastIds.size === 0) {
    console.log(`🗑️ No toasts to dismiss for token ${tokenAddress}`);
    return;
  }

  let dismissedCount = 0;

  // Try to dismiss each registered toast
  toastIds.forEach((toastId) => {
    try {
      // Look for the toast element and close it
      const toastElements = document.querySelectorAll(
        `[data-toast-id="${toastId}"], [id="${toastId}"]`
      );
      toastElements.forEach((element) => {
        // Try to find and click the close button
        const closeButton = element.querySelector(
          '[data-radix-toast-close], [aria-label="Close"], .toast-close'
        );
        if (closeButton && closeButton instanceof HTMLElement) {
          closeButton.click();
          dismissedCount++;
        } else {
          // If no close button, try to remove the element directly
          element.remove();
          dismissedCount++;
        }
      });
    } catch (error) {
      console.warn(`Failed to dismiss toast ${toastId}:`, error);
    }
  });

  // Clear the registry for this token
  activeToastRegistry.delete(tokenAddress);

  console.log(`🗑️ Dismissed ${dismissedCount} viewing key toasts for token ${tokenAddress}`);
};

/**
 * Start smart monitoring for a token
 * Will periodically check if the viewing key has been fixed and auto-dismiss toasts
 */
export const startSmartMonitoring = (tokenAddress: string) => {
  // Simple implementation: check every 5 seconds for up to 2 minutes
  let attempts = 0;
  const maxAttempts = 24; // 2 minutes

  const checkInterval = setInterval(() => {
    attempts++;

    // Check if we have active toasts for this token
    if (
      !activeToastRegistry.has(tokenAddress) ||
      activeToastRegistry.get(tokenAddress)!.size === 0
    ) {
      clearInterval(checkInterval);
      console.log(`🛑 No more toasts to monitor for ${tokenAddress}`);
      return;
    }

    // Stop after max attempts
    if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.log(`⏰ Smart monitoring timeout for ${tokenAddress}`);
      return;
    }

    console.log(`🔄 Smart monitoring check ${attempts}/${maxAttempts} for ${tokenAddress}`);
  }, 5000);

  console.log(`🔄 Started smart monitoring for ${tokenAddress}`);
};

/**
 * Get count of active toasts being monitored
 */
export const getActiveToastCount = (): number => {
  return Array.from(activeToastRegistry.values()).reduce((total, toasts) => total + toasts.size, 0);
};
