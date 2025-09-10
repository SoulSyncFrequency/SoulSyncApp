import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/healthz", (_req, res) => {
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
