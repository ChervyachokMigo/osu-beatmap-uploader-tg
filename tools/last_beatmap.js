
const { readFileSync, writeFileSync } = require('fs');
const { last_beatmap_path } = require('../misc/settings');

function get_last_beatmap() {
    let res = null;
    try {
        res = readFileSync(last_beatmap_path, { encoding: 'utf-8' }).trim();
    } catch (e) {
        console.log('последняя карта не сохранена, начинаем сначала');
        //console.log(e);
    }
    return res;
}

function clear_last_beatmap() {
    writeFileSync(last_beatmap_path, '', { encoding: 'utf-8' });
}


exports.clear_last_beatmap = clear_last_beatmap;
exports.get_last_beatmap = get_last_beatmap;
