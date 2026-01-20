import { Stripe } from "stripe";

let sKey: string;

if (process.env.NODE_ENV === "production") {
  sKey = process.env.STRIPE_SECRET_KEY || "dummy_key";
} else {
  sKey = process.env.STRIPE_SECRET_KEY_TEST || "dummy_key";
}

export const stripe = new Stripe(sKey, {
  apiVersion: "2025-12-15.clover",
  appInfo: {
    name: "Smartables",
  },
});
