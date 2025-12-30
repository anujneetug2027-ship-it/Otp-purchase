import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import Coupon from "../models/Coupon.js";

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });

/* =====================================================
   USER STATE (IN-MEMORY)
===================================================== */
const userState = {};

/* =====================================================
   CONFIG — YOU EDIT ONLY THESE
===================================================== */

/*
  🔴 PUT YOUR OTPFATHER SERVER-LIST API HERE
  Example (you paste):
  https://otpfather.xyz/api?action=getServers&service={APP}

  IMPORTANT:
  - Must return JSON
  - Must include availability per server
*/
const SERVER_API_URL = process.env.OTPFATHER_SERVER_API;

/* =====================================================
   /start
===================================================== */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  userState[chatId] = {
    step: "WAITING_COUPON"
  };

  bot.sendMessage(chatId, "👋 Welcome!\n\nEnter your coupon code:");
});

/* =====================================================
   TEXT MESSAGE HANDLER
===================================================== */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!userState[chatId]) return;

  /* ---------- COUPON STEP ---------- */
  if (userState[chatId].step === "WAITING_COUPON") {
    const coupon = await Coupon.findOne({ code: text?.toUpperCase() });

    if (!coupon) {
      return bot.sendMessage(chatId, "❌ Invalid coupon.\nTry again:");
    }

    userState[chatId] = {
      step: "WAITING_APP",
      coupon: coupon.code
    };

    return bot.sendMessage(chatId, "✅ Coupon verified!\n\nSelect app:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Magicpin", callback_data: "app_magicpin" }],
          [{ text: "Country Delight", callback_data: "app_countrydelight" }],
          [{ text: "BigBasket", callback_data: "app_bigbasket" }]
        ]
      }
    });
  }
});

/* =====================================================
   INLINE BUTTON HANDLER
===================================================== */
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (!userState[chatId]) return;

  /* ---------- APP SELECT ---------- */
  if (data.startsWith("app_")) {
    const app = data.replace("app_", "");

    userState[chatId].app = app;

    bot.sendMessage(chatId, "🔄 Fetching available servers...");

    try {
      /* ===============================
         🔴 REAL FETCH (YOU CONTROL API)
      =============================== */
      const res = await fetch(
        SERVER_API_URL.replace("{APP}", app)
      );

      const json = await res.json();

      /*
        EXPECTED JSON FORMAT (example):
        {
          "servers": [
            { "id": 1, "name": "Server 1", "available": true },
            { "id": 2, "name": "Server 2", "available": false }
          ]
        }
      */

      const availableServers = json.servers?.filter(
        (s) => s.available === true
      );

      if (!availableServers || availableServers.length === 0) {
        return bot.sendMessage(
          chatId,
          "❌ No servers available for this app right now."
        );
      }

      return bot.sendMessage(chatId, "🟢 Available servers:", {
        reply_markup: {
          inline_keyboard: availableServers.map((s) => [
            {
              text: s.name,
              callback_data: `server_${s.id}`
            }
          ])
        }
      });
    } catch (err) {
      console.error("Server fetch error:", err.message);
      return bot.sendMessage(
        chatId,
        "⚠️ Failed to fetch server list. Try later."
      );
    }
  }

  /* ---------- SERVER SELECT ---------- */
  if (data.startsWith("server_")) {
    const serverId = data.replace("server_", "");

    bot.sendMessage(
      chatId,
      `✅ Server ${serverId} selected.\n\n(Flow ends here)`
    );

    delete userState[chatId];
  }
});

console.log("🤖 Telegram bot started (coupon → app → available servers)");
