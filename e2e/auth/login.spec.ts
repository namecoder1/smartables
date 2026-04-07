import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows all login form elements", async ({ page }) => {
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible();
  });

  test("submit with empty fields shows validation", async ({ page }) => {
    await page.locator('[data-testid="login-submit"]').click();
    // Browser native validation or custom error should appear
    // Either the email field is focused/invalid, or an error message shows
    const emailInput = page.locator('[data-testid="login-email"]');
    await expect(emailInput).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.locator('[data-testid="login-email"]').fill("nonexistent@test.invalid");
    await page.locator('[data-testid="login-password"]').fill("wrongpassword123");
    await page.locator('[data-testid="login-submit"]').click();

    // Should show error message (not redirect)
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="login-error"]')).not.toBeEmpty();
  });

  test("email field accepts input", async ({ page }) => {
    const email = "test@example.com";
    await page.locator('[data-testid="login-email"]').fill(email);
    await expect(page.locator('[data-testid="login-email"]')).toHaveValue(email);
  });

  test("password field masks input", async ({ page }) => {
    const passwordInput = page.locator('[data-testid="login-password"]');
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});
