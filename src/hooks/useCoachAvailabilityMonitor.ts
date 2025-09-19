import { useEffect, useRef } from 'react';
import { checkAndReassignAthletesOfUnavailableCoaches } from '@/services/coachAssignmentService';

/**
 * Hook to periodically check and reassign athletes from unavailable coaches
 */
export const useCoachAvailabilityMonitor = (
  region: string | undefined, 
  isEnabled: boolean = true,
  intervalMinutes: number = 30 // Check every 30 minutes
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isEnabled || !region) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const checkCoachAvailability = async () => {
      try {
        console.log(`[Coach Monitor] Checking coach availability in region: ${region}`);
        const result = await checkAndReassignAthletesOfUnavailableCoaches(region);
        
        if (result.success && result.reassignedCount > 0) {
          console.log(`[Coach Monitor] Successfully reassigned ${result.reassignedCount} athletes`);
        }
      } catch (error) {
        console.warn('[Coach Monitor] Error checking coach availability:', error);
      }
    };

    // Run immediately on mount
    checkCoachAvailability();

    // Set up periodic checking
    intervalRef.current = setInterval(checkCoachAvailability, intervalMinutes * 60 * 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [region, isEnabled, intervalMinutes]);

  // Manual trigger function
  const triggerCheck = async () => {
    if (region) {
      await checkAndReassignAthletesOfUnavailableCoaches(region);
    }
  };

  return { triggerCheck };
};