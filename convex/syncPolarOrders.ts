/**
 * Manual sync script to fetch orders from Polar and save to database
 * Run this once to sync existing orders that were created before webhooks were configured
 */

import { action } from './_generated/server';
import { api } from './_generated/api';
import { Polar } from '@polar-sh/sdk';

function getPolarClient() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('POLAR_ACCESS_TOKEN environment variable is not set');
  }

  const server = process.env.POLAR_SERVER as 'production' | 'sandbox' | undefined;
  return new Polar({
    accessToken,
    server: server || 'production',
  });
}

export const syncAllOrders = action({
  args: {},
  handler: async (ctx) => {
    const polar = getPolarClient();
    
    try {
      // Fetch all orders from Polar
      const response = await polar.orders.list({
        limit: 100,
      });
      
      const jsonString = JSON.stringify(response);
      const parsed = JSON.parse(jsonString);
      const orders = parsed.result?.items || [];
      
      console.log(`Found ${orders.length} orders to sync`);
      
      let synced = 0;
      let skipped = 0;
      
      for (const order of orders) {
        // Debug: log the order structure
        console.log('Order structure:', JSON.stringify(order, null, 2));

        // Check if order already exists
        const existing = await ctx.runQuery(api.polar.getOrderByPolarId, {
          orderId: order.id,
        });

        if (existing) {
          console.log(`Order ${order.id} already exists, skipping`);
          skipped++;
          continue;
        }

        // Create the order
        // Note: Polar orders might have different field names
        const amount = order.totalAmount || order.amount || order.total || 0;

        await ctx.runMutation(api.polar.createOrder, {
          orderId: order.id,
          customerId: order.customerId,
          productId: order.productId,
          amount: amount,
          currency: order.currency,
          status: order.status || 'paid',
        });

        console.log(`Synced order ${order.id} - Amount: ${amount}`);
        synced++;
      }
      
      return {
        success: true,
        total: orders.length,
        synced,
        skipped,
      };
    } catch (error: any) {
      console.error('Error syncing orders:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
});

