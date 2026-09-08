import { Router } from "express";
import { listRecentMessages, sendSms } from "../clients/twilio.js";
import { legacyTwilioSms } from "../clients/legacy-for-e2e.js";

export const smsRouter = Router();

smsRouter.post("/send", async (req, res) => {
  try {
    const to = String(req.body.to ?? "");
    const body = String(req.body.body ?? "Hello from Versionly E2E consumer");
    if (!to) {
      res.status(400).json({ error: "to_required" });
      return;
    }
    const message = await sendSms({ to, body });
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "sms_failed" });
  }
});

/** E2E: Twilio with statusCallback — extra surface for Versionly */
smsRouter.post("/legacy-send", async (req, res) => {
  try {
    const to = String(req.body.to ?? "+15555550123");
    const body = String(req.body.body ?? "legacy e2e");
    if (process.env.DRY_RUN !== "false") {
      res.json({ dryRun: true, note: "twilio messages.create + statusCallback for Versionly", to, body });
      return;
    }
    const message = await legacyTwilioSms(to, body);
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "legacy_sms_failed" });
  }
});

smsRouter.get("/recent", async (_req, res) => {
  try {
    const result = await listRecentMessages(5);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "list_failed" });
  }
});
