import { test, expect } from "@playwright/test";
test("complete create, edit, save, reopen, approve, export, delete workflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Project overview" }),
  ).toBeVisible();
  await expect(page.locator(".stat").last()).toContainText("$38,030");
  await page
    .getByRole("button", { name: "Create change order", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Use sample email" }).click();
  await page
    .getByRole("button", { name: "Generate Change Order", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Estimated cost (CAD)")).toHaveValue("12480");
  await dialog
    .getByLabel("Change description / title")
    .fill("Test partition revision");
  await dialog.getByLabel("Estimated cost (CAD)").fill("15000");
  await dialog.getByLabel("Approval status").selectOption("Pending Review");
  await dialog.getByRole("button", { name: "Save change order" }).click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Change orders", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search change orders").fill("Test partition");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Open CO-007", exact: true }).click();
  await expect(dialog.getByLabel("Estimated cost (CAD)")).toHaveValue("15000");
  await dialog.getByText("Original source notes", { exact: true }).click();
  await expect(dialog.locator("pre")).toContainText("quotation LI-042");
  await dialog.getByLabel("Approval status").selectOption("Approved");
  await expect(
    dialog.getByRole("button", { name: "Save change order" }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Confirm approved status" }).click();
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Export PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("CO-007-ConstructAI.pdf");
  await download.saveAs("test-results/export.pdf");
  await dialog.getByRole("button", { name: "Save change order" }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.locator(".stat").last()).toContainText("$53,030");
  await expect(page.locator(".stat").nth(2)).toContainText("3");
  await page
    .getByRole("button", { name: "Change Orders", exact: false })
    .first()
    .click();
  await page.getByRole("button", { name: "Open CO-007", exact: true }).click();
  await dialog.getByRole("button", { name: "Delete change order" }).click();
  await dialog.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("filters, sorting, navigation, and reset", async ({ page }) => {
  await page.goto("/#orders");
  await page.getByLabel("Filter status").selectOption("Approved");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByLabel("Filter trade").selectOption("Materials");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("-$2,300");
  await page.getByLabel("Filter status").selectOption("All statuses");
  await page.getByLabel("Filter trade").selectOption("All trades");
  await page.getByLabel("Sort orders").selectOption("cost");
  await expect(page.locator("tbody tr").first()).toContainText("$18,650");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Harbourview Towers", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Reset demo workspace" }).click();
  await page.getByRole("button", { name: "Replace all records" }).click();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.locator(".stat").first()).toContainText("6");
});
test("custom notes remain unpriced; failed request preserves notes", async ({
  page,
}) => {
  await page.goto("/#create");
  const notes =
    "Please investigate the changed wall alignment at grid C. Cost is not known.";
  await page.getByLabel("Source notes").fill(notes);
  await page
    .getByRole("button", { name: "Generate Change Order", exact: true })
    .click();
  const d = page.getByRole("dialog");
  await expect(d.getByLabel("Estimated cost (CAD)")).toHaveValue("");
  await expect(d.getByLabel("Description of proposed change")).toHaveValue(
    notes,
  );
  await d.getByRole("button", { name: "Close editor" }).click();
  await page.route("**/api/generate", (route) =>
    route.fulfill({ status: 502, json: { error: "Test service unavailable" } }),
  );
  await page
    .getByRole("button", { name: "Generate Change Order", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Test service unavailable",
  );
  await expect(page.getByLabel("Source notes")).toHaveValue(notes);
});
test("mobile and tablet layouts fit with accessible navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Project overview" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("button", { name: "Create Change Order", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Use sample email" }).click();
  await page
    .getByRole("button", { name: "Generate Change Order", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-editor.png" });
  await page.getByRole("button", { name: "Close editor" }).click();
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/tablet.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});
test("API rejects malformed payloads", async ({ request }) => {
  const a = await request.post("/api/generate", {
    data: { source: "short", projectId: "harbourview" },
  });
  expect(a.status()).toBe(400);
  const b = await request.post("/api/generate", {
    data: { source: "x".repeat(23000), projectId: "harbourview" },
  });
  expect(b.status()).toBe(413);
});
