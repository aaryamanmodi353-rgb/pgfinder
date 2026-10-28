import { defineConfig, devices } from "@playwright/test";
const baseURL = "http://127.0.0.1:3001";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: [
    {
      command: "npm run dev",
      url: "http://127.0.0.1:3000/api/v1/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev:web",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
