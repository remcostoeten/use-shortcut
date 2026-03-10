import { describe, expect, it } from "vitest";
import useShortcutConfig from "@/config/packages/use-shortcut";
import {
  buildDocsAnswer,
  buildDocsKnowledge,
  searchDocsKnowledge,
} from "@/lib/docs-assistant";

describe("docs assistant", () => {
  const entries = buildDocsKnowledge(useShortcutConfig);

  it("returns the install guide for setup queries", () => {
    const result = searchDocsKnowledge(entries, "how do i install this?", 1)[0];

    expect(result?.entry.id).toBe("guide:install");
  });

  it("prioritizes exact prop matches", () => {
    const result = searchDocsKnowledge(entries, "ignoreInputs", 1)[0];

    expect(result?.entry.id).toBe("prop:ignoreInputs");
  });

  it("builds a grounded answer with citations for props", () => {
    const answer = buildDocsAnswer(entries, "when should i use ignoreInputs?");

    expect(answer.headline).toBe("ignoreInputs");
    expect(answer.citations[0]?.entry.id).toBe("prop:ignoreInputs");
    expect(answer.bullets.some((bullet) => bullet.toLowerCase().includes("when to use"))).toBe(true);
  });
});
