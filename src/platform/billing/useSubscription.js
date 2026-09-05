import { useContext } from 'react';
import { SubscriptionContext } from 'src/platform/billing/SubscriptionContext';

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
