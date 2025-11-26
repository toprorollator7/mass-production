import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useState, useEffect } from 'react';
import { useAuth } from '@workos-inc/authkit-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  prices?: Array<{
    id: string;
    priceAmount: number;
    priceCurrency: string;
    type: string;
    recurringInterval?: string;
  }>;
  medias?: Array<{
    publicUrl: string;
  }>;
}

export function PolarProducts() {
  const { user, signIn } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listProducts = useAction(api.polar.listProducts);
  const createCheckout = useAction(api.polar.createCheckout);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const result = await listProducts({});
      
      if (result.success) {
        setProducts(result.products as Product[]);
      } else {
        setError(result.error || 'Failed to load products');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (productId: string) => {
    // Require authentication before purchase
    if (!user || !user.email || !user.id) {
      // Redirect to sign in
      signIn();
      return;
    }

    try {
      const result = await createCheckout({
        productPriceId: productId,
        successUrl: `${window.location.origin}/success`,
        customerEmail: user.email,
        externalCustomerId: user.id, // Link to WorkOS user ID
      });

      if (result.success && result.checkoutUrl) {
        // Redirect to Polar checkout
        window.location.href = result.checkoutUrl;
      } else {
        alert(result.error || 'Failed to create checkout');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg">No products available yet.</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Create products in your Polar.sh dashboard to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6">Available Products</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border-2 border-slate-200 dark:border-slate-800 rounded-lg p-6 flex flex-col"
          >
            {product.medias && product.medias[0] && (
              <img
                src={product.medias[0].publicUrl}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
            )}
            
            <h3 className="text-xl font-bold mb-2">{product.name}</h3>
            
            {product.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                {product.description}
              </p>
            )}
            
            {product.prices && product.prices.length > 0 && (
              <div className="mb-4">
                <div className="text-lg font-semibold mb-2">
                  ${(product.prices[0].priceAmount / 100).toFixed(2)} {product.prices[0].priceCurrency.toUpperCase()}
                  {product.prices[0].recurringInterval && (
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      {' '}/ {product.prices[0].recurringInterval}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => handleCheckout(product.id)}
              className="w-full bg-dark dark:bg-light text-light dark:text-dark text-sm px-4 py-2 rounded-md border-2 hover:opacity-80 transition-opacity"
            >
              Purchase
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

