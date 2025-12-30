import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";

const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const API = "https://otp-purchase.onrender.com";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const userState = {};

/* /start */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: "name" };

  bot.sendMessage(chatId, "👋 Welcome!\nPlease enter your name:");
});

/* Handle messages */
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!userState[chatId]) return;

  if (userState[chatId].step === "name") {
    userState[chatId].name = msg.text;
    userState[chatId].step = "coupon";

    bot.sendMessage(chatId, "🔑 Enter your coupon code:");
    return;
  }

  if (userState[chatId].step === "coupon") {
    const coupon = msg.text;

    try {
      const res = await fetch(`${API}/bot/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: chatId,
          name: userState[chatId].name,
          coupon
        })
      });

      const data = await res.json();

      if (!res.ok) {
        bot.sendMessage(chatId, "❌ Invalid coupon. Try again.");
        return;
      }

      userState[chatId].step = "done";

      bot.sendMessage(
        chatId,
        "✅ Coupon verified!\n\nNext step:\nSelect app → server → get number (coming next 🚀)"
      );
    } catch (err) {
      bot.sendMessage(chatId, "⚠️ Server error. Try later.");
    }
  }
});
