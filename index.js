const express = require("express");
const line = require("@line/bot-sdk");

const app = express();
const port = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

const ALLOW_USER_ID = process.env.ALLOW_USER_ID;
const SECRET_KEY = process.env.SECRET_KEY || "palm1234feed";

let pendingCommand = "";

// หน้าเช็คว่า server ติด
app.get("/", (req, res) => {
  res.status(200).send("Smart Aquarium Running");
});

// ให้ ESP32 มาอ่านคำสั่ง
app.get("/command", (req, res) => {
  const key = req.query.key || "";
  if (key !== SECRET_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  return res.status(200).json({
    ok: true,
    command: pendingCommand,
  });
});

// ให้ ESP32 ล้างคำสั่งหลังทำเสร็จ
app.get("/clear", (req, res) => {
  const key = req.query.key || "";
  if (key !== SECRET_KEY) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  pendingCommand = "";
  return res.status(200).json({
    ok: true,
    cleared: true,
  });
});

// LINE webhook
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      if (event.type !== "message") continue;
      if (event.message.type !== "text") continue;
      if (!event.source || event.source.userId !== ALLOW_USER_ID) continue;

      const text = String(event.message.text).trim().toLowerCase();

      if (text === "feed") {
        pendingCommand = "feed";
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: "text", text: "รับคำสั่งแล้ว: feed" }],
        });
      } else if (text === "status") {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `pendingCommand = ${pendingCommand || "none"}`,
            },
          ],
        });
      } else if (text === "clear") {
        pendingCommand = "";
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: "text", text: "ล้างคำสั่งแล้ว" }],
        });
      } else {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            { type: "text", text: "คำสั่งที่รองรับ: feed, status, clear" },
          ],
        });
      }
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(200).send("OK");
  }
});

app.listen(port, () => {
  console.log("Server running");
});
