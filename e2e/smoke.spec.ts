import { test, expect } from "@playwright/test";

/**
 * Smoke tests — verify core pages load without crashing.
 * These run against the live dev server (npm run dev).
 */

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).not.toHaveTitle(/Error|500/);
  // Should either show landing content or redirect to login
  await expect(page.locator("body")).toBeVisible();
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
  await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
  await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
});

test("register page loads", async ({ page }) => {
  await page.goto("/register");
  // The register page has plan selection before the form
  await expect(page.locator("body")).toBeVisible();
  await expect(page).not.toHaveTitle(/Error|500/);
});

test("unauthenticated dashboard redirects to login", async ({ page }) => {
  await page.goto("/home");
  // Should redirect to login when not authenticated
  await expect(page).toHaveURL(/login/);
});
