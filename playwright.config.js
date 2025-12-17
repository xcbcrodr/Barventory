const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/ui',
    timeout: 30000,
    retries: 0,
    use: {
        headless: false,
        launchOptions: {
            slowMo: 1000   
        },
        baseURL: 'http://localhost:3000',
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
});