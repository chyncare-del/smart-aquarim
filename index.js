const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Smart Aquarium Running");
});

app.post("/webhook", (req, res) => {
  console.log(req.body);
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log("Server running");
});
