const zip = require('zip-dir');
const { osusongs } = require('./config.js');
const { escapeString } = require("./tools");

async function makeOsz(beatmapset) {
    var artist = beatmapset.artist? escapeString(beatmapset.artist).trim() + ' - ': ''; 
    var title = beatmapset.title? escapeString(beatmapset.title).trim():'';
    let osz_filename_escaped = `${beatmapset.id} ${artist}${title}`.substring(0, 56).trim();
    osz_filename_escaped = osz_filename_escaped.replaceAll(/[ ]+/gui, ' ');
    beatmapset.osz_filename = `${osz_filename_escaped}.osz`;
    console.log(' * создание osz архива карты', beatmapset.osz_filename);
    console.time('osz create');
    beatmapset.osz_file_buffer = await zip(osusongs + '/' + beatmapset.localfolder);
    console.timeEnd('osz create');

}

exports.makeOsz = makeOsz;
