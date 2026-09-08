import express from "express";
import { config } from "./config.js";
import { paymentsRouter } from "./routes/payments.js";
import { aiRouter } from "./routes/ai.js";
import { smsRouter } from "./routes/sms.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    app: "versionly-e2e-consumer",
    dryRun: config.dryRun,
    vendors: ["stripe", "openai", "twilio"],
  });
});

app.use("/payments", paymentsRouter);
app.use("/ai", aiRouter);
app.use("/sms", smsRouter);

app.listen(config.port, () => {
  console.log(`[e2e-consumer] listening on :${config.port} (dryRun=${config.dryRun})`);
  console.log(`  GET  /health`);
  console.log(`  POST /payments/checkout`);
  console.log(`  POST /ai/chat`);
  console.log(`  POST /sms/send`);
});
