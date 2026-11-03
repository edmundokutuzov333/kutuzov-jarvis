import { describe, expect, it } from "vitest";
import { extractGeminiText } from "../../api/assistant";

describe("Gemini Interactions API output extraction", () => {
  it("extracts model output when the step has no status field", () => {
    expect(extractGeminiText({
      status: "completed",
      steps: [{ type: "model_output", content: [{ type: "text", text: '{"status":"answered"}' }] }],
    })).toBe('{"status":"answered"}');
  });

  it("uses the final model output and ignores non-text parts", () => {
    expect(extractGeminiText({
      status: "completed",
      steps: [
        { type: "model_output", content: [{ type: "text", text: "first" }] },
        { type: "function_call", content: [{ type: "text", text: "ignore" }] },
        { type: "model_output", content: [{ type: "image" }, { type: "text", text: " final " }] },
      ],
    })).toBe("final");
  });

  it("returns null when no model output exists", () => {
    expect(extractGeminiText({ status: "completed", steps: [{ type: "thought" }] })).toBeNull();
  });
});
