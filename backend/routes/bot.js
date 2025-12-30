import TelegramBot from "node-telegram-bot-api";
import Coupon from "../models/Coupon.js";

const BOT_TOKEN = process.env.TG_BOT_TOKEN; // use TG_BOT_TOKEN
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

/* ============================
   TEMP IN-MEMORY USER STATE
============================ */
const userState = {};

/* ============================
   SERVER MAP (MANUAL FOR NOW)
============================ */
const SERVER_MAP = {
  magicpin: [
    { id: 1, name: "Server 1", available: true },
    { id: 2, name: "Server 2", available: false },
    { id: 3, name: "Server 3", available: true }
  ],
  countrydelight: [
    { id: 6, name: "Server 6", available: true },
    { id: 9, name: "Server 9", available: true }
  ],
  bigbasket: [
    { id: 22, name: "Server 8", available: false },
    { id: 91, name: "Server 5", available: true }
  ]
};

/* ============================
   /start COMMAND
============================ */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  userState[chatId] = { step: "WAITING_COUPON" };

  bot.sendMessage(chatId, "👋 Welcome!\n\nPlease enter your coupon code:");
});

/* ============================
   HANDLE TEXT MESSAGES
============================ */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userState[chatId]) return;

  // STEP 1: COUPON CHECK
  if (userState[chatId].step === "WAITING_COUPON") {
    try {
      const coupon = await Coupon.findOne({ couponCode: text });

      if (!coupon) {
        bot.sendMessage(chatId, "❌ Invalid coupon code.\nTry again:");
        return;
      }

      userState[chatId] = {
        step: "WAITING_APP",
        coupon: text
      };

      bot.sendMessage(chatId, "✅ Coupon accepted!\n\nSelect app:", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Magicpin", callback_data: "app_magicpin" }],
            [{ text: "Country Delight", callback_data: "app_countrydelight" }],
            [{ text: "BigBasket", callback_data: "app_bigbasket" }]
          ]
        }
      });
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "⚠️ Server error. Try later.");
    }
  }
});

/* ============================
   HANDLE INLINE BUTTONS
============================ */
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // APP SELECTED
  if (data.startsWith("app_")) {
    const app = data.replace("app_", "");

    const servers = SERVER_MAP[app]?.filter(s => s.available);

    if (!servers || servers.length === 0) {
      bot.sendMessage(chatId, "❌ No servers available for this app.");
      return;
    }

    bot.sendMessage(chatId, `🟢 Available servers for ${app}:`, {
      reply_markup: {
        inline_keyboard: servers.map(s => [
          { text: s.name, callback_data: `server_${s.id}` }
        ])
      }
    });
  }

  // SERVER SELECTED (FINAL STEP)
  if (data.startsWith("server_")) {
    const serverId = data.replace("server_", "");

    bot.sendMessage(
      chatId,
      `✅ Server ${serverId} selected.\n\n(Flow ends here as requested)`
    );

    delete userState[chatId]; // reset user
  }
});

export default bot;
