const express = require("express");
const cheerio = require("cheerio");

const app = express();

// Cache duration in seconds (12 hours = 43200 seconds)
const CACHE_DURATION = 43200;

// Get the proxy URL from environment variable
const PROXY_URL =
  process.env.PROXY_URL || "https://splendid-line-152947.framer.app";

app.use(async (req, res) => {
  try {
    // Construct the URL to fetch
    const url = new URL(req.url, PROXY_URL).toString();

    // Fetch the content
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");

    // Set cache headers
    res.setHeader(
      "Cache-Control",
      `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`
    );

    // If it's HTML, process it
    if (contentType && contentType.includes("text/html")) {
      let html = await response.text();

      // Parse the HTML
      const $ = cheerio.load(html);

      // Remove the element with id __framer-badge-container
      $("#__framer-badge-container").remove();

      // Send the modified HTML
      res.setHeader("Content-Type", "text/html");
      res.send($.html());
    } else {
      // For non-HTML
      console.log("Fetched non html element", url);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 8888;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Proxying to: ${PROXY_URL}`);
  });
}

module.exports = app;
