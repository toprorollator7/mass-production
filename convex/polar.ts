import { v } from 'convex/values';
import { action, internalAction, query, mutation } from './_generated/server';
import { Polar } from '@polar-sh/sdk';
import { api } from './_generated/api';

// Initialize Polar client
function getPolarClient() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('POLAR_ACCESS_TOKEN environment variable is not set');
  }

  const server = process.env.POLAR_SERVER as 'production' | 'sandbox' | undefined;

  return new Polar({
    accessToken,
    server: server || 'production', // 'production' or 'sandbox'
  });
}

// ============================================================================
// PRODUCTS
// ============================================================================

/**
 * List all products from Polar
 */
export const listProducts = action({
  args: {
    organizationId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const polar = getPolarClient();

    try {
      const response = await polar.products.list({
        organizationId: args.organizationId,
        limit: args.limit || 10,
      });

      // Convert to JSON and back to remove Date objects and make it Convex-compatible
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      return {
        success: true,
        products: parsed.result?.items || [],
        pagination: parsed.result?.pagination,
      };
    } catch (error: any) {
      console.error('Error listing products:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Get a single product by ID
 */
export const getProduct = action({
  args: {
    productId: v.string(),
  },
  handler: async (_ctx, args) => {
    const polar = getPolarClient();

    try {
      const response = await polar.products.get({
        id: args.productId,
      });

      // Convert to JSON to make Convex-compatible
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      return {
        success: true,
        product: parsed,
      };
    } catch (error: any) {
      console.error('Error getting product:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// ============================================================================
// CHECKOUT
// ============================================================================

/**
 * Create a checkout session
 */
export const createCheckout = action({
  args: {
    productPriceId: v.string(),
    successUrl: v.string(),
    customerEmail: v.optional(v.string()),
    externalCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const polar = getPolarClient();

    try {
      const response = await polar.checkouts.create({
        products: [args.productPriceId],
        successUrl: args.successUrl,
        customerEmail: args.customerEmail,
        externalCustomerId: args.externalCustomerId,
      });

      // Convert to JSON to make Convex-compatible
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      // Store checkout session in database
      await ctx.runMutation(api.polar.saveCheckoutSession, {
        checkoutId: parsed.id,
        productId: args.productPriceId,
        customerEmail: args.customerEmail,
        status: parsed.status,
      });

      return {
        success: true,
        checkout: parsed,
        checkoutUrl: parsed.url,
      };
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Get checkout session by ID
 */
export const getCheckout = action({
  args: {
    checkoutId: v.string(),
  },
  handler: async (_ctx, args) => {
    const polar = getPolarClient();

    try {
      const response = await polar.checkouts.get({
        id: args.checkoutId,
      });

      // Convert to JSON to make Convex-compatible
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      return {
        success: true,
        checkout: parsed,
      };
    } catch (error: any) {
      console.error('Error getting checkout:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// ============================================================================
// CUSTOMERS
// ============================================================================

/**
 * Get customer by external ID
 */
export const getCustomerByExternalId = action({
  args: {
    externalId: v.string(),
  },
  handler: async (_ctx, args) => {
    const polar = getPolarClient();

    try {
      const response = await polar.customers.getExternal({
        externalId: args.externalId,
      });

      // Convert to JSON to make Convex-compatible
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      return {
        success: true,
        customer: parsed,
      };
    } catch (error: any) {
      console.error('Error getting customer:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Create an authenticated customer portal session
 * Returns a pre-authenticated URL to the customer portal
 */
export const createCustomerPortalSession = action({
  args: {
    customerId: v.string(),
  },
  handler: async (_ctx, args) => {
    const polar = getPolarClient();

    try {
      // Create customer portal session with Polar API
      const session = await polar.customerSessions.create({
        customerId: args.customerId,
      });

      // Convert to JSON to make it Convex-compatible
      const jsonString = JSON.stringify(session);
      const parsed = JSON.parse(jsonString);

      return {
        success: true,
        customerPortalUrl: parsed.customerPortalUrl,
        token: parsed.token,
        expiresAt: parsed.expiresAt,
      };
    } catch (error: any) {
      console.error('Error creating customer portal session:', error);
      return {
        success: false,
        error: error.message || 'Failed to create customer portal session',
      };
    }
  },
});

/**
 * Get customer state (subscriptions and benefits)
 */
export const getCustomerState = action({
  args: {
    customerId: v.optional(v.string()),
    externalId: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const polar = getPolarClient();

    try {
      let response;
      if (args.customerId) {
        response = await polar.customers.getState({
          id: args.customerId,
        });
      } else if (args.externalId) {
        response = await polar.customers.getStateExternal({
          externalId: args.externalId,
        });
      } else {
        throw new Error('Either customerId or externalId must be provided');
      }

      // Convert to JSON to make Convex-compatible
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      return {
        success: true,
        state: parsed,
      };
    } catch (error: any) {
      console.error('Error getting customer state:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * List subscriptions
 */
export const listSubscriptions = action({
  args: {
    organizationId: v.optional(v.string()),
    customerId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const polar = getPolarClient();

    try {
      const response = await polar.subscriptions.list({
        organizationId: args.organizationId,
        customerId: args.customerId,
        limit: args.limit || 10,
      });

      // Convert to JSON to make Convex-compatible
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      return {
        success: true,
        subscriptions: parsed.result?.items || [],
        pagination: parsed.result?.pagination,
      };
    } catch (error: any) {
      console.error('Error listing subscriptions:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Cancel subscription at period end
 */
export const cancelSubscriptionAtPeriodEnd = action({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const polar = getPolarClient();

    try {
      // Update subscription to cancel at period end
      const response = await polar.subscriptions.update({
        id: args.subscriptionId,
        subscriptionUpdate: {
          cancelAtPeriodEnd: true,
        },
      });

      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      // Update local database
      await ctx.runMutation(api.polar.updateSubscriptionCancellation, {
        subscriptionId: args.subscriptionId,
        cancelAtPeriodEnd: true,
      });

      return {
        success: true,
        subscription: parsed,
      };
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

/**
 * Reactivate subscription (undo cancel at period end)
 */
export const reactivateSubscription = action({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const polar = getPolarClient();

    try {
      // Update subscription to NOT cancel at period end
      const response = await polar.subscriptions.update({
        id: args.subscriptionId,
        subscriptionUpdate: {
          cancelAtPeriodEnd: false,
        },
      });

      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);

      // Update local database
      await ctx.runMutation(api.polar.updateSubscriptionCancellation, {
        subscriptionId: args.subscriptionId,
        cancelAtPeriodEnd: false,
      });

      return {
        success: true,
        subscription: parsed,
      };
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

// ============================================================================
// DATABASE MUTATIONS & QUERIES
// ============================================================================

/**
 * Save checkout session to database
 */
export const saveCheckoutSession = mutation({
  args: {
    checkoutId: v.string(),
    productId: v.string(),
    customerEmail: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('checkoutSessions', {
      checkoutId: args.checkoutId,
      productId: args.productId,
      customerEmail: args.customerEmail,
      status: args.status,
      createdAt: Date.now(),
    });
    
    return id;
  },
});

/**
 * Update checkout session status
 */
export const updateCheckoutStatus = mutation({
  args: {
    checkoutId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('checkoutSessions')
      .filter((q) => q.eq(q.field('checkoutId'), args.checkoutId))
      .first();
    
    if (session) {
      await ctx.db.patch(session._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Get checkout sessions
 */
export const getCheckoutSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('checkoutSessions')
      .order('desc')
      .take(args.limit || 10);

    return sessions;
  },
});

// ============================================================================
// WEBHOOK HELPERS
// ============================================================================

/**
 * Create order from webhook
 */
export const createOrder = mutation({
  args: {
    orderId: v.string(),
    customerId: v.string(),
    productId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('orders', {
      orderId: args.orderId,
      customerId: args.customerId,
      productId: args.productId,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      createdAt: Date.now(),
    });

    return id;
  },
});

/**
 * Update order from webhook
 */
export const updateOrder = mutation({
  args: {
    orderId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query('orders')
      .withIndex('by_orderId', (q) => q.eq('orderId', args.orderId))
      .first();

    if (order) {
      await ctx.db.patch(order._id, {
        status: args.status,
      });
    }
  },
});

/**
 * Get order by Polar ID
 */
export const getOrderByPolarId = query({
  args: {
    orderId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orders')
      .withIndex('by_orderId', (q) => q.eq('orderId', args.orderId))
      .first();
  },
});

/**
 * Create subscription from webhook
 */
export const createSubscription = mutation({
  args: {
    subscriptionId: v.string(),
    customerId: v.string(),
    productId: v.string(),
    status: v.string(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('subscriptions', {
      subscriptionId: args.subscriptionId,
      customerId: args.customerId,
      productId: args.productId,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      createdAt: Date.now(),
    });

    return id;
  },
});

/**
 * Update subscription from webhook
 */
export const updateSubscription = mutation({
  args: {
    subscriptionId: v.string(),
    status: v.string(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriptionId', (q) => q.eq('subscriptionId', args.subscriptionId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Update subscription cancellation status
 */
export const updateSubscriptionCancellation = mutation({
  args: {
    subscriptionId: v.string(),
    cancelAtPeriodEnd: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriptionId', (q) => q.eq('subscriptionId', args.subscriptionId))
      .first();

    if (subscription) {
      await ctx.db.patch(subscription._id, {
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Get subscription by Polar ID
 */
export const getSubscriptionByPolarId = query({
  args: {
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('subscriptions')
      .withIndex('by_subscriptionId', (q) => q.eq('subscriptionId', args.subscriptionId))
      .first();
  },
});

/**
 * Get user's orders
 */
export const getUserOrders = query({
  args: {
    customerId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orders')
      .withIndex('by_customerId', (q) => q.eq('customerId', args.customerId))
      .order('desc')
      .take(args.limit || 10);
  },
});

/**
 * Get user's subscriptions
 */
export const getUserSubscriptions = query({
  args: {
    customerId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('subscriptions')
      .withIndex('by_customerId', (q) => q.eq('customerId', args.customerId))
      .order('desc')
      .take(args.limit || 10);
  },
});

/**
 * Get all orders (for dashboard - temporary solution)
 */
export const getAllOrders = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orders')
      .order('desc')
      .take(args.limit || 10);
  },
});

/**
 * Get all subscriptions (for dashboard - temporary solution)
 */
export const getAllSubscriptions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('subscriptions')
      .order('desc')
      .take(args.limit || 10);
  },
});

