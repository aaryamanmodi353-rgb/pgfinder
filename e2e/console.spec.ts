import { test, expect } from "@playwright/test";

test("overview loads and navigation opens the visitor workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Good work starts with clarity." })).toBeVisible();
  await page.getByRole("link", { name: "Visitors", exact: true }).first().click();
  await page.waitForURL("**/visitors");
  await expect(page.getByRole("heading", { name: "Visitors", exact: true })).toBeVisible();
  await expect(page.getByText(/All profile data is labeled synthetic/)).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("link", { name: "Submission" }).click();
  await expect(page.getByRole("heading", { name: "Submission", exact: true })).toBeVisible();
  await expect(page.getByText("Needed")).toHaveCount(3);
});
