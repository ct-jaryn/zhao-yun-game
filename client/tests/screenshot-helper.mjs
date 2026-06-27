export async function safeScreenshot(page, options) {
  try {
    await page.screenshot(options);
  } catch (err) {
    if (err && err.name === 'TimeoutError') {
      console.warn(`[screenshot] timeout skipped: ${options.path || '(no path)'}`);
    } else {
      throw err;
    }
  }
}
