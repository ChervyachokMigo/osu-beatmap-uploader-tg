
const { readFileSync } = require('fs');
const { last_beatmap_path } = require('../misc/settings');

function getLastBeatmap() {
    let res = null;
    try {
        res = readFileSync(last_beatmap_path, { encoding: 'utf-8' }).trim();
    } catch (e) {
        console.log(e);
    }
    return res;
}
exports.getLastBeatmap = getLastBeatmap;
