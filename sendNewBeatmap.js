const { powershell_sended_calc_start, powershell_set_filesize, powershell_sended_calc_end } = require('./powershell.js');

const { makeCaption } = require("./makeCaption");
const { sendImage, sendAudio, sendOsz } = require("./bot");

var colors = require('colors');
const { keypress } = require('./keypress.js');

async function sendNewBeatmap(beatmapset, lastfolder) {
    console.log('Данные карты будут отправлены на канал: ', beatmapset.id, '[');

    var caption;
    var caption_limit = 0;
    do {
        caption = makeCaption(beatmapset, caption_limit);
        caption_limit++;
    } while (typeof caption !== 'string');

    console.log(' * отправка бг', beatmapset.id);
    var photoMessage = await sendImage(`https://assets.ppy.sh/beatmaps/${beatmapset.id}/covers/raw.jpg`, caption);

    console.log(' * отправка превью', beatmapset.id);
    var previewMessage = sendAudio(`https://b.ppy.sh/preview/${beatmapset.id}.mp3`);

    console.log(' * отправка osz файла карты', beatmapset.osz_filename);

    let osz_file_size = beatmapset.osz_file_buffer.length / 1048576;
    console.log(' * Размер карты:', osz_file_size.toFixed(2) + ' МБ');
    powershell_set_filesize(osz_file_size);

    powershell_sended_calc_start(beatmapset.osz_filename, lastfolder);

    const result = await sendOsz(beatmapset, {photoMessage, previewMessage});

    powershell_sended_calc_end();

    console.log(']');

    return result;
    
}
exports.sendNewBeatmap = sendNewBeatmap;
