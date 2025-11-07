const fs = require('node:fs');
const path = require('node:path');
const { exec } = require('node:child_process');

require('colors');
const TelegramBot = require('node-telegram-bot-api');
const dashboard = require('dashboard_framework');

const { keypress } = require('./keypress.js');

const { tg_token, osucharts, tg_bot_restart_after_error_ms, osusongs, messages_delay } = require('../data/config.js');
const { last_beatmap_path, error_log_path } = require('../misc/settings.js');

const no_bg_image = `https://www.peoples.ru/technics/programmer/dean_herbert/PH67uu7hlg6Ax.png`;

const bot = new TelegramBot(tg_token, { polling: true });

bot.on('polling_error', async (error) => {
    console.log('telegram no connection. restart');
    await new Promise(resolve => setTimeout(resolve, tg_bot_restart_after_error_ms));
    throw new Error('telegram no connection');
});

bot.on('message', (msg) => {
    bot.sendMessage(msg.chat.id, `иди на ${osucharts}`);
});;

async function sendMessage(text) {
	let res = null;
	try {
        res = await bot.sendMessage(osucharts, text);
    } catch (e) {
        console.log(' E ошибка сообщения'.red);
    }
	return res;
}

async function sendImage(image, caption){
    var photoMessage;
    try {
        photoMessage = await bot.sendPhoto(osucharts, image, { caption: caption, disable_notification: true });
    } catch (e) {
        console.log(' E нет бг'.red);
        photoMessage = await bot.sendPhoto(osucharts, no_bg_image, { caption: caption, disable_notification: true });
    }
    await new Promise(res=>setTimeout(res, messages_delay));
    return photoMessage;
}

async function sendAudio(url){
    var previewMessage;
    try {
        previewMessage = await bot.sendAudio(osucharts, url, {disable_notification: true});
    } catch (e) {
        console.log(' E невозможно отправить превью'.red);
        previewMessage = false;
    }
    await new Promise(res=>setTimeout(res, messages_delay));
    return previewMessage;
}

async function sendOsz(beatmapset, beatmap_message) {
    const {id, foldername, osz_filename, osz_file_buffer } = beatmapset;
    try {
        await bot.sendDocument(osucharts, osz_file_buffer, {disable_notification: true}, { contentType: 'x-osu-beatmap-archive', filename: osz_filename });
        fs.writeFileSync(last_beatmap_path, foldername, { encoding: 'utf-8' });
        await dashboard.change_status({name: 'action', status: 'waiting'});
        await new Promise(res=>setTimeout(res, messages_delay));
        return true;
    } catch (e) {
        console.log(' E невозможно отправить карту'.red, id);        
        const absolute_folder_path = path.join(osusongs, foldername);

        fs.appendFileSync(error_log_path, `${absolute_folder_path}\n${e.toString()}\n` )

        exec(`explorer.exe "${absolute_folder_path}"`);
        
        await keypress('press any key')

        await new Promise(resolve => setTimeout(resolve, tg_bot_restart_after_error_ms));
        return false;
    }
    
}

exports.sendImage = sendImage;
exports.sendAudio = sendAudio;
exports.sendOsz = sendOsz;
exports.sendMessage = sendMessage;