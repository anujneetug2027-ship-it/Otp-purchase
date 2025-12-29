
console.log("🔥 server.js is being executed");

import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Server alive");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("✅ Listening on port", PORT);
});
