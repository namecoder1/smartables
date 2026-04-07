import { test, expect } from "@playwright/test";

test.describe("Register page — plan selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("loads without error", async ({ page }) => {
    await expect(page).not.toHaveTitle(/Error|500/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows billing period toggle", async ({ page }) => {
    await expect(page.locator('[data-testid="billing-monthly"]')).toBeVisible();
    await expect(page.locator('[data-testid="billing-annual"]')).toBeVisible();
  });

  test("billing toggle buttons are clickable", async ({ page }) => {
    // These are <button> elements (not radio inputs) — just verify clicks don't throw
    await page.locator('[data-testid="billing-annual"]').click();
    await expect(page.locator('[data-testid="billing-annual"]')).toBeVisible();

    await page.locator('[data-testid="billing-monthly"]').click();
    await expect(page.locator('[data-testid="billing-monthly"]')).toBeVisible();
  });

  test("shows plan selection buttons", async ({ page }) => {
    const planButtons = page.locator('[data-testid^="plan-select-"]');
    await expect(planButtons.first()).toBeVisible();
    expect(await planButtons.count()).toBeGreaterThan(0);
  });

  test("clicking a plan navigates to registration form", async ({ page }) => {
    const planButtons = page.locator('[data-testid^="plan-select-"]');
    await planButtons.first().click();
    // After plan selection, URL gains ?plan=...&interval=... and form appears
    await expect(page.locator('[data-testid="register-email"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Register page — registration form", () => {
  // Navigate directly to the form state (skips plan selection screen)
  test.beforeEach(async ({ page }) => {
    await page.goto("/register?plan=starter&interval=month");
  });

  test("shows all registration form fields", async ({ page }) => {
    await expect(page.locator('[data-testid="register-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-submit"]')).toBeVisible();
  });

  test("email field accepts input", async ({ page }) => {
    const email = "test@example.com";
    await page.locator('[data-testid="register-email"]').fill(email);
    await expect(page.locator('[data-testid="register-email"]')).toHaveValue(email);
  });

  test("password field accepts input", async ({ page }) => {
    const password = "Secret@1234567";
    await page.locator('[data-testid="register-password"]').fill(password);
    await expect(page.locator('[data-testid="register-password"]')).toHaveValue(password);
  });

  test("submit button is disabled until password meets requirements", async ({ page }) => {
    const submitBtn = page.locator('[data-testid="register-submit"]');
    // With empty password, the button should be disabled (password invalid)
    await expect(submitBtn).toBeDisabled();

    // Fill in a valid strong password
    await page.locator('[data-testid="register-email"]').fill("user@test.com");
    await page.locator('[data-testid="register-password"]').fill("ValidPass@12345");
    // Now the button should be enabled
    await expect(submitBtn).toBeEnabled();
  });

  test("can navigate back to plan selection", async ({ page }) => {
    const changeLink = page.getByText("Cambia piano");
    await expect(changeLink).toBeVisible();
    await changeLink.click();
    // Should go back to plan selection (URL without plan/interval params)
    await expect(page.locator('[data-testid^="plan-select-"]').first()).toBeVisible({ timeout: 5000 });
  });
});
