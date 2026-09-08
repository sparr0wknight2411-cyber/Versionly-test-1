/**
 * Stripe consumer — importHints: ["stripe"].
 * Modern PaymentIntents path. Intentional legacy Charges live in legacy-for-e2e.ts.
 */
import Stripe from "stripe";
import { config } from "../config.js";

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2025-02-24.acacia",
});

export interface CreateCheckoutInput {
  amountCents: number;
  currency?: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}

/** Preferred modern path: PaymentIntent */
export async function createPaymentIntent(input: CreateCheckoutInput) {
  if (
    config.dryRun ||
    config.stripe.secretKey.includes("placeholder") ||
    config.stripe.secretKey.includes("replace_me")
  ) {
    return {
      dryRun: true,
      id: "pi_dry_run",
      client_secret: "pi_dry_run_secret",
      amount: input.amountCents,
      currency: input.currency ?? "usd",
      status: "requires_payment_method",
    };
  }

  return stripe.paymentIntents.create({
    amount: input.amountCents,
    currency: input.currency ?? "usd",
    receipt_email: input.customerEmail,
    automatic_payment_methods: { enabled: true },
    metadata: input.metadata ?? {},
  });
}

export async function ensureCustomer(email: string, name?: string) {
  if (config.dryRun || config.stripe.secretKey.includes("replace_me")) {
    return { dryRun: true, id: "cus_dry_run", email, name };
  }

  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data[0]) return existing.data[0];

  return stripe.customers.create({ email, name });
}

export async function refundPayment(paymentIntentId: string, amountCents?: number) {
  if (config.dryRun || config.stripe.secretKey.includes("replace_me")) {
    return { dryRun: true, id: "re_dry_run", payment_intent: paymentIntentId, amount: amountCents };
  }

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents,
  });
}

export async function constructWebhookEvent(rawBody: Buffer | string, signature: string) {
  if (!config.stripe.webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not set");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}
