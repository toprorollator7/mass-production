# Polar.sh Quick Start Guide

Get up and running with Polar.sh monetization in 5 minutes!

## 1. Install Dependencies ✅

Already done! The `@polar-sh/sdk` package is installed.

## 2. Get Your Polar.sh Token

```bash
# 1. Go to https://polar.sh/settings
# 2. Create an Organization Access Token
# 3. Copy the token (starts with polar_oat_)
```

## 3. Configure Environment

```bash
# Add to your .env file
echo "POLAR_ACCESS_TOKEN=polar_oat_your_token_here" >> .env
echo "POLAR_SERVER=sandbox" >> .env

# Push to Convex
npx convex env set POLAR_ACCESS_TOKEN polar_oat_your_token_here
npx convex env set POLAR_SERVER sandbox
```

## 4. Create a Product in Polar.sh

1. Go to https://polar.sh/dashboard
2. Click "Products" → "Create Product"
3. Fill in:
   - **Name**: "Premium Plan"
   - **Description**: "Access to premium features"
   - **Price**: $9.99/month (or one-time)
4. Click "Create"

## 5. Start Your App

```bash
npm run dev
```

## 6. Test the Integration

1. Open http://localhost:5173
2. Click "Products" in the navigation
3. You should see your Polar.sh products!
4. Click "Purchase" to test checkout

## 7. Set Up Webhooks (Optional but Recommended)

```bash
# 1. Get your Convex deployment URL
npx convex dashboard

# 2. In Polar.sh dashboard:
#    - Go to Settings → Webhooks
#    - Add endpoint: https://your-deployment.convex.site/polarWebhook
#    - Select events: order.*, subscription.*, checkout.*
```

## What's Included?

### Pages
- **`/products`** - Browse and purchase products
- **`/dashboard`** - View orders and subscriptions
- **`/success`** - Payment confirmation page

### Convex Functions

#### Actions (API Calls)
```typescript
// List products
api.polar.listProducts({ limit: 10 })

// Create checkout
api.polar.createCheckout({
  productId: "prod_xxx",
  successUrl: "https://yourapp.com/success"
})

// Get customer state
api.polar.getCustomerState({ externalId: userId })
```

#### Queries (Database)
```typescript
// Get user's orders
api.polar.getUserOrders({ customerId: userId })

// Get user's subscriptions
api.polar.getUserSubscriptions({ customerId: userId })
```

### Database Tables
- `checkoutSessions` - Checkout session tracking
- `orders` - Order history
- `subscriptions` - Subscription data

## Common Use Cases

### 1. Display Products
```tsx
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';

function Products() {
  const listProducts = useAction(api.polar.listProducts);
  
  const loadProducts = async () => {
    const result = await listProducts({});
    console.log(result.products);
  };
}
```

### 2. Create Checkout
```tsx
const createCheckout = useAction(api.polar.createCheckout);

const handlePurchase = async (productId: string) => {
  const result = await createCheckout({
    productId,
    successUrl: `${window.location.origin}/success`,
  });
  
  if (result.success) {
    window.location.href = result.checkoutUrl;
  }
};
```

### 3. Check User's Subscriptions
```tsx
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

function Dashboard() {
  const subscriptions = useQuery(
    api.polar.getUserSubscriptions,
    { customerId: userId }
  );
  
  return (
    <div>
      {subscriptions?.map(sub => (
        <div key={sub._id}>
          Status: {sub.status}
        </div>
      ))}
    </div>
  );
}
```

## Testing Checklist

- [ ] Products load on `/products` page
- [ ] Clicking "Purchase" redirects to Polar checkout
- [ ] After payment, redirects to `/success`
- [ ] Orders appear in `/dashboard`
- [ ] Webhooks are received (check `npx convex logs`)

## Going to Production

When ready for real payments:

```bash
# 1. Switch to production
npx convex env set POLAR_SERVER production

# 2. Create products in production Polar.sh dashboard

# 3. Update webhook URL to production Convex deployment

# 4. Test with real payment method
```

## Troubleshooting

### "Products not loading"
- Check `POLAR_ACCESS_TOKEN` is set: `npx convex env get POLAR_ACCESS_TOKEN`
- Verify you have products in Polar.sh dashboard
- Check logs: `npx convex logs`

### "Checkout fails"
- Ensure product ID is correct
- Check `successUrl` is a valid URL
- Verify Polar.sh API credentials

### "Webhooks not working"
- Confirm webhook URL is correct
- Check webhook events are selected in Polar.sh
- Test webhook in Polar.sh dashboard
- Check Convex logs: `npx convex logs`

## Next Steps

1. **Customize UI** - Edit components in `src/components/`
2. **Add Benefits** - Configure benefits in Polar.sh dashboard
3. **License Keys** - Use Polar.sh license key benefits
4. **Usage Billing** - Set up metered billing
5. **Customer Portal** - Build custom customer management

## Resources

- 📚 [Full Setup Guide](./POLAR_SETUP.md)
- 🌐 [Polar.sh Docs](https://polar.sh/docs)
- 🔧 [Polar.sh API Reference](https://polar.sh/docs/api-reference)
- 💬 [Convex Docs](https://docs.convex.dev)

## Need Help?

- Polar.sh: support@polar.sh
- Convex: https://discord.gg/convex
- This integration: Open an issue on GitHub

---

**Happy monetizing! 🚀**

