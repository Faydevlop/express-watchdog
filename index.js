const nodemailer = require("nodemailer");

/**
 * Monitors an Express application for slow APIs and server crashes.
 * 
 * @param {import('express').Application} app - The Express application instance.
 * @param {Object} options - Configuration options.
 * @param {number} [options.slowThresholdMs=2000] - Threshold for slow API detection in milliseconds.
 * @param {string} options.alertEmail - Sender email address (Gmail).
 * @param {string|string[]} [options.ccEmail] - CC email address or array of addresses.
 * @param {string} options.appPassword - Gmail App Password for authentication.
 * @param {Function} [options.onSlow] - Custom handler for slow API alerts.
 * @param {Function} [options.onCrash] - Custom handler for crash alerts.
 */
module.exports = function monitor(app, options = {}) {
  const {
    slowThresholdMs = 2000,
    alertEmail,
    ccEmail,
    appPassword,
    onSlow,
    onCrash
  } = options;

  // --- Utility: Send Email ---
  const sendEmail = async (subject, body) => {
    try {
      if (!alertEmail || !appPassword) {
        console.warn("[express-watchdog] Missing alertEmail or appPassword. Default email alert skipped.");
        return;
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: alertEmail,
          pass: appPassword
        }
      });

      const mailOptions = {
        from: alertEmail,
        to: alertEmail,
        cc: ccEmail,
        subject: `[express-watchdog] Alert: ${subject}`,
        text: body
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("[express-watchdog] Failed to send email alert:", error.message);
    }
  };

  // --- 1. Detect Slow APIs Middleware ---
  app.use((req, res, next) => {
    try {
      const start = Date.now();

      // Listen for the response finish event
      res.on("finish", async () => {
        const duration = Date.now() - start;

        if (duration > slowThresholdMs) {
          const timestamp = new Date().toISOString();
          const payload = {
            path: req.path,
            method: req.method,
            duration,
            timestamp,
            where: req.path,
            what: "Slow API Response",
            when: timestamp
          };

          if (typeof onSlow === "function") {
            try {
              await onSlow(payload);
            } catch (err) {
              console.error("[express-watchdog] Error in custom onSlow handler:", err.message);
            }
          } else {
            const body = `
WHERE:
${payload.where}

WHAT:
${payload.what}

WHEN:
${payload.timestamp}

DETAILS:
- Path (if API): ${payload.path}
- Method (if API): ${payload.method}
- Duration (if slow API): ${payload.duration} ms
`;
            await sendEmail(payload.what, body.trim());
          }
        }
      });
    } catch (error) {
      console.error("[express-watchdog] Error in slow API middleware:", error.message);
    }
    next();
  });

  // --- 2. Detect Server Crash ---
  const handleCrash = async (error) => {
    try {
      const timestamp = new Date().toISOString();
      const payload = {
        message: error.message || "Unknown error",
        stack: error.stack || "No stack trace available",
        timestamp,
        where: "Node.js Process",
        what: "Server Crash / Unhandled Error",
        when: timestamp
      };

      if (typeof onCrash === "function") {
        try {
          await onCrash(payload);
        } catch (err) {
          console.error("[express-watchdog] Error in custom onCrash handler:", err.message);
        }
      } else {
        const body = `
WHERE:
${payload.where}

WHAT:
${payload.what}

WHEN:
${payload.timestamp}

DETAILS:
- Error Message (if crash): ${payload.message}
- Stack Trace (if crash):
${payload.stack}
`;
        await sendEmail(payload.what, body.trim());
      }
    } catch (err) {
      console.error("[express-watchdog] Error in crash handler:", err.message);
    }

    // Since it's a crash, we might want to log it and let the process die
    // or keep it alive if the user handles it. 
    // Usually, uncaughtException should lead to process exit after logging.
    // However, the requirement doesn't explicitly say to exit.
  };

  process.on("uncaughtException", async (error) => {
    await handleCrash(error);
    // Standard practice is to exit after logging uncaught exception
    // process.exit(1); 
  });

  process.on("unhandledRejection", async (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    await handleCrash(error);
  });
};
