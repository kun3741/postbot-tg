const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');

// Вкажіть свій токен
const token = `${process.env.TELEGRAM_TOKEN}`;
// Вкажіть ID каналу
const channelId = '@your_channel_id';

const bot = new TelegramBot(token, { polling: true });

let posts = {};

// Обробка тексту, фото та відео
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (!posts[chatId]) {
        posts[chatId] = { text: '', media: [] };
    }

    if (msg.text && !msg.photo && !msg.video) {
        posts[chatId].text = msg.text;
    }

    if (msg.photo) {
        posts[chatId].media.push({ type: 'photo', media: msg.photo[msg.photo.length - 1].file_id });
    }

    if (msg.video) {
        posts[chatId].media.push({ type: 'video', media: msg.video.file_id });
    }

    bot.sendMessage(chatId, 'Введіть час у форматі ДЕНЬ.МІСЯЦЬ.РІК ГОДИНА:ХВИЛИНА для публікації поста.');
});

bot.onText(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/, (msg, match) => {
    const chatId = msg.chat.id;

    if (!posts[chatId] || (!posts[chatId].text && posts[chatId].media.length === 0)) {
        return bot.sendMessage(chatId, 'Спочатку надішліть текст і/або медіафайли.');
    }

    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    const hour = parseInt(match[4]);
    const minute = parseInt(match[5]);

    const date = new Date(year, month, day, hour, minute);

    schedule.scheduleJob(date, () => {
        const post = posts[chatId];
        const media = post.media;

        if (media.length > 0) {
            if (post.text) {
                media[0].caption = post.text;
            }
            bot.sendMediaGroup(channelId, media)
                .catch((error) => {
                    console.error('Failed to send media group:', error);
                });
        } else {
            bot.sendMessage(channelId, post.text)
                .catch((error) => {
                    console.error('Failed to send message:', error);
                });
        }
    });

    bot.sendMessage(chatId, 'Ваш пост буде опублікований ' + date.toString());
    delete posts[chatId];
});

console.log('Бот запущений...');
