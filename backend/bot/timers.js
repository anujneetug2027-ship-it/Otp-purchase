const timers = {};

export function startTimer(chatId, bot, onExpire) {
  stopTimer(chatId);

  timers[chatId] = setTimeout(() => {
    onExpire();
    delete timers[chatId];
  }, 5 * 60 * 1000);
}

export function stopTimer(chatId) {
  if (timers[chatId]) {
    clearTimeout(timers[chatId]);
    delete timers[chatId];
  }
}
