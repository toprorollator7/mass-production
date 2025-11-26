import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),

  // Polar.sh checkout sessions
  checkoutSessions: defineTable({
    checkoutId: v.string(),
    productId: v.string(),
    customerEmail: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_checkoutId', ['checkoutId']),

  // Polar.sh orders (from webhooks)
  orders: defineTable({
    orderId: v.string(),
    customerId: v.string(),
    productId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }).index('by_orderId', ['orderId'])
    .index('by_customerId', ['customerId']),

  // Polar.sh subscriptions (from webhooks)
  subscriptions: defineTable({
    subscriptionId: v.string(),
    customerId: v.string(),
    productId: v.string(),
    status: v.string(),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_subscriptionId', ['subscriptionId'])
    .index('by_customerId', ['customerId']),
});
