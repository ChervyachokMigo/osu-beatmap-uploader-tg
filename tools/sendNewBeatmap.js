const dashboard = require('dashboard_framework');

const { makeCaption } = require("./makeCaption.js");
const { sendImage, sendAudio, sendOsz } = require("./bot.js");
const { Megabyte } = require('../misc/consts.js');

require('colors');

async function sendNewBeatmap(beatmapset) {
    const {id, osz_filename, osz_file_buffer} = beatmapset;
    console.log('Данные карты будут отправлены на канал: ', id, '[');

    let caption;
    let caption_limit = 0;
    do {
        caption = makeCaption(beatmapset, caption_limit);
        caption_limit++;
    } while (typeof caption !== 'string');

    await dashboard.change_status({name: 'action', status: 'send_desc'});
    console.log(' * отправка бг', id);
    const photoMessage = await sendImage(`https://assets.ppy.sh/beatmaps/${id}/covers/raw.jpg`, caption);

    await dashboard.change_status({name: 'action', status: 'send_preview'});
    console.log(' * отправка превью', id);
    const previewMessage = await sendAudio(`https://b.ppy.sh/preview/${id}.mp3`);

    await dashboard.change_status({name: 'action', status: 'send_osz'});
    console.log(' * отправка osz файла карты', osz_filename);

    const osz_file_size = osz_file_buffer.length / Megabyte;
    
    console.log(' * Размер карты:', osz_file_size.toFixed(2) + ' МБ');

    const result = await sendOsz(beatmapset, {photoMessage, previewMessage});

    console.log(']');

    return result;
    
}
exports.sendNewBeatmap = sendNewBeatmap;
