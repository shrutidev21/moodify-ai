import { expect, test } from "@playwright/test";

test("search flow generates a playlist", async ({ page }) => {
  await page.goto("/discover");
  await page.getByPlaceholder(/late night coding/i).fill("Energetic gym songs");
  await page.getByRole("button", { name: /generate/i }).click();
  await expect(page.getByText(/Pulse Mode/i)).toBeVisible();
  await expect(page.getByTestId("song-card")).toHaveCount(6);
});

test("playlist page plays a song", async ({ page }) => {
  await page.goto("/discover");
  await page.getByPlaceholder(/late night coding/i).fill("Relaxing music for studying");
  await page.getByRole("button", { name: /generate/i }).click();
  await page.getByTestId("song-card").first().getByRole("button", { name: /play/i }).click();
  await expect(page.getByTitle(/YouTube video player/i)).toBeVisible();
});

test("save playlist functionality", async ({ page }) => {
  await page.goto("/discover");
  await page.getByPlaceholder(/late night coding/i).fill("Sad Bollywood breakup songs");
  await page.getByRole("button", { name: /generate/i }).click();
  await page.getByRole("button", { name: /save playlist/i }).click();
  await expect(page.getByText(/Playlist saved/i)).toBeVisible();
});
