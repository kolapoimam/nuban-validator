import { describe, expect, it } from "vitest";
import {
  buildNuban,
  computeCheckDigit,
  findMatchingBankCodes,
  isValidNuban,
  toInstitutionCode,
  validateNuban,
} from "../src/index.js";

// Examples from the CBN Revised NUBAN Standards (March 2020)
const CBN_DMB_EXAMPLE = { bankCode: "011", account: "0000014579" };
const CBN_OFI_EXAMPLE = { bankCode: "50547", account: "0000214579" };

describe("toInstitutionCode", () => {
  it("pads 3-digit bank codes with three leading zeros", () => {
    expect(toInstitutionCode("011")).toBe("000011");
    expect(toInstitutionCode("232")).toBe("000232");
  });

  it("prefixes 5-digit OFI codes with 9", () => {
    expect(toInstitutionCode("50547")).toBe("950547");
  });

  it("accepts codes already in 6-digit form", () => {
    expect(toInstitutionCode("000058")).toBe("000058");
    expect(toInstitutionCode("950547")).toBe("950547");
  });

  it("trims surrounding whitespace", () => {
    expect(toInstitutionCode(" 058 ")).toBe("000058");
  });

  it.each(["", "58", "0058", "123456", "05A", "5054", "1234567"])(
    "rejects %j",
    (code) => {
      expect(toInstitutionCode(code)).toBeNull();
    },
  );
});

describe("computeCheckDigit", () => {
  it("matches the CBN bank example", () => {
    expect(computeCheckDigit("000001457", "011")).toBe(9);
  });

  it("matches the CBN OFI example", () => {
    expect(computeCheckDigit("000021457", "50547")).toBe(9);
  });

  it("returns 0 when the weighted sum is a multiple of 10", () => {
    // 5*7 + 8*3 + 7*3 = 80
    expect(computeCheckDigit("700000000", "058")).toBe(0);
  });

  it("throws on a malformed serial", () => {
    expect(() => computeCheckDigit("12345678", "058")).toThrow(TypeError);
    expect(() => computeCheckDigit("12345678X", "058")).toThrow(TypeError);
  });

  it("throws on a malformed bank code", () => {
    expect(() => computeCheckDigit("000001457", "58")).toThrow(TypeError);
  });
});

describe("validateNuban", () => {
  it("accepts the CBN bank example", () => {
    expect(
      validateNuban(CBN_DMB_EXAMPLE.account, CBN_DMB_EXAMPLE.bankCode),
    ).toEqual({ valid: true, institutionCode: "000011" });
  });

  it("accepts the CBN OFI example", () => {
    expect(
      validateNuban(CBN_OFI_EXAMPLE.account, CBN_OFI_EXAMPLE.bankCode),
    ).toEqual({ valid: true, institutionCode: "950547" });
  });

  it("reports the expected check digit on a mismatch", () => {
    expect(validateNuban("0000014570", "011")).toEqual({
      valid: false,
      reason: "CHECK_DIGIT_MISMATCH",
      expectedCheckDigit: 9,
    });
  });

  it.each(["", "123456789", "12345678901", "00000145 9", "abcdefghij"])(
    "rejects account number %j",
    (account) => {
      expect(validateNuban(account, "011")).toEqual({
        valid: false,
        reason: "INVALID_ACCOUNT_NUMBER",
      });
    },
  );

  it("rejects an unusable bank code", () => {
    expect(validateNuban("0000014579", "11")).toEqual({
      valid: false,
      reason: "INVALID_BANK_CODE",
    });
  });

  it("trims surrounding whitespace on the account number", () => {
    expect(isValidNuban(" 0000014579 ", "011")).toBe(true);
  });

  it("treats the same serial differently for different banks", () => {
    expect(isValidNuban("0000014579", "011")).toBe(true);
    expect(isValidNuban("0000014579", "058")).toBe(false);
  });
});

describe("isValidNuban", () => {
  it("returns a plain boolean", () => {
    expect(isValidNuban("0000214579", "50547")).toBe(true);
    expect(isValidNuban("0000214578", "50547")).toBe(false);
  });
});

describe("buildNuban", () => {
  it("appends the check digit to the serial", () => {
    expect(buildNuban("000001457", "011")).toBe("0000014579");
    expect(buildNuban("000021457", "50547")).toBe("0000214579");
  });

  it("supports 5-digit OFI codes and their 6-digit forms", () => {
    const serial = "123000000";
    const fiveDigitCode = "01234";
    const sixDigitCode = "901234";

    const account = buildNuban(serial, fiveDigitCode);

    expect(account).toBe(buildNuban(serial, sixDigitCode));
    expect(isValidNuban(account, fiveDigitCode)).toBe(true);
    expect(isValidNuban(account, sixDigitCode)).toBe(true);
  });

  it("always produces numbers that validate", () => {
    const codes = ["011", "044", "058", "232", "50547"];
    for (const code of codes) {
      for (let n = 0; n < 500; n += 7) {
        const serial = String(123_000_000 + n);
        expect(isValidNuban(buildNuban(serial, code), code)).toBe(true);
      }
    }
  });
});

describe("findMatchingBankCodes", () => {
  it("returns only the codes the account number is valid for", () => {
    const candidates = ["011", "044", "058", "50547"];
    const matches = findMatchingBankCodes("0000014579", candidates);
    expect(matches).toContain("011");
    expect(matches).not.toContain("058");
  });

  it("returns an empty list for a malformed account number", () => {
    expect(findMatchingBankCodes("123", ["011", "058"])).toEqual([]);
  });
});
