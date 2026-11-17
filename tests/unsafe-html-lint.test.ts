import { describe, expect, test } from "bun:test";
import { ESLint } from "eslint";

describe("ESLint HTML injection policy", () => {
  test("rejects JSX dangerouslySetInnerHTML attributes", async () => {
    const eslint = new ESLint({ overrideConfigFile: "eslint.config.js" });
    const [result] = await eslint.lintText(
      'const element = <div dangerouslySetInnerHTML={{ __html: "<img src=x>" }} />;',
      { filePath: "src/security-policy-check.tsx" },
    );

    expect(result?.messages.some((message) => message.ruleId === "no-restricted-syntax")).toBe(
      true,
    );
  });
});
