import { expect, test } from "@playwright/test";


test("desktop workspace renders split layout shell", async ({ page }) => {
  await page.goto("/");
  // Headings, not bare text. "Protein universe" appears twice -- once as the
  // command bar's eyebrow label and once as the viewport heading -- so
  // getByText matches two elements and fails Playwright's strict mode. That
  // assertion could not pass regardless of the browser, which is what kept
  // this spec red after the workspace rewrite renamed the panels.
  await expect(page.getByRole("heading", { name: "GenomeCanvas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Protein universe" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Guided exploration" })).toBeVisible();
  await expect(page.getByText("Graph constellation")).toBeVisible();
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

  // Assert on something only the backend can produce. Matching /BRCA1/i alone
  // passes against the user's own echoed message, so it stayed green for months
  // while every API call was being blocked by CORS.
  await expect(page.getByText("BRCA1 in UniProt")).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/tumor suppressor|dna_repair|DNA repair/i).first()).toBeVisible();
});


test("Alzheimer disease exploration flow", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Ask the guide/i).fill(
    "Show me proteins involved in Alzheimer's disease",
  );
  await page.getByRole("button", { name: "Send" }).click();

  // Scoped to the assistant's own message body. A bare page-wide regex matches
  // hidden nodes elsewhere in the DOM and tells you nothing about the answer.
  const answer = page.locator(".guide-message-card.assistant .guide-message-body").last();
  await expect(answer).toContainText(/APOE|MAPT|PSEN1/, { timeout: 15000 });
  await expect(page.getByText("Filter universe")).toBeVisible();
});


test("EGFR drug-target exploration flow", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/Ask the guide/i).fill(
    "Find drugs targeting EGFR",
  );
  await page.getByRole("button", { name: "Send" }).click();

  // Drug names come from the fixture graph, not from anything the client holds.
  await expect(
    page.getByText(/Osimertinib|Erlotinib|Gefitinib|Cetuximab/).first(),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("EGFR in UniProt")).toBeVisible();
});


test("traces the shortest connection from the graph root", async ({ page }) => {
  await page.goto("/");

  // Root the graph on BRCA1 via the command bar.
  await page.getByPlaceholder(/Search proteins/i).click();
  await page.getByPlaceholder(/Search proteins/i).fill("BRCA1");
  await page.getByRole("button", { name: "Spotlight" }).click();
  await expect(page.getByRole("heading", { name: "P38398" })).toBeVisible({
    timeout: 15000,
  });

  // The target picker is the keyboard-reachable path into this feature; the
  // hover affordance on the canvas is the shortcut, not the only way in.
  const target = page.getByLabel("Trace connection to");
  await expect(target).toBeVisible({ timeout: 15000 });

  const options = await target.locator("option:not([disabled])").allTextContents();
  expect(options.length).toBeGreaterThan(0);
  await target.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Trace" }).click();

  const strip = page.getByTestId("graph-path-strip");
  await expect(strip).toBeVisible({ timeout: 15000 });
  // Either a route or an explicit statement that none exists. Both are answers;
  // the assertion is that one of them renders rather than a silent empty panel.
  await expect(strip).toContainText(/hop|no connection between these entities/i);

  await strip.getByRole("button", { name: "Clear" }).click();
  await expect(strip).toBeHidden();
});
