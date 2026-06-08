import { expect, type Page, test } from "@playwright/test";
import fs from "fs";
import path from "path";

// Load local .env for Playwright runs so tests can use PLAYWRIGHT_TEST_* vars
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([^=]+)=(.*)$/);
      if (m) {
        const k = m[1].trim();
        let v = m[2].trim();
        if (v.startsWith("\"") && v.endsWith("\"")) v = v.slice(1, -1);
        if (!process.env[k]) process.env[k] = v;
      }
    });
  }
} catch {
  // ignore
}

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

function uniqueEmail() {
  return `playwright+${Date.now()}@example.com`;
}

async function authenticate(page: Page, email: string, password: string, fullName?: string) {
  if (TEST_EMAIL && TEST_PASSWORD) {
    await page.goto("/auth/signin");
    await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
    await page.getByPlaceholder(/password/i).fill(TEST_PASSWORD);
    await Promise.all([
      page.waitForURL("**/"),
      page.getByRole("button", { name: /sign in/i }).click({ force: true }),
    ]);
    return TEST_EMAIL;
  }

  await page.goto("/auth/signup");
  await page.getByPlaceholder(/full name/i).fill(fullName ?? "Test User");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await Promise.all([
    page.waitForURL("**/"),
    page.getByRole("button", { name: /create account/i }).click({ force: true }),
  ]);
  return email;
}

test("auth flow, profile access, sign out, and login", async ({ page }) => {
  const email = TEST_EMAIL ?? uniqueEmail();
  const password = TEST_PASSWORD ?? "Test1234!";
  const fullName = "Playwright User";

  const authenticatedEmail = await authenticate(page, email, password, fullName);
  await expect(page.getByRole("link", { name: /profile/i })).toBeVisible();

  await page.goto("/profile");
  await expect(page.getByText(/your profile/i)).toBeVisible();
  await expect(page.getByText(authenticatedEmail)).toBeVisible();

  await page.getByRole("button", { name: /sign out/i }).nth(1).click({ force: true });
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/auth/signin");
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click({ force: true });
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/profile");
  await expect(page.getByText(/your profile/i)).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();
});

test("protected routes redirect unauthenticated users", async ({ page }) => {
  await page.goto("/history");
  await expect(page).toHaveURL(/\/auth\/signin/);
  await page.goto("/playlists");
  await expect(page).toHaveURL(/\/auth\/signin/);
});

test("mood detection flow generates analysis and recommendations", async ({ page }) => {
  await page.goto("/discover");
  await page.getByPlaceholder(/late night coding/i).fill("Energetic gym songs");
  await page.getByRole("button", { name: /generate/i }).click({ force: true });
  await expect(page.getByRole("button", { name: /save \d+ songs/i })).toBeVisible();
  await expect(page.getByTestId("song-card")).toHaveCount(6);
});

test("playlist generation, save, history, and replay for authenticated user", async ({ page }) => {
  const email = TEST_EMAIL ?? uniqueEmail();
  const password = TEST_PASSWORD ?? "Test1234!";

  await authenticate(page, email, password, "Playwright History");
  await expect(page.getByRole("link", { name: /profile/i })).toBeVisible();

  await page.goto("/discover");
  await page.getByPlaceholder(/late night coding/i).fill("Sad Bollywood breakup songs");
  await page.getByRole("button", { name: /generate/i }).click({ force: true });
  await expect(page.getByTestId("song-card")).toHaveCount(6);
  await page.getByRole("button", { name: /^add$/i }).first().click({ force: true });
  await page.getByRole("button", { name: /save 1 song/i }).click({ force: true });
  // allow time for persistence to complete (server may run async tasks)
  await page.waitForTimeout(3000);

  await page.goto("/history");
  await expect(page.getByText(/no history yet/i)).not.toBeVisible();
  // Wait for the replay button showing a saved session (more resilient than matching prompt text)
  await page.getByRole("button", { name: /replay/i }).first().waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: /replay/i }).first().click({ force: true });

  await page.goto("/playlists");
  await expect(page.getByRole("heading", { name: /playlists/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /replay/i })).toBeVisible();
});
