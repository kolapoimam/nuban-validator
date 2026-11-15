<div align="center">

# nuban-validator

Validate Nigerian bank account numbers with the CBN check digit algorithm.

[![CI](https://github.com/kolapoimam/nuban-validator/actions/workflows/ci.yml/badge.svg)](https://github.com/kolapoimam/nuban-validator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/types-included-3178c6.svg)

</div>

Catch typos in account numbers before you call a name enquiry API. You save the cost and wait of lookups that were never going to succeed, and your users get instant feedback.

## Features

- Supports commercial banks (3-digit CBN codes) and microfinance banks and other financial institutions (5-digit CBN codes)
- Follows the CBN Revised NUBAN Standards (2020)
- Zero dependencies
- Works in Node.js and the browser
- ESM and CommonJS builds, with TypeScript types

## Contents

- [Install](#install)
- [Quick start](#quick-start)
  - [Validate a form in the browser](#validate-a-form-in-the-browser)
- [API](#api)
- [Bank codes](#bank-codes)
- [How the check works](#how-the-check-works)
- [Limitations](#limitations)
- [Contributing](#contributing)

## Install

```bash
npm install @kolapoimam/nuban
```

## Quick start

```ts
import { isValidNuban, validateNuban } from "@kolapoimam/nuban";

isValidNuban("0000014579", "011"); // true
isValidNuban("0000014570", "011"); // false

validateNuban("0000014570", "011");
// { valid: false, reason: "CHECK_DIGIT_MISMATCH", expectedCheckDigit: 9 }
```

Using CommonJS:

```js
const { isValidNuban } = require("@kolapoimam/nuban");
```

### Validate a form in the browser

For a plain HTML page, run `npm run build` from a checkout and serve
`dist/index.js` as `nuban.js` beside the page. Keep both values as strings so
leading zeroes survive.

```html
<form id="payout">
  <label>Account number <input name="account" inputmode="numeric" required></label>
  <label>CBN bank code <input name="bank" inputmode="numeric" required></label>
  <button>Check account</button>
  <p id="feedback" role="status"></p>
</form>
<script type="module">
  import { isValidNuban } from "./nuban.js";

  const form = document.querySelector("#payout");
  const feedback = document.querySelector("#feedback");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const account = data.get("account");
    const bank = data.get("bank");
    if (!isValidNuban(account.trim(), bank.trim())) {
      feedback.textContent = "Check the account number and CBN bank code.";
      return;
    }
    feedback.textContent = "Number format looks valid. Confirm the account name next.";
    // Call your name enquiry endpoint here.
  });
</script>
```

The check digit can catch mistakes. Run validation again on your server and
confirm the account name before proceeding with a payout.

## API

| Function | Returns | Use it to |
| --- | --- | --- |
| `isValidNuban(accountNumber, bankCode)` | `boolean` | Check an account number in one line |
| `validateNuban(accountNumber, bankCode)` | `ValidationResult` | Find out why a check failed |
| `findMatchingBankCodes(accountNumber, bankCodes)` | `string[]` | Suggest likely banks for an account number |
| `computeCheckDigit(serial, bankCode)` | `number` | Get the check digit for a 9-digit serial |
| `buildNuban(serial, bankCode)` | `string` | Generate valid account numbers for tests |
| `toInstitutionCode(bankCode)` | `string \| null` | Convert a CBN code to its 6-digit form |

### validateNuban

Returns one of these:

```ts
{ valid: true, institutionCode: "000011" }
{ valid: false, reason: "INVALID_ACCOUNT_NUMBER" }
{ valid: false, reason: "INVALID_BANK_CODE" }
{ valid: false, reason: "CHECK_DIGIT_MISMATCH", expectedCheckDigit: 9 }
```

### findMatchingBankCodes

Pass in the bank codes you support and get back the ones the account number is valid for.

```ts
findMatchingBankCodes("0000014579", ["011", "044", "058"]);
// ["011", "044"]
```

More than one bank will often match, so treat the result as a shortlist and confirm with a name enquiry.

### computeCheckDigit and buildNuban

```ts
computeCheckDigit("000001457", "011"); // 9
buildNuban("000001457", "011");        // "0000014579"
```

`computeCheckDigit` throws a `TypeError` if the serial or bank code is malformed.

## Bank codes

Pass the CBN code for the institution.

| Institution | CBN code | Example |
| --- | --- | --- |
| Commercial bank | 3 digits | `058` |
| Microfinance bank or other financial institution | 5 digits | `50547` |

CBN codes are different from NIP (NIBSS) institution codes, which are usually 6 digits, such as `000013`. If you only have a NIP code, map it to the CBN code first.

A built-in bank list is planned. See [issue #1](https://github.com/kolapoimam/nuban-validator/issues/1) if you would like to help.

## How the check works

The algorithm comes from the CBN [Revised Standards on Nigeria Uniform Bank Account Number (NUBAN)](https://www.cbn.gov.ng/Out/2020/PSMD/REVISED%20STANDARDS%20ON%20NIGERIA%20UNIFORM%20BANK%20ACCOUNT%20NUMBER%20(NUBAN)%20FOR%20BANKS%20AND%20OTHER%20FINANCIAL%20INSTITUTIONS%20.pdf) (March 2020).

1. Convert the bank code to 6 digits. Banks get three leading zeros, so `011` becomes `000011`. Other financial institutions get a leading 9, so `50547` becomes `950547`.
2. Add the first 9 digits of the account number to get 15 digits.
3. Multiply each digit by `3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3, 3, 7, 3` and add up the results.
4. Subtract the remainder of the sum divided by 10 from 10. If the answer is 10, use 0.
5. The account number is valid when its last digit matches this check digit.

Both worked examples from the CBN document are part of the test suite.

## Limitations

A passing check means the number is well formed for that bank. It does not confirm that the account exists, is active, or belongs to the person you expect. Use a name enquiry for that.

## Contributing

Contributions are welcome. Some good places to start:

- A bank list with CBN codes and sources
- Ports to Python, Go, PHP or Dart
- More test cases

Read the [contributing guide](CONTRIBUTING.md) before you open a pull request, and check the [open issues](https://github.com/kolapoimam/nuban-validator/issues) for ideas.

## License

[MIT](LICENSE) © Kolapo Imam

<br>

<div align="center">

If this package saves you time, please give it a ⭐ on GitHub. It helps other developers find it.

</div>
