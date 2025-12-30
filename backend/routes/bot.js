import axios from "axios";
import { Telegraf, Markup } from "telegraf";

/* =======================
   ENV
======================= */
const BOT_TOKEN = process.env.TG_BOT_TOKEN; // or BOT_TOKEN (your choice)
const OTPFATHER_KEY = process.env.OTPFATHER_API_KEY;

const bot = new Telegraf(BOT_TOKEN);

/* =======================
   TEMP MEMORY (SIMPLE)
======================= */
const userState = {}; // chatId -> state

/* =======================
   CONSTANTS
======================= */
const OTP_API = "https://otpfather.xyz/stu";

// Static apps (map to OTPfather service codes)
const APPS = {
  "BigBasket": "bb",
  "Country Delight": "countrydelight"
};

/* =======================
   START
======================= */
bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  userState[chatId] = { step: "name" };

  await ctx.reply("👋 Welcome!\n\nPlease enter your name:");
});

/* =======================
   TEXT HANDLER
======================= */
bot.on("text", async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text;

  if (!userState[chatId]) return;

  /* STEP 1: NAME */
  if (userState[chatId].step === "name") {
    userState[chatId].name = text;
    userState[chatId].step = "coupon";

    return ctx.reply("🔑 Enter your coupon code:");
  }

  /* STEP 2: COUPON */
  if (userState[chatId].step === "coupon") {
    userState[chatId].coupon = text;
    userState[chatId].step = "app";

    return ctx.reply(
      "📱 Select App:",
      Markup.keyboard(Object.keys(APPS)).resize()
    );
  }

  /* STEP 3: APP */
  if (userState[chatId].step === "app") {
    if (!APPS[text]) {
      return ctx.reply("❌ Invalid app. Select from buttons.");
    }

    userState[chatId].appName = text;
    userState[chatId].service = APPS[text];
    userState[chatId].step = "server";

    await ctx.reply("🔄 Fetching servers...");

    return sendAllServers(ctx);
  }
});

/* =======================
   SEND ALL SERVERS (OPTION A)
======================= */
async function sendAllServers(ctx) {
  try {
    const res = await axios.get(
      `${OTP_API}?api_key=${OTPFATHER_KEY}&action=getServers`
    );

    const lines = res.data.split("\n");

    const buttons = lines
      .filter((l) => l.includes(":"))
      .map((l) => {
        const [id, name] = l.split(":").map((x) => x.trim());
        return Markup.button.callback(name, `server_${id}`);
      });

    if (!buttons.length) {
      return ctx.reply("❌ No servers returned by API.");
    }

    await ctx.reply(
      "🌍 Select any server (availability will be checked next):",
      Markup.inlineKeyboard(buttons, { columns: 2 })
    );
  } catch (err) {
    console.error(err.message);
    ctx.reply("❌ Failed to fetch servers.");
  }
}

/* =======================
   SERVER SELECTION
======================= */
bot.action(/server_(.+)/, async (ctx) => {
  const chatId = ctx.chat.id;
  const serverId = ctx.match[1];

  const service = userState[chatId]?.service;
  if (!service) return;

  await ctx.answerCbQuery();
  await ctx.reply("⏳ Checking availability...");

  try {
    const res = await axios.get(
      `${OTP_API}?api_key=${OTPFATHER_KEY}&action=getNumber&service=${service}&server=${serverId}`
    );

    const data = res.data;

    if (data.startsWith("ACCESS_NUMBER")) {
      const parts = data.split(":");
      const number = parts[2];

      return ctx.reply(
        `✅ Server AVAILABLE!\n\n📞 Number: ${number}\n🖥 Server: ${serverId}`
      );
    }

    if (data.includes("NO_NUMBERS")) {
      return ctx.reply("❌ No numbers on this server.\nTry another server.");
    }

    if (data.includes("NO_BALANCE")) {
      return ctx.reply("❌ API balance exhausted.");
    }

    return ctx.reply("⚠️ Unexpected response:\n" + data);
  } catch (err) {
    console.error(err.message);
    ctx.reply("❌ Error checking server.");
  }
});

/* =======================
   START BOT
======================= */
bot.launch();
console.log("🤖 Telegram bot started");

/* =======================
   GRACEFUL STOP
======================= */
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
