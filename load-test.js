import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = "https://splendid-line-152947.framer.app/";

// List of user agents to rotate through
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
];

export let options = {
  stages: [
    { duration: "30s", target: 20 }, // Ramp up to 20 users over 30 seconds
    { duration: "1m", target: 20 }, // Stay at 20 users for 1 minute
    { duration: "30s", target: 50 }, // Ramp up to 50 users over 30 seconds
    { duration: "1m", target: 50 }, // Stay at 50 users for 1 minute
    { duration: "30s", target: 0 }, // Ramp down to 0 users over 30 seconds
  ],
};

export default function () {
  // Randomly select a user agent
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

  // Set up the request parameters
  const params = {
    headers: {
      "User-Agent": userAgent,
    },
  };

  // Make the request
  let res = http.get(BASE_URL, params);

  // Check that the response is successful
  check(res, {
    "is status 200": (r) => r.status === 200,
    "transaction time < 500ms": (r) => r.timings.duration < 500,
  });

  // Wait between 1 and 5 seconds before the next request
  sleep(Math.random() * 4 + 1);
}
