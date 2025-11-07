const dashboard = require('dashboard_framework');
const path = require('path');


const { makeCaption } = require("./makeCaption.js");
const { sendImage, sendAudio, sendOsz } = require("./bot.js");
const { Megabyte } = require('../misc/consts.js');
const { readFileSync } = require('fs-extra');

require('colors');

async function sendNewBeatmap(beatmapset) {

    const {id, osz_filename, osz_file_buffer} = beatmapset;
    console.log('Данные карты будут отправлены на канал: ', id, '[');

	// console.log('stop');
	// process.exit();

    let caption;
    let caption_limit = 0;
    do {
        caption = makeCaption(beatmapset, caption_limit);
        caption_limit++;
    } while (typeof caption !== 'string');

    await dashboard.change_status({name: 'action', status: 'send_desc'});

    console.log(' * отправка бг', id);
    const background_path = path.join('data', 'exported_beatmaps', beatmapset.foldername, beatmapset.background);
    const background_image = readFileSync(background_path);
    const photoMessage = await sendImage(background_image, caption);

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
