import { expect, test } from "@playwright/test";


test("desktop workspace renders split layout shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("GenomeCanvas")).toBeVisible();
  // "Protein universe" appears twice: the command bar's eyebrow label echoes
  // the active viewport mode, and the panel titles it. Match the panel heading
  // so this stays a check on the layout shell rather than on the mode label.
  await expect(
    page.getByRole("heading", { name: "Protein universe" }),
  ).toBeVisible();
  await expect(page.getByText("Graph constellation")).toBeVisible();
  await expect(page.getByText("Guided exploration")).toBeVisible();
});


test("graph and guide panels can collapse from the command bar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Hide graph" }).click();
  await expect(page.getByText(/Expand the graph/i)).toBeVisible();

  await page.getByRole("button", { name: "Hide guide" }).click();
  await expect(page.getByText(/Expand the guide/i)).toBeVisible();
});


test("BRCA1 explanation flow", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Ask the guide/i).fill("What does BRCA1 do?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/BRCA1/i)).toBeVisible();
});


test("Alzheimer disease exploration flow", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Ask the guide/i).fill(
    "Show me proteins involved in Alzheimer's disease",
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/Alzheimer/i)).toBeVisible();
});


test("EGFR drug-target exploration flow", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Ask the guide/i).fill(
    "Find drugs targeting EGFR",
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/EGFR/i)).toBeVisible();
});
