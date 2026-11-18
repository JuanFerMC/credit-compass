import { describe, expect, test } from "bun:test";
import { isValidExportApplicantIds } from "../src/api/export-validation";

describe("export applicant selection", () => {
  test("accepts one or more unique positive integer ids up to the limit", () => {
    expect(isValidExportApplicantIds([1])).toBe(true);
    expect(isValidExportApplicantIds([1, 2, 50])).toBe(true);
    expect(isValidExportApplicantIds(Array.from({ length: 50 }, (_, index) => index + 1))).toBe(
      true,
    );
  });

  test("rejects an empty selection", () => {
    expect(isValidExportApplicantIds([])).toBe(false);
  });

  test("rejects more than 50 applicants", () => {
    expect(isValidExportApplicantIds(Array.from({ length: 51 }, (_, index) => index + 1))).toBe(
      false,
    );
  });

  test("rejects invalid or repeated ids", () => {
    expect(isValidExportApplicantIds([0])).toBe(false);
    expect(isValidExportApplicantIds([-1])).toBe(false);
    expect(isValidExportApplicantIds([1.5])).toBe(false);
    expect(isValidExportApplicantIds([1, 1])).toBe(false);
  });
});
