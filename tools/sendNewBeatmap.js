const { powershell_sended_calc_start, powershell_set_filesize, powershell_sended_calc_end } = require('../display/powershell.js');

const { makeCaption } = require("./makeCaption.js");
const { sendImage, sendAudio, sendOsz } = require("./bot.js");
const { Megabyte } = require('../misc/consts.js');

require('colors');

async function sendNewBeatmap(beatmapset, lastfolder) {
    const {id, osz_filename, osz_file_buffer} = beatmapset;
    console.log('Данные карты будут отправлены на канал: ', id, '[');

    let caption;
    let caption_limit = 0;
    do {
        caption = makeCaption(beatmapset, caption_limit);
        caption_limit++;
    } while (typeof caption !== 'string');

    console.log(' * отправка бг', id);
    const photoMessage = await sendImage(`https://assets.ppy.sh/beatmaps/${id}/covers/raw.jpg`, caption);

    console.log(' * отправка превью', id);
    const previewMessage = sendAudio(`https://b.ppy.sh/preview/${id}.mp3`);

    console.log(' * отправка osz файла карты', osz_filename);

    const osz_file_size = osz_file_buffer.length / Megabyte;
    
    console.log(' * Размер карты:', osz_file_size.toFixed(2) + ' МБ');
    powershell_set_filesize(osz_file_size);

    powershell_sended_calc_start(osz_filename, lastfolder);

    const result = await sendOsz(beatmapset, {photoMessage, previewMessage});

    powershell_sended_calc_end();

    console.log(']');

    return result;
    
}
exports.sendNewBeatmap = sendNewBeatmap;
