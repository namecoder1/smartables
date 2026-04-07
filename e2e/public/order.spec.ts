import { test, expect } from "@playwright/test";

/**
 * Public Order Page tests (/order/[locationSlug]/[tableId])
 *
 * Requires PLAYWRIGHT_ORDER_SLUG and PLAYWRIGHT_TABLE_ID env vars.
 * Tests gracefully skip if not set.
 *
 * To run:
 *   PLAYWRIGHT_ORDER_SLUG=my-restaurant PLAYWRIGHT_TABLE_ID=table-1 \
 *   npx playwright test e2e/public/order.spec.ts
 */

const SLUG = process.env.PLAYWRIGHT_ORDER_SLUG;
const TABLE = process.env.PLAYWRIGHT_TABLE_ID;

test.describe("Public Order Page", () => {
  test.skip(!SLUG || !TABLE, "Set PLAYWRIGHT_ORDER_SLUG and PLAYWRIGHT_TABLE_ID to run order E2E tests");

  test.beforeEach(async ({ page }) => {
    await page.goto(`/order/${SLUG}/${TABLE}`);
  });

  test("page loads without error", async ({ page }) => {
    await expect(page).not.toHaveTitle(/Error|500/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("shows menu selection or no-menu message", async ({ page }) => {
    // Either the menu selection is visible or a no-menu message
    const menuSelection = page.locator('[data-testid="menu-selection"]');
    const noMenuMessage = page.locator('[data-testid="no-menu-message"]');

    const hasMenus = await menuSelection.isVisible({ timeout: 5000 }).catch(() => false);
    const hasNoMenuMsg = await noMenuMessage.isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasMenus || hasNoMenuMsg).toBe(true);
  });

  test("cart button is visible when menus exist", async ({ page }) => {
    const menuSelection = page.locator('[data-testid="menu-selection"]');
    const hasMenus = await menuSelection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMenus) {
      const cartButton = page.locator('[data-testid="cart-open-button"]');
      await expect(cartButton).toBeVisible();
    }
  });

  test("opening cart sheet shows empty state initially", async ({ page }) => {
    const cartButton = page.locator('[data-testid="cart-open-button"]');
    const isVisible = await cartButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await cartButton.click();
      await expect(page.locator('[data-testid="cart-empty"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test("can select a menu", async ({ page }) => {
    const menuSelection = page.locator('[data-testid="menu-selection"]');
    const hasMenus = await menuSelection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMenus) {
      const menuCards = page.locator('[data-testid^="menu-card-"]');
      const count = await menuCards.count();
      if (count > 0) {
        await menuCards.first().click();
        // After selecting a menu, view-order-button should be visible
        await expect(page.locator('[data-testid="view-order-button"]')).toBeVisible({ timeout: 3000 });
      }
    }
  });
});

test.describe("Order Page — no slug needed", () => {
  test("non-existent order page returns non-500 response", async ({ page }) => {
    const response = await page.goto("/order/slug-xyz-notexist/table-notexist");
    expect(response?.status()).not.toBe(500);
  });
});
