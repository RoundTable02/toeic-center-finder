import { expect, test } from "@playwright/test";

test.describe("TOEIC center finder", () => {
  test("loads schedules, sorts centers by current location, and syncs list/map selection", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({
      latitude: 37.5412163,
      longitude: 127.1497531,
    });

    await page.goto("/");

    await expect(page).toHaveTitle(/내 근처 토익 시험장 찾기/);
    await expect(page.getByTestId("leaflet-map")).toBeVisible();

    await page.getByLabel("시험 일정").selectOption("2026-04-26");
    await page.getByLabel("위치").selectOption("서울");

    await expect(page.getByTestId("location-item-PBT_004")).toBeVisible();
    await expect(page.getByTestId("location-item-PBT_015")).toBeVisible();
    await expect(page.getByTestId("location-item-MISSING_COORD_001")).toBeVisible();

    await page.getByRole("button", { name: "현재 위치 사용" }).click();

    const firstLocation = page.locator('[data-testid^="location-item-"]').first();
    await expect(firstLocation).toContainText("서울 송파 테스트센터");
    await expect(firstLocation).toContainText("직선 거리:");

    await page.getByTestId("location-item-PBT_015").click();
    await expect(page.getByTestId("selected-location-name")).toHaveText(
      "서울 강북 & 테스트센터",
    );
    await expect(page.getByTestId("map-center")).toContainText("37.6492881");

    const mapMarkerButton = page.getByRole("button", {
      name: "서울 송파 테스트센터",
      exact: true,
    });

    await expect(mapMarkerButton).toHaveCount(1);
    await mapMarkerButton.dispatchEvent("click");

    await expect(page.getByTestId("selected-location-name")).toHaveText(
      "서울 송파 테스트센터",
    );
    await expect(page.getByTestId("map-center")).toContainText("37.5412163");

    await expect(
      page.getByRole("button", { name: "좌표 없는 시험장", exact: true }),
    ).toHaveCount(0);
  });

  test("shows a geolocation error when permission is denied", async ({ page, context }) => {
    await context.clearPermissions();
    await page.goto("/");

    await page.getByLabel("시험 일정").selectOption("2026-04-26");
    await page.getByLabel("위치").selectOption("서울");
    await page.getByRole("button", { name: "현재 위치 사용" }).click();

    await expect(page.getByTestId("geolocation-error")).toContainText(
      "위치 정보를 가져오는 데 실패했습니다.",
    );
  });

  test("shows a center loading error when upstream times out", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("시험 일정").selectOption("2026-04-26");
    await page.getByLabel("위치").selectOption("세종");

    await expect(page.getByTestId("app-error")).toContainText(
      "시험 센터 정보를 불러오는 데 실패했습니다.",
    );
  });

  test("serves metadata assets and removes the legacy subpath dependency", async ({
    request,
  }) => {
    const homeResponse = await request.get("/");
    expect(homeResponse.ok()).toBeTruthy();
    await expect(homeResponse.text()).resolves.not.toContain("/location-map-app");

    const robotsResponse = await request.get("/robots.txt");
    expect(robotsResponse.ok()).toBeTruthy();
    await expect(robotsResponse.text()).resolves.toContain("Sitemap:");

    const sitemapResponse = await request.get("/sitemap.xml");
    expect(sitemapResponse.ok()).toBeTruthy();
    await expect(sitemapResponse.text()).resolves.toContain("<loc>");

    const ogImageResponse = await request.get("/img.png");
    expect(ogImageResponse.ok()).toBeTruthy();

    const legacyResponse = await request.get("/location-map-app/");
    expect(legacyResponse.status()).toBe(404);
  });

  test("preserves the API contract through Next route handlers", async ({ request }) => {
    const healthResponse = await request.get("/api/health");
    expect(healthResponse.ok()).toBeTruthy();
    await expect(healthResponse.json()).resolves.toMatchObject({
      status: "ok",
    });

    const schedulesResponse = await request.get("/api/toeic");
    expect(schedulesResponse.ok()).toBeTruthy();
    expect(schedulesResponse.headers()["cache-control"]).toContain("s-maxage=3600");
    await expect(schedulesResponse.json()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exam_code: "EXAM_2026_04_26",
        }),
      ]),
    );

    const missingParamsResponse = await request.get("/api/toeic/centers");
    expect(missingParamsResponse.status()).toBe(400);

    const successCentersResponse = await request.get(
      "/api/toeic/centers?examCode=EXAM_2026_04_26&bigArea=서울",
    );
    expect(successCentersResponse.ok()).toBeTruthy();
    expect(successCentersResponse.headers()["cache-control"]).toContain(
      "s-maxage=86400",
    );
    await expect(successCentersResponse.json()).resolves.toEqual(
      expect.arrayContaining([
        null,
        null,
        expect.arrayContaining([
          expect.objectContaining({
            center_code: "PBT_004",
          }),
        ]),
      ]),
    );

    const noDataResponse = await request.get(
      "/api/toeic/centers?examCode=EXAM_2026_04_26&bigArea=제주",
    );
    expect(noDataResponse.status()).toBe(404);

    const upstreamFailureResponse = await request.get(
      "/api/toeic/centers?examCode=FAIL_500&bigArea=서울",
    );
    expect(upstreamFailureResponse.status()).toBe(500);

    const timeoutResponse = await request.get(
      "/api/toeic/centers?examCode=EXAM_2026_04_26&bigArea=세종",
    );
    expect(timeoutResponse.status()).toBe(500);
    await expect(timeoutResponse.json()).resolves.toMatchObject({
      code: "UPSTREAM_TIMEOUT",
    });
  });
});
