import TelegramBot from "node-telegram-bot-api";
import Coupon from "../models/Coupon.js";
import fetch from "node-fetch";

console.log("🤖 Starting Telegram bot");

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, {
  polling: true
});

// ================== CONFIG ==================
const OTP_API = "https://otpfather.xyz/stu";
const OTP_API_KEY = process.env.OTP_FATHER_KEY;

// ================== STATE ==================
const userState = {};

// ================== APPS ==================
const APPS = {
  magicpin: "magicpin",
  countrydelight: "countrydelight",
  bigbasket: "bigbasket"
};

// ================== SERVERS ==================
const SERVERS = {
  1: "Server 1",
  2: "Server 2",
  3: "Server 3",
  4: "Server 4",
  6: "Server 6",
  9: "Server 9",
  22: "Server 8",
  91: "Server 5"
};

// ================== /start ==================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  userState[chatId] = { step: "ASK_NAME" };

  bot.sendMessage(chatId, "👋 Welcome!\n\nPlease enter your name:");
});

// ================== MESSAGE HANDLER ==================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userState[chatId]) return;

  const state = userState[chatId];

  // ---------- NAME ----------
  if (state.step === "ASK_NAME") {
    state.name = text;
    state.step = "ASK_APP";

    return bot.sendMessage(chatId, "📱 Select app:", {
      reply_markup: {
        inline_keyboard: Object.keys(APPS).map((a) => [
          { text: a, callback_data: `app_${a}` }
        ])
      }
    });
  }

  // ---------- COUPON ----------
  if (state.step === "ASK_COUPON") {
    const code = text.trim();

    const coupon = await Coupon.findOne({ code });

    if (!coupon || coupon.used) {
      return bot.sendMessage(chatId, "❌ Invalid or already used coupon.\n\nTry again:");
    }

    // mark coupon used
    coupon.used = true;
    coupon.usedBy = chatId.toString();
    coupon.usedAt = new Date();
    await coupon.save();

    state.step = "REQUEST_NUMBER";

    bot.sendMessage(chatId, "✅ Coupon accepted!\n\nRequesting number...");

    return requestNumber(chatId);
  }
});

// ================== CALLBACK HANDLER ==================
bot.on("callback_query", async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;

  const state = userState[chatId];
  if (!state) return;

  // ---------- APP ----------
  if (data.startsWith("app_")) {
    state.app = data.replace("app_", "");
    state.step = "ASK_SERVER";

    return bot.sendMessage(chatId, "🌐 Select server:", {
      reply_markup: {
        inline_keyboard: Object.entries(SERVERS).map(([id, name]) => [
          { text: name, callback_data: `server_${id}` }
        ])
      }
    });
  }

  // ---------- SERVER ----------
  if (data.startsWith("server_")) {
    state.server = data.replace("server_", "");
    state.step = "ASK_COUPON";

    return bot.sendMessage(chatId, "🎟 Enter coupon code:");
  }

  // ---------- CANCEL ----------
  if (data === "cancel") {
    if (state.orderId) {
      await fetch(
        `${OTP_API}?api_key=${OTP_API_KEY}&action=setStatus&id=${state.orderId}&status=8`
      );
    }

    delete userState[chatId];
    return bot.sendMessage(chatId, "❌ Number cancelled.");
  }
});

// ================== REQUEST NUMBER ==================
async function requestNumber(chatId) {
  const state = userState[chatId];

  const res = await fetch(
    `${OTP_API}?api_key=${OTP_API_KEY}&action=getNumber&service=${state.app}&server=${state.server}`
  );

  const text = await res.text();

  if (!text.startsWith("ACCESS_NUMBER")) {
    return bot.sendMessage(chatId, "❌ No numbers available.");
  }

  const [, orderId, number] = text.split(":");

  state.orderId = orderId;

  bot.sendMessage(
    chatId,
    `📞 Number allocated:\n${number}\n\n⏳ Waiting for OTP (5 min)...`,
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "❌ Cancel", callback_data: "cancel" }]
        ]
      }
    }
  );

  startOtpPolling(chatId);
}

// ================== OTP POLLING ==================
function startOtpPolling(chatId) {
  const state = userState[chatId];
  let attempts = 0;

  const interval = setInterval(async () => {
    attempts++;

    if (attempts > 30) {
      clearInterval(interval);
      bot.sendMessage(chatId, "⌛ OTP timeout.");
      return;
    }

    const res = await fetch(
      `${OTP_API}?api_key=${OTP_API_KEY}&action=getStatus&id=${state.orderId}`
    );

    const text = await res.text();

    if (text.startsWith("STATUS_OK")) {
      clearInterval(interval);
      const otp = text.split(":")[1];
      bot.sendMessage(chatId, `✅ OTP received:\n\n${otp}`);
      delete userState[chatId];
    }
  }, 10000);
}

console.log("✅ Telegram polling started");
