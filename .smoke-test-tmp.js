const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) =>
    consoleErrors.push("pageerror: " + err.message),
  );

  await page.goto("http://localhost:3000", {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  const overlayCount = await page.evaluate(
    () => document.querySelectorAll(".login-overlay").length,
  );
  const loginBtns = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button"))
      .filter((b) => b.textContent.trim() === "Log in")
      .map((b) => b.getBoundingClientRect()),
  );
  console.log("overlayCount before click:", overlayCount);
  console.log("login buttons rects:", JSON.stringify(loginBtns));

  await browser.close();
})().catch((e) => {
  console.error("SCRIPT_FAILED", e);
  process.exit(1);
});
