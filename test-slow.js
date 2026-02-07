const express = require("express");
const monitor = require("./index");

const app = express();

// Configure monitor with custom handler to verify it's called
monitor(app, {
    slowThresholdMs: 1000,
    alertEmail: "test@example.com",
    appPassword: "fake-password",
    onSlow: async (info) => {
        console.log("--- TEST ON_SLOW TRIGGERED ---");
        console.log(JSON.stringify(info, null, 2));
        console.log("------------------------------");
    }
});

app.get("/slow", async (req, res) => {
    console.log("Request to /slow started");
    await new Promise(resolve => setTimeout(resolve, 1500));
    res.send("This was slow");
});

app.get("/fast", (req, res) => {
    res.send("This was fast");
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
    console.log("Trigger a slow request: curl http://localhost:3001/slow");
    console.log("Trigger a fast request: curl http://localhost:3001/fast");
});
