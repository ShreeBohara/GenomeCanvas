import { expect, test } from "@playwright/test";


test("BRCA1 explanation flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Guide" }).click();
  await page.getByPlaceholder(/Ask the guide/i).fill("What does BRCA1 do?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/BRCA1/i)).toBeVisible();
});


test("Alzheimer disease exploration flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Guide" }).click();
  await page.getByPlaceholder(/Ask the guide/i).fill(
    "Show me proteins involved in Alzheimer's disease",
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/Alzheimer/i)).toBeVisible();
});


test("EGFR drug-target exploration flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Guide" }).click();
  await page.getByPlaceholder(/Ask the guide/i).fill(
    "Find drugs targeting EGFR",
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/EGFR/i)).toBeVisible();
});
