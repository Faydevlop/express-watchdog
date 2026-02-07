const express = require("express");
const monitor = require("./index");

const app = express();

// Configure monitor without onCrash to verify default alerting logic (logs if credentials missing)
monitor(app, {
    alertEmail: "test@example.com",
    appPassword: "fake-password"
});

app.get("/crash", (req, res) => {
    console.log("Triggering uncaught exception...");
    throw new Error("BOOM! Server crashed.");
});

app.get("/reject", (req, res) => {
    console.log("Triggering unhandled rejection...");
    Promise.reject(new Error("REJECTED! Unhandled promise rejection."));
    res.send("Rejection triggered");
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log("Trigger an uncaught exception: curl http://localhost:3002/crash");
    console.log("Trigger an unhandled rejection: curl http://localhost:3002/reject");
});
