import { expect, test } from "@playwright/test";

test.describe("live smoke @live", () => {
  test.skip(
    process.env.PLAYWRIGHT_LIVE_SMOKE !== "1",
    "Set PLAYWRIGHT_LIVE_SMOKE=1 to run against a live upstream.",
  );

  test("loads the homepage and key APIs", async ({ page, request }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/토익 시험장 찾기/);

    const healthResponse = await request.get("/api/health");
    expect(healthResponse.ok()).toBeTruthy();

    const schedulesResponse = await request.get("/api/toeic");
    expect(schedulesResponse.ok()).toBeTruthy();
    await expect(schedulesResponse.json()).resolves.toEqual(expect.any(Array));
  });
});
