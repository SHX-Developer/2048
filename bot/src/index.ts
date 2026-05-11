import { Bot, InlineKeyboard } from 'grammy';

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is required');
  process.exit(1);
}
if (!WEB_APP_URL) {
  console.error('WEB_APP_URL is required');
  process.exit(1);
}
if (!/^https:\/\//i.test(WEB_APP_URL)) {
  console.error('WEB_APP_URL must be an https:// URL (Telegram requirement)');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name ?? 'игрок';
  const keyboard = new InlineKeyboard().webApp('🎮 Играть в 2048', WEB_APP_URL);

  await ctx.reply(
    `Привет, ${name}! 👋\n\n` +
      'Это классическая игра 2048 в формате Telegram Mini App. ' +
      'Свайпай плитки, объединяй одинаковые и попробуй собрать заветную 2048.\n\n' +
      'Нажми кнопку ниже, чтобы начать игру.',
    { reply_markup: keyboard },
  );
});

bot.catch((err) => {
  console.error('Bot error while handling update', err.ctx?.update?.update_id, err.error);
});

const stop = async (signal: string) => {
  console.log(`Received ${signal}, stopping bot...`);
  await bot.stop();
};
process.once('SIGINT', () => void stop('SIGINT'));
process.once('SIGTERM', () => void stop('SIGTERM'));

bot.start({
  drop_pending_updates: true,
  onStart: ({ username }) => console.log(`Bot @${username} started (long polling)`),
});
