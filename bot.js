const TelegramBot = require('node-telegram-bot-api');
const { tg_token, osucharts, tg_bot_restart_after_error_ms, osusongs } = require('./config.js');
var colors = require('colors');
const { MYSQL_SAVE, sended_map_db } = require('./DB.js');
const fs = require('fs');

const { exec } = require('child_process');
const { keypress } = require('./keypress.js');

const no_bg_image = `https://www.peoples.ru/technics/programmer/dean_herbert/PH67uu7hlg6Ax.png`;

const bot = new TelegramBot(tg_token, { polling: true });

bot.on('polling_error', async (error) => {
    console.log('telegram no connection. restart');
    await new Promise(resolve => setTimeout(resolve, tg_bot_restart_after_error_ms));
    throw new Error('telegram no connection');
});

bot.on('message', (msg) => {
    bot.sendMessage(msg.chat.id, `иди на ${osucharts}`);
});

async function sendImage(url, caption){
    var photoMessage;
    try {
        photoMessage = await bot.sendPhoto(osucharts, url, { caption: caption });
    } catch (e) {
        console.log(' E нет бг'.red);
        photoMessage = await bot.sendPhoto(osucharts, no_bg_image, { caption: caption });
    }
    await new Promise(res=>setTimeout(res, 3000));
    return photoMessage;
}

async function sendAudio(url){
    var previewMessage;
    try {
        previewMessage = await bot.sendAudio(osucharts, url);
    } catch (e) {
        console.log(' E невозможно отправить превью'.red);
        previewMessage = false;
    }
    await new Promise(res=>setTimeout(res, 3000));
    return previewMessage;
}

async function sendOsz(beatmapset, beatmap_message) {
    try {
        await bot.sendDocument(osucharts, beatmapset.osz_file_buffer, {}, { contentType: 'x-osu-beatmap-archive', filename: beatmapset.osz_filename });
        fs.writeFileSync('lastbeatmap.txt', beatmapset.localfolder, { encoding: 'utf-8' });
        return true;
    } catch (e) {
        console.log(' E невозможно отправить карту'.red, beatmapset.id);        
        let absolute_folder_path = `${osusongs}\\${beatmapset.localfolder}`.replaceAll('/','\\');

        fs.appendFileSync('error_file.txt', absolute_folder_path + '\n')
        fs.appendFileSync('error_file.txt', e.toString() + '\n')

        exec(`explorer.exe "${absolute_folder_path}"`);
        
        await keypress('press any key')

        await new Promise(resolve => setTimeout(resolve, tg_bot_restart_after_error_ms));
        return false;
    }
    await new Promise(res=>setTimeout(res, 3000));
}

exports.sendImage = sendImage;
exports.sendAudio = sendAudio;
exports.sendOsz = sendOsz;