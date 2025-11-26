import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

const http = httpRouter();

/**
 * Polar.sh Webhook Handler
 * 
 * Configure this endpoint in your Polar.sh dashboard:
 * URL: https://your-convex-deployment.convex.site/polarWebhook
 * 
 * Supported events:
 * - order.created, order.paid, order.updated
 * - subscription.created, subscription.active, subscription.canceled, subscription.updated
 * - checkout.created, checkout.updated
 * - customer.created, customer.updated
 */
http.route({
  path: '/polarWebhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const payload = await request.json();
      // Polar uses 'type' field for event type
      const eventType = payload.type || payload.event;
      const data = payload.data;

      console.log('Received Polar webhook:', eventType, 'Data:', JSON.stringify(data).substring(0, 200));

      // Handle different event types
      switch (eventType) {
        case 'order.created':
        case 'order.paid':
        case 'order.updated':
        case 'order.refunded':
          await handleOrderEvent(ctx, eventType, data);
          break;

        case 'subscription.created':
        case 'subscription.active':
        case 'subscription.canceled':
        case 'subscription.updated':
          await handleSubscriptionEvent(ctx, eventType, data);
          break;

        case 'checkout.created':
        case 'checkout.updated':
          await handleCheckoutEvent(ctx, eventType, data);
          break;

        case 'customer.created':
        case 'customer.updated':
        case 'customer.deleted':
        case 'customer.state_changed':
          await handleCustomerEvent(ctx, eventType, data);
          break;

        case 'refund.created':
          console.log('Refund created:', data.id);
          break;

        default:
          console.log('Unhandled webhook event:', eventType);
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
  
  const existingOrder = await ctx.runQuery(api.polar.getOrderByPolarId, {
    orderId: data.id,
  });
  
  if (existingOrder) {
    await ctx.runMutation(api.polar.updateOrder, {
      orderId: data.id,
      status: data.status || 'paid',
    });
  } else {
    await ctx.runMutation(api.polar.createOrder, {
      orderId: data.id,
      customerId: data.customer_id,
      productId: data.product_id,
      amount: data.amount || 0,
      currency: data.currency || 'USD',
      status: data.status || 'paid',
    });
  }
  
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
  
  const existingSubscription = await ctx.runQuery(
    api.polar.getSubscriptionByPolarId,
    {
      subscriptionId: data.id,
    }
  );
  
  if (existingSubscription) {
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

