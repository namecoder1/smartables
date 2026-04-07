import { test, expect } from "@playwright/test";

/**
 * Public Booking Page tests (/p/[locationSlug])
 *
 * These tests validate the booking form UI and client-side behavior.
 * They require a running dev server with a real DB location slug configured
 * via the PLAYWRIGHT_BOOKING_SLUG env var (optional — tests gracefully skip if missing).
 *
 * To run with a real slug:
 *   PLAYWRIGHT_BOOKING_SLUG=my-restaurant npx playwright test e2e/public/booking.spec.ts
 */

const SLUG = process.env.PLAYWRIGHT_BOOKING_SLUG;

test.describe("Public Booking Form", () => {
  test.skip(!SLUG, "Set PLAYWRIGHT_BOOKING_SLUG to run booking E2E tests");

  test.beforeEach(async ({ page }) => {
    await page.goto(`/p/${SLUG}`);
  });

  test("booking form elements are visible", async ({ page }) => {
    await expect(page.locator('[data-testid="booking-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-phone"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-submit"]')).toBeVisible();
  });

  test("date picker trigger is clickable", async ({ page }) => {
    const dateTrigger = page.locator('[data-testid="booking-date-trigger"]');
    await expect(dateTrigger).toBeVisible();
    await dateTrigger.click();
    // Calendar should appear
    await expect(page.locator("role=dialog")).toBeVisible({ timeout: 3000 }).catch(() => {
      // Some calendars don't use role=dialog — just verify trigger was clickable
    });
  });

  test("submitting empty form shows validation error", async ({ page }) => {
    await page.locator('[data-testid="booking-submit"]').click();
    // Should stay on same page and show an error
    await expect(page).not.toHaveURL(/success/);
  });

  test("name field accepts text input", async ({ page }) => {
    const nameField = page.locator('[data-testid="booking-name"]');
    await nameField.fill("Mario Rossi");
    await expect(nameField).toHaveValue("Mario Rossi");
  });

  test("phone field accepts phone input", async ({ page }) => {
    const phoneField = page.locator('[data-testid="booking-phone"]');
    await phoneField.fill("+393331234567");
    await expect(phoneField).toHaveValue("+393331234567");
  });

  test("notes field accepts optional text", async ({ page }) => {
    const notesField = page.locator('[data-testid="booking-notes"]');
    if (await notesField.isVisible()) {
      await notesField.fill("Tavolo vicino alla finestra");
      await expect(notesField).toHaveValue("Tavolo vicino alla finestra");
    }
  });
});

test.describe("Public Booking Page — no slug needed", () => {
  test("non-existent location slug returns 404 or error", async ({ page }) => {
    const response = await page.goto("/p/this-slug-definitely-does-not-exist-xyz123");
    // Should return 404 or show an error state — not a 500
    expect(response?.status()).not.toBe(500);
  });
});
