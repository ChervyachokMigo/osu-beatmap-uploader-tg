const zip = require('zip-dir');
const { osusongs } = require('./config.js');
const { escapeString } = require("./tools");
const colors = require('colors');
const {  MYSQL_SAVE, map_too_long } = require('./DB.js');

async function makeOsz(beatmapset) {
    const artist = beatmapset.artist? escapeString(beatmapset.artist).trim() + ' - ': ''; 
    const title = beatmapset.title? escapeString(beatmapset.title).trim():'';
    beatmapset.osz_filename = `${beatmapset.id} ${artist}${title}`.substring(0, 56).trim().replaceAll(/[ ]+/gui, ' ') + '.osz';

    console.log(' * создание osz архива карты', beatmapset.osz_filename);
    console.time('osz create');
    beatmapset.osz_file_buffer = await zip(osusongs + '/' + beatmapset.localfolder);
    console.timeEnd('osz create');

    if (beatmapset.osz_file_buffer.length > 50 * 1024 * 1024){
        console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.red, beatmapset.id);
        await MYSQL_SAVE(map_too_long, { beatmapset_id: beatmapset.id }, { beatmapset_id: beatmapset.id });
        return false;
    }
    return beatmapset;
}

exports.makeOsz = makeOsz;
