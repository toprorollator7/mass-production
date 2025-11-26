# Polar.sh Integration Setup Guide

This guide will help you set up Polar.sh monetization in your Mass Production app.

## What is Polar.sh?

Polar.sh is a modern monetization platform that provides:
- Product and subscription management
- Checkout sessions
- Customer management
- Benefits and license keys
- Webhooks for real-time events
- Usage-based billing

## Prerequisites

1. A Polar.sh account (sign up at https://polar.sh)
2. Your Convex deployment set up
3. WorkOS AuthKit configured

## Step 1: Get Your Polar.sh Access Token

1. Go to https://polar.sh/settings
2. Navigate to the "API" or "Access Tokens" section
3. Create a new Organization Access Token (OAT)
4. Copy the token (it starts with `polar_oat_`)

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Polar.sh credentials to `.env`:
   ```env
   POLAR_ACCESS_TOKEN=polar_oat_your_actual_token_here
   POLAR_SERVER=sandbox  # Use 'production' for live payments
   ```

3. Push environment variables to Convex:
   ```bash
   npx convex env set POLAR_ACCESS_TOKEN polar_oat_your_actual_token_here
   npx convex env set POLAR_SERVER sandbox
   ```

## Step 3: Create Products in Polar.sh

1. Log in to your Polar.sh dashboard
2. Navigate to "Products"
3. Click "Create Product"
4. Fill in the product details:
   - Name
   - Description
   - Price (one-time or recurring)
   - Benefits (optional)
5. Save the product

## Step 4: Set Up Webhooks

Webhooks allow Polar.sh to notify your app about events like successful payments, subscription changes, etc.

1. In your Polar.sh dashboard, go to "Settings" → "Webhooks"
2. Click "Create Webhook Endpoint"
3. Enter your webhook URL:
   ```
   https://your-convex-deployment.convex.site/polarWebhook
   ```
   
   To find your Convex deployment URL:
   ```bash
   npx convex dashboard
   ```
   Then look for the deployment URL in the dashboard.

4. Select the events you want to receive:
   - `order.created`
   - `order.paid`
   - `order.updated`
   - `subscription.created`
   - `subscription.active`
   - `subscription.canceled`
   - `subscription.updated`
   - `checkout.created`
   - `checkout.updated`

5. Save the webhook endpoint

## Step 5: Test the Integration

### Testing in Sandbox Mode

1. Make sure `POLAR_SERVER=sandbox` in your environment variables
2. Start your development server:
   ```bash
   npm run dev
   ```

3. Navigate to the "Products" page in your app
4. You should see your Polar.sh products listed
5. Click "Purchase" on a product to test the checkout flow

### Testing Webhooks

1. Use Polar.sh's webhook testing feature in the dashboard
2. Send test events to your webhook endpoint
3. Check your Convex logs to see if events are being received:
   ```bash
   npx convex logs
   ```

## Step 6: Go Live

When you're ready to accept real payments:

1. Update your environment variables:
   ```bash
   npx convex env set POLAR_SERVER production
   ```

2. Update your webhook URL to use your production Convex deployment

3. Create products in production mode on Polar.sh

4. Test the entire flow with a real payment method

## Features Implemented

### 1. Product Listing
- View all available products from Polar.sh
- Display product images, descriptions, and prices
- Support for one-time and recurring payments

### 2. Checkout Flow
- Create checkout sessions
- Redirect to Polar.sh hosted checkout
- Handle successful payment redirects

### 3. Customer Dashboard
- View active subscriptions
- View order history
- Display active benefits

### 4. Webhook Handling
- Automatic order creation/updates
- Subscription status tracking
- Customer data synchronization

## API Reference

### Convex Actions

#### `api.polar.listProducts`
List all products from Polar.sh
```typescript
const result = await listProducts({
  organizationId?: string,
  limit?: number
});
```

#### `api.polar.createCheckout`
Create a checkout session
```typescript
const result = await createCheckout({
  productId: string,
  successUrl: string,
  customerEmail?: string,
  externalCustomerId?: string
});
```

#### `api.polar.getCustomerState`
Get customer's subscriptions and benefits
```typescript
const result = await getCustomerState({
  customerId?: string,
  externalId?: string
});
```

### Convex Queries

#### `api.polar.getUserOrders`
Get user's order history
```typescript
const orders = useQuery(api.polar.getUserOrders, {
  customerId: string,
  limit?: number
});
```

#### `api.polar.getUserSubscriptions`
Get user's subscriptions
```typescript
const subscriptions = useQuery(api.polar.getUserSubscriptions, {
  customerId: string,
  limit?: number
});
```

## Database Schema

The integration creates the following tables in Convex:

### `checkoutSessions`
- `checkoutId`: Polar checkout ID
- `productId`: Product being purchased
- `customerEmail`: Customer email
- `status`: Checkout status
- `createdAt`: Timestamp

### `orders`
- `orderId`: Polar order ID
- `customerId`: Customer ID
- `productId`: Product ID
- `amount`: Order amount in cents
- `currency`: Currency code
- `status`: Order status
- `createdAt`: Timestamp

### `subscriptions`
- `subscriptionId`: Polar subscription ID
- `customerId`: Customer ID
- `productId`: Product ID
- `status`: Subscription status
- `currentPeriodStart`: Period start timestamp
- `currentPeriodEnd`: Period end timestamp
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

## Troubleshooting

### Products not loading
- Check that `POLAR_ACCESS_TOKEN` is set correctly
- Verify you have products created in Polar.sh
- Check Convex logs for errors: `npx convex logs`

### Webhooks not working
- Verify webhook URL is correct
- Check that webhook events are selected in Polar.sh
- Test webhook delivery in Polar.sh dashboard
- Check Convex logs for webhook errors

### Checkout redirect fails
- Ensure `successUrl` is a valid URL
- Check that the product ID is correct
- Verify Polar.sh API credentials

## Additional Resources

- [Polar.sh Documentation](https://polar.sh/docs)
- [Polar.sh API Reference](https://polar.sh/docs/api-reference)
- [Convex Documentation](https://docs.convex.dev)
- [WorkOS AuthKit Documentation](https://workos.com/docs/authkit)

## Support

For issues specific to:
- Polar.sh: Contact support@polar.sh
- Convex: Visit https://docs.convex.dev
- This integration: Open an issue in the repository

