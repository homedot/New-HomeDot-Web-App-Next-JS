const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto("http://localhost:3000/avatarpreviewxyz", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: "/private/tmp/claude-501/-Users-homedot-Documents-Next-JS-New-HomeDot-Web-App-Next-JS/f4b6136c-aa7d-4d74-b7e2-c57c44329c26/scratchpad/avatar_1_idle.png",
  });
  await page.hover("button.avatar-photo-btn");
  await page.waitForTimeout(300);
  await page.screenshot({
    path: "/private/tmp/claude-501/-Users-homedot-Documents-Next-JS-New-HomeDot-Web-App-Next-JS/f4b6136c-aa7d-4d74-b7e2-c57c44329c26/scratchpad/avatar_2_hover.png",
  });
  await page.click("button.avatar-photo-btn");
  await page.waitForTimeout(500);
  await page.screenshot({
    path: "/private/tmp/claude-501/-Users-homedot-Documents-Next-JS-New-HomeDot-Web-App-Next-JS/f4b6136c-aa7d-4d74-b7e2-c57c44329c26/scratchpad/avatar_3_expanded.png",
  });
  console.log("ERRORS:", JSON.stringify(errors));
  await browser.close();
})();
