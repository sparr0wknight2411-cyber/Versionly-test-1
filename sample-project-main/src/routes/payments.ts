import { Router } from "express";
import { createPaymentIntent, ensureCustomer, refundPayment } from "../clients/stripe.js";
import { legacyStripeCharge } from "../clients/legacy-for-e2e.js";

export const paymentsRouter = Router();

paymentsRouter.post("/checkout", async (req, res) => {
  try {
    const amountCents = Number(req.body.amountCents ?? 1999);
    const email = String(req.body.email ?? "buyer@example.com");
    const customer = await ensureCustomer(email, req.body.name);
    const intent = await createPaymentIntent({
      amountCents,
      customerEmail: email,
      metadata: {
        source: "versionly-e2e-consumer",
        customerId: String((customer as { id?: string }).id ?? ""),
      },
    });
    res.json({ customer, intent });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "checkout_failed" });
  }
});

/** E2E: legacy Charges API — Versionly should flag / offer fix toward PaymentIntents */
paymentsRouter.post("/legacy-charge", async (req, res) => {
  try {
    if (process.env.DRY_RUN !== "false") {
      res.json({
        dryRun: true,
        note: "legacy stripe.charges.create call site present for Versionly scan",
        amountCents: Number(req.body.amountCents ?? 500),
      });
      return;
    }
    const charge = await legacyStripeCharge(
      Number(req.body.amountCents ?? 500),
      String(req.body.source ?? "tok_visa"),
    );
    res.json({ charge });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "legacy_charge_failed" });
  }
});

paymentsRouter.post("/refund", async (req, res) => {
  try {
    const paymentIntentId = String(req.body.paymentIntentId ?? "");
    if (!paymentIntentId) {
      res.status(400).json({ error: "paymentIntentId_required" });
      return;
    }
    const refund = await refundPayment(
      paymentIntentId,
      req.body.amountCents ? Number(req.body.amountCents) : undefined,
    );
    res.json({ refund });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "refund_failed" });
  }
});
