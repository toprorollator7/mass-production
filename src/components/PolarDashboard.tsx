import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState, useEffect } from 'react';
import { useAuth } from '@workos-inc/authkit-react';

export function PolarDashboard() {
  const { user } = useAuth();
  const [customerState, setCustomerState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const getCustomerState = useAction(api.polar.getCustomerState);
  const createPortalSession = useAction(api.polar.createCustomerPortalSession);

  // Get orders and subscriptions from local database
  // Note: For now showing all orders. Future purchases will be linked to user ID
  // via externalCustomerId, so we can filter by user
  const orders = useQuery(api.polar.getAllOrders, {});

  const subscriptions = useQuery(api.polar.getAllSubscriptions, {});

  useEffect(() => {
    if (user?.id) {
      loadCustomerState();
    }
  }, [user?.id]);

  const loadCustomerState = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await getCustomerState({
        externalId: user.id,
      });

      if (result.success) {
        setCustomerState(result.state);
      }
    } catch (err) {
      console.error('Error loading customer state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    // Try to get customer ID from customerState or from subscriptions
    let customerId = customerState?.customer?.id;

    // If not in customerState, try to get from first subscription
    if (!customerId && subscriptions && subscriptions.length > 0) {
      customerId = subscriptions[0].customerId;
    }

    if (!customerId) {
      alert('Customer ID not found. Please make a purchase first.');
      return;
    }

    try {
      setLoadingPortal(true);
      const result = await createPortalSession({
        customerId: customerId,
      });

      if (result.success && result.customerPortalUrl) {
        // Redirect to pre-authenticated portal URL
        window.location.href = result.customerPortalUrl;
      } else {
        alert(result.error || 'Failed to create portal session');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open customer portal');
    } finally {
      setLoadingPortal(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Your Dashboard</h2>
      
      {/* Active Benefits */}
      {customerState?.granted_benefits && customerState.granted_benefits.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Active Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerState.granted_benefits.map((benefit: any) => (
              <div
                key={benefit.id}
                className="border-2 border-green-500 dark:border-green-600 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-500 dark:text-green-400">✓</span>
                  <h4 className="font-semibold">{benefit.description || 'Benefit'}</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Type: {benefit.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Active Subscriptions */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold">Subscriptions</h3>
          {subscriptions && subscriptions.length > 0 && (
            <button
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md text-sm font-semibold transition-colors"
            >
              {loadingPortal ? 'Loading...' : 'Manage Subscriptions'}
            </button>
          )}
        </div>
        {subscriptions && subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription._id}
                className="border-2 border-slate-200 dark:border-slate-800 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">Subscription</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ID: {subscription.subscriptionId}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      subscription.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : subscription.status === 'canceled'
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>

                {subscription.currentPeriodEnd && (
                  <p className="text-sm mb-3">
                    Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}

                {subscription.cancelAtPeriodEnd && (
                  <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-2 rounded mb-3 text-sm">
                    ⚠️ This subscription will be canceled at the end of the current billing period.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No active subscriptions.</p>
        )}
      </div>
      
      {/* Order History */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">Order History</h3>
        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border-2 border-slate-200 dark:border-slate-800 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">
                      ${(order.amount / 100).toFixed(2)} {order.currency}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === 'paid'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Order ID: {order.orderId}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
        )}
      </div>
      
      {loading && (
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400">Loading customer data...</p>
        </div>
      )}
    </div>
  );
}

