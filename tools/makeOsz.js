const { osusongs } = require('../data/config.js');
const { MYSQL_SAVE, map_too_long } = require('./DB.js');
const path = require('path');
const zip = require('zip-dir');
const { tg_file_length_max } = require('../misc/consts.js');
const { beatmaps_lists_add } = require('./beatmaps_lists.js');
const { escapeString } = require('./misc.js');

const make_osz_filename = ({id, artist, title}) => {
    return `${id} ${artist? escapeString(artist) + ' - ': ''}${title? escapeString(title): ''}`
        .substring(0, 56).trim().replaceAll(/[ ]+/gui, ' ') + '.osz';
};

async function makeOsz(args) {
    const { id, artist, title, localfolder } = args;
    const folder_path = path.join(osusongs, localfolder);

    const osz_filename = make_osz_filename({ id, artist, title });

    console.log(' * создание osz архива карты', osz_filename);

    console.time('osz create');

    const osz_file_buffer = await zip(folder_path);
    console.timeEnd('osz create');

    if (osz_file_buffer.length > tg_file_length_max) {
        console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.red, id);
        await MYSQL_SAVE(map_too_long, { beatmapset_id: id }, { beatmapset_id: id });
        beatmaps_lists_add('too_long', id);
        return null;
    }
    return { ...args, osz_filename, osz_file_buffer };
}
exports.makeOsz = makeOsz;
