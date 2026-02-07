# express-watchdog

A lightweight, zero-dashboard monitoring helper for Express applications. Keep an eye on your APIs and get alerted when things go slow or the server crashes—all without any complex setup!

## Features
- **Auto-pilot Monitoring:** Automatically detects slow API responses.
- **Crash Protection:** Listens for process-level errors and unhandled rejections.
- **Customizable Actions:** Attach your own logic (logging, Slack, Webhooks) when alerts trigger.
- **Built-in Emailing:** Seamlessly send Gmail alerts to you and your team (CC supported).
- **Clear Reports:** Beautifully structured `WHERE–WHAT–WHEN` formats.
- **Safe & Minimal:** Zero impact on your app's performance and minimal dependencies.

## Installation

```bash
npm install express-watchdog
```

## Basic Usage

Getting started is as simple as adding a few lines to your Express app:

```js
const express = require("express");
const monitor = require("express-watchdog");

const app = express();

monitor(app, {
  slowThresholdMs: 2000,
  alertEmail: process.env.ALERT_EMAIL,
  ccEmail: process.env.CC_EMAIL,
  appPassword: process.env.EMAIL_APP_PASSWORD
});

app.listen(3000);
```

## Custom Functions (Powerful & Flexible!)

Want to send alerts to Slack, log to a database, or trigger a webhook? You can easily attach your own handlers!

When you provide `onSlow` or `onCrash`, **express-watchdog** will call your function instead of sending the default email.

```js
monitor(app, {
  slowThresholdMs: 2000,
  // Your custom logic here!
  onSlow: async ({ where, what, when, path, duration }) => {
    console.log(`Slow API detected at ${path}! Took ${duration}ms.`);
    // Add your Slack integration or database logging here
  },
  onCrash: async ({ where, what, when, message, stack }) => {
    console.error(`Critical Error: ${message}`);
    // Handle the crash gracefully or notify your dev team
  }
});
```

## Email Configuration (Optional)
If you don't provide custom handlers, the watchdog defaults to sending emails via Gmail.

Recommended Environment Variables:
```env
ALERT_EMAIL=yourgmail@gmail.com
CC_EMAIL=team@example.com
EMAIL_APP_PASSWORD=your-app-password
```

## How It Works
1. **Performance Tracking:** Wraps Express requests to measure exactly how long they take.
2. **Process Monitoring:** Hooks into `uncaughtException` and `unhandledRejection`.
3. **Smart Alerting:** Triggers your custom functions or sends a detailed email with full context.

## License
ISC

