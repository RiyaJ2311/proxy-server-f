const { chromium } = require("playwright");

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
];

const sources = [
  "https://www.google.com",
  "https://www.bing.com",
  "https://www.duckduckgo.com",
];

const stages = [
  { duration: "30s", target: 20 }, // Ramp up to 20 users over 30 seconds
  { duration: "1m", target: 20 }, // Stay at 20 users for 1 minute
  { duration: "30s", target: 50 }, // Ramp up to 50 users over 30 seconds
  { duration: "1m", target: 50 }, // Stay at 50 users for 1 minute
  { duration: "30s", target: 0 }, // Ramp down to 0 users over 30 seconds
];

const TOTAL_REQUESTS = 800;

async function runTest(browser, testId) {
  const context = await browser.newContext();
  const page = await context.newPage();

  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  const source = sources[Math.floor(Math.random() * sources.length)];

  await page.setExtraHTTPHeaders({
    "User-Agent": userAgent,
    Referer: source,
  });

  const startTime = Date.now();

  await page.goto("https://splendid-line-152947.framer.app/");

  // Wait for the page to be fully loaded
  await page.waitForLoadState("networkidle");

  const loadTime = Date.now() - startTime;

  await context.close();

  return { testId, loadTime, userAgent, source };
}

function parseTime(timeString) {
  const match = timeString.match(/(\d+)(s|m)/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    return unit === "s" ? value * 1000 : value * 60 * 1000;
  }
  throw new Error(`Invalid time format: ${timeString}`);
}

async function runLoadTest() {
  const browser = await chromium.launch();
  const results = [];
  let testId = 0;

  console.log(`Start load test with ${TOTAL_REQUESTS} requests`);

  const totalDuration = stages.reduce(
    (sum, stage) => sum + parseTime(stage.duration),
    0
  );
  const requestsPerMs = TOTAL_REQUESTS / totalDuration;

  for (const stage of stages) {
    const stageDuration = parseTime(stage.duration);
    const stageStartTime = Date.now();
    const stageRequests = Math.round(stageDuration * requestsPerMs);

    console.log(
      `Stage: ${stage.duration} - Target: ${stage.target} users, Requests: ${stageRequests}`
    );

    const stagePromises = [];
    for (let i = 0; i < stageRequests; i++) {
      const delay = (i / stageRequests) * stageDuration;
      stagePromises.push(
        new Promise((resolve) => setTimeout(resolve, delay))
          .then(() => runTest(browser, testId++))
          .then((result) => results.push(result))
      );
    }

    await Promise.all(stagePromises);

    // Wait for the stage duration if it finished early
    const stageElapsed = Date.now() - stageStartTime;
    if (stageElapsed < stageDuration) {
      await new Promise((resolve) =>
        setTimeout(resolve, stageDuration - stageElapsed)
      );
    }
  }

  await browser.close();

  // Calculate and print statistics
  const totalTests = results.length;
  const totalLoadTime = results.reduce(
    (sum, result) => sum + result.loadTime,
    0
  );
  const averageLoadTime = totalLoadTime / totalTests;
  const maxLoadTime = Math.max(...results.map((result) => result.loadTime));
  const minLoadTime = Math.min(...results.map((result) => result.loadTime));

  console.log(`Load test completed. Total requests made: ${totalTests}`);
  console.log(`Average load time: ${averageLoadTime.toFixed(2)}ms`);
  console.log(`Max load time: ${maxLoadTime}ms`);
  console.log(`Min load time: ${minLoadTime}ms`);

  // You can add more detailed statistics or save results to a file if needed
}

runLoadTest().catch(console.error);
