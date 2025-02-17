const { osusongs } = require('../data/config.js');
const path = require('node:path');
const zip = require('zip-dir');

const dashboard = require('dashboard_framework');

const { tg_file_length_max } = require('../misc/consts.js');
const { beatmaps_lists_add } = require('./beatmaps_lists.js');
const { escapeString } = require('./misc.js');

const make_osz_filename = ({id, artist, title}) => {
    return `${id} ${artist? escapeString(artist) + ' - ': ''}${title? escapeString(title): ''}`
        .substring(0, 56).trim().replaceAll(/[ ]+/gui, ' ') + '.osz';
};

async function makeOsz(args) {
	const { id, artist, title, absolute_path } = args;
    await dashboard.change_status({name: 'action', status: 'make_osz'});

    const osz_filename = make_osz_filename({ id, artist, title });

    console.log(' * создание osz архива карты', osz_filename);

    console.time('osz create');
    const osz_file_buffer = await zip(absolute_path);
    console.timeEnd('osz create');

    if (osz_file_buffer.length > tg_file_length_max) {
        console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.red, id);
        beatmaps_lists_add('long_map', id);
        return null;
    }
    return { ...args, osz_filename, osz_file_buffer };
}
exports.makeOsz = makeOsz;
