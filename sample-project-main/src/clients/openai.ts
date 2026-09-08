/**
 * OpenAI consumer — importHints: ["openai"].
 * Modern Chat Completions. Intentional legacy Completions live in legacy-for-e2e.ts.
 */
import OpenAI from "openai";
import { config } from "../config.js";

export const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface ChatInput {
  prompt: string;
  model?: string;
  system?: string;
}

export async function chatCompletion(input: ChatInput) {
  if (
    config.dryRun ||
    config.openai.apiKey.includes("replace_me") ||
    config.openai.apiKey.includes("placeholder")
  ) {
    return {
      dryRun: true,
      model: input.model ?? "gpt-4o-mini",
      content: `[dry-run] Echo: ${input.prompt.slice(0, 120)}`,
    };
  }

  const completion = await openai.chat.completions.create({
    model: input.model ?? "gpt-4o-mini",
    messages: [
      ...(input.system ? [{ role: "system" as const, content: input.system }] : []),
      { role: "user" as const, content: input.prompt },
    ],
    temperature: 0.2,
  });

  return {
    dryRun: false,
    model: completion.model,
    content: completion.choices[0]?.message?.content ?? "",
    usage: completion.usage,
  };
}

export async function embedText(text: string) {
  if (config.dryRun || config.openai.apiKey.includes("replace_me")) {
    return { dryRun: true, model: "text-embedding-3-small", dimensions: 8, vector: [0, 0, 0, 0, 0, 0, 0, 0] };
  }

  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return {
    dryRun: false,
    model: res.model,
    dimensions: res.data[0]?.embedding.length ?? 0,
    vector: res.data[0]?.embedding ?? [],
  };
}
