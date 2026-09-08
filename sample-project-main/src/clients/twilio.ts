/**
 * Twilio consumer — importHints: ["twilio"].
 * Modern messages.create. Intentional legacy sendMessage lives in legacy-for-e2e.ts.
 */
import twilio from "twilio";
import { config } from "../config.js";

export const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

export interface SmsInput {
  to: string;
  body: string;
  from?: string;
}

export async function sendSms(input: SmsInput) {
  if (config.dryRun || !config.twilio.enabled) {
    return {
      dryRun: true,
      sid: "SM_dry_run",
      to: input.to,
      from: input.from ?? config.twilio.fromNumber,
      body: input.body,
      status: "queued",
    };
  }

  return twilioClient.messages.create({
    to: input.to,
    from: input.from ?? config.twilio.fromNumber,
    body: input.body,
  });
}

export async function listRecentMessages(limit = 5) {
  if (config.dryRun || config.twilio.accountSid.includes("replace_me")) {
    return { dryRun: true, messages: [] as Array<{ sid: string; to: string; body: string }> };
  }

  const messages = await twilioClient.messages.list({ limit });
  return {
    dryRun: false,
    messages: messages.map((m) => ({
      sid: m.sid,
      to: m.to,
      from: m.from,
      body: m.body,
      status: m.status,
    })),
  };
}
