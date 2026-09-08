import { Router } from "express";
import { chatCompletion, embedText } from "../clients/openai.js";
import { legacyOpenAiCompletion } from "../clients/legacy-for-e2e.js";

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res) => {
  try {
    const prompt = String(req.body.prompt ?? "Say hello from the Versionly E2E consumer.");
    const result = await chatCompletion({
      prompt,
      system: "You are a concise assistant used in a Versionly end-to-end test app.",
      model: req.body.model,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "chat_failed" });
  }
});

/** E2E: legacy Completions API (text-davinci-003) for Versionly detect/fix */
aiRouter.post("/legacy-complete", async (req, res) => {
  try {
    const prompt = String(req.body.prompt ?? "ping");
    if (process.env.DRY_RUN !== "false") {
      res.json({ dryRun: true, note: "openai.completions.create call site for Versionly", prompt });
      return;
    }
    const result = await legacyOpenAiCompletion(prompt);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "legacy_complete_failed" });
  }
});

aiRouter.post("/embed", async (req, res) => {
  try {
    const text = String(req.body.text ?? "versionly self-maintaining apis");
    const result = await embedText(text);
    res.json({
      ...result,
      vectorPreview: Array.isArray(result.vector) ? result.vector.slice(0, 8) : [],
      vector: undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "embed_failed" });
  }
});
