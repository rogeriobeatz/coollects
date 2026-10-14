import { defineConfig } from '@playwright/test'
export default defineConfig({
 testDir:'./e2e',
 testMatch:'**/*.pw.ts',
 retries:1,
 timeout:30000,
 workers:1,
 use:{
  baseURL:'http://127.0.0.1:3202',
  browserName:'chromium',
  headless:true,
  serviceWorkers:'block',
  trace:'retain-on-failure',
  screenshot:'only-on-failure'
 }
})
