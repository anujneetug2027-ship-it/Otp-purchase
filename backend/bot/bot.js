import TelegramBot from "node-telegram-bot-api";
import { APPS, SERVERS } from "./constants.js";
import { requestNumber, checkOtp, cancelNumber } from "./services.js";
import { startTimer, stopTimer } from "./timers.js";

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });

const state = {};

/* START */
bot.onText(/\/start/, (msg) => {
  const id = msg.chat.id;
  state[id] = {};
  bot.sendMessage(id, "Select app:", {
    reply_markup: {
      inline_keyboard: APPS.map(a => [
        { text: a.label, callback_data: `app:${a.key}` }
      ])
    }
  });
});

/* CALLBACK HANDLER */
bot.on("callback_query", async (q) => {
  const id = q.message.chat.id;
  const data = q.data;

  if (!state[id]) state[id] = {};

  /* APP SELECT */
  if (data.startsWith("app:")) {
    state[id].app = data.split(":")[1];

    bot.sendMessage(id, "Select server:", {
      reply_markup: {
        inline_keyboard: SERVERS.map(s => [
          { text: s.label, callback_data: `server:${s.id}` }
        ])
      }
    });
  }

  /* SERVER SELECT */
  if (data.startsWith("server:")) {
    state[id].server = data.split(":")[1];

    const res = await requestNumber(state[id].app, state[id].server);
    state[id].orderId = res.orderId;

    bot.sendMessage(
      id,
      `📱 Number allocated:\n${res.number}\n\nWaiting for OTP...`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "❌ Cancel", callback_data: "cancel" }]
          ]
        }
      }
    );

    startTimer(id, bot, async () => {
      await cancelNumber(state[id].orderId);
      bot.sendMessage(id, "⏱️ Time expired. Number released.");
    });
  }

  /* CANCEL */
  if (data === "cancel") {
    stopTimer(id);
    await cancelNumber(state[id].orderId);
    bot.sendMessage(id, "❌ Number cancelled.");
  }
});
