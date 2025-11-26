import { useEffect, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function PolarSuccess() {
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const getCheckout = useAction(api.polar.getCheckout);

  useEffect(() => {
    // Get checkout ID from URL params
    const params = new URLSearchParams(window.location.search);
    const checkoutId = params.get('checkout_id');
    
    if (checkoutId) {
      loadCheckoutData(checkoutId);
    } else {
      setLoading(false);
    }
  }, []);

  const loadCheckoutData = async (checkoutId: string) => {
    try {
      const result = await getCheckout({ checkoutId });
      
      if (result.success) {
        setCheckoutData(result.checkout);
      }
    } catch (err) {
      console.error('Error loading checkout:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for your purchase.
          </p>
        </div>
        
        {checkoutData && (
          <div className="mb-6 text-left">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Order ID
              </p>
              <p className="font-mono text-sm break-all">
                {checkoutData.id}
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <a
            href="/"
            className="block w-full bg-dark dark:bg-light text-light dark:text-dark text-sm px-4 py-2 rounded-md border-2 hover:opacity-80 transition-opacity"
          >
            Return to Home
          </a>
          <a
            href="/dashboard"
            className="block w-full border-2 border-dark dark:border-light text-dark dark:text-light text-sm px-4 py-2 rounded-md hover:bg-dark hover:text-light dark:hover:bg-light dark:hover:text-dark transition-colors"
          >
            View Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

