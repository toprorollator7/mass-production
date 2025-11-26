import { httpRouter } from 'convex/server';
import { httpAction, query, mutation } from './_generated/server';
import { api } from './_generated/api';
import { v } from 'convex/values';

const http = httpRouter();

/**
 * Polar.sh Webhook Handler
 * 
 * Configure this endpoint in your Polar.sh dashboard:
 * URL: https://your-convex-deployment.convex.site/polarWebhook
 * 
 * Supported events:
 * - order.created
 * - order.paid
 * - order.updated
 * - subscription.created
 * - subscription.active
 * - subscription.canceled
 * - subscription.updated
 * - checkout.created
 * - checkout.updated
 * - customer.created
 * - customer.updated
 */
http.route({
  path: '/polarWebhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      const event = payload.event;
      const data = payload.data;
      
      console.log('Received Polar webhook:', event);
      
      // Verify webhook signature (optional but recommended)
      // const signature = request.headers.get('polar-signature');
      // if (!verifyWebhookSignature(signature, payload)) {
      //   return new Response('Invalid signature', { status: 401 });
      // }
      
      // Handle different event types
      switch (event) {
        case 'order.created':
        case 'order.paid':
        case 'order.updated':
          await handleOrderEvent(ctx, event, data);
          break;
          
        case 'subscription.created':
        case 'subscription.active':
        case 'subscription.canceled':
        case 'subscription.updated':
          await handleSubscriptionEvent(ctx, event, data);
          break;
          
        case 'checkout.created':
        case 'checkout.updated':
          await handleCheckoutEvent(ctx, event, data);
          break;
          
        case 'customer.created':
        case 'customer.updated':
          await handleCustomerEvent(ctx, event, data);
          break;
          
        default:
          console.log('Unhandled webhook event:', event);
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }),
});

/**
 * Handle order events
 */
async function handleOrderEvent(ctx: any, event: string, data: any) {
  console.log('Processing order event:', event, data);
  
  // Check if order already exists
  const existingOrder = await ctx.runQuery(api.polar.getOrderByPolarId, {
    orderId: data.id,
  });

  if (existingOrder) {
    // Update existing order
    await ctx.runMutation(api.polar.updateOrder, {
      orderId: data.id,
      status: data.status || 'paid',
    });
  } else {
    // Create new order
    await ctx.runMutation(api.polar.createOrder, {
      orderId: data.id,
      customerId: data.customer_id,
      productId: data.product_id,
      amount: data.amount || 0,
      currency: data.currency || 'USD',
      status: data.status || 'paid',
    });
  }
  
  // Update checkout session if exists
  if (data.checkout_id) {
    await ctx.runMutation(api.polar.updateCheckoutStatus, {
      checkoutId: data.checkout_id,
      status: 'completed',
    });
  }
}

/**
 * Handle subscription events
 */
async function handleSubscriptionEvent(ctx: any, event: string, data: any) {
  console.log('Processing subscription event:', event, data);
  
  // Check if subscription already exists
  const existingSubscription = await ctx.runQuery(
    api.polar.getSubscriptionByPolarId,
    {
      subscriptionId: data.id,
    }
  );

  if (existingSubscription) {
    // Update existing subscription
    await ctx.runMutation(api.polar.updateSubscription, {
      subscriptionId: data.id,
      status: data.status,
      currentPeriodStart: data.current_period_start
        ? new Date(data.current_period_start).getTime()
        : undefined,
      currentPeriodEnd: data.current_period_end
        ? new Date(data.current_period_end).getTime()
        : undefined,
    });
  } else {
    // Create new subscription
    await ctx.runMutation(api.polar.createSubscription, {
      subscriptionId: data.id,
      customerId: data.customer_id,
      productId: data.product_id,
      status: data.status,
      currentPeriodStart: data.current_period_start
        ? new Date(data.current_period_start).getTime()
        : undefined,
      currentPeriodEnd: data.current_period_end
        ? new Date(data.current_period_end).getTime()
        : undefined,
    });
  }
}

/**
 * Handle checkout events
 */
async function handleCheckoutEvent(ctx: any, event: string, data: any) {
  console.log('Processing checkout event:', event, data);
  
  await ctx.runMutation(api.polar.updateCheckoutStatus, {
    checkoutId: data.id,
    status: data.status,
  });
}

/**
 * Handle customer events
 */
async function handleCustomerEvent(ctx: any, event: string, data: any) {
  console.log('Processing customer event:', event, data);
  // Add custom logic for customer events if needed
}

export default http;

