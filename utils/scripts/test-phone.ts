import { parsePhoneNumber } from "react-phone-number-input";

const testNumber = "348 697 4498";
const defaultCountry = "IT";

try {
  const parsed = parsePhoneNumber(testNumber, defaultCountry);

  const testNumber2 = "384 398 3429";
  const parsed2 = parsePhoneNumber(testNumber2, defaultCountry);
} catch (e) {
  console.error("Error parsing:", e);
}
