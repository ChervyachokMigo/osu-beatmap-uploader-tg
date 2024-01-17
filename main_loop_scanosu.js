
const path = require('path');
require('colors');
const { get_last_beatmap, clear_last_beatmap } = require("./tools/last_beatmap.js");
const { sendNewBeatmap } = require("./tools/sendNewBeatmap.js");
const { makeOsz } = require('./tools/makeOsz.js');
const { beatmaps_lists_add } = require('./tools/beatmaps_lists.js');
const { osusongs } = require('./data/config.js');
const { readSongFolder } = require('./readSongFolder.js');
const { readdir } = require('fs');

let start_from_last_beatmap = true;

let lastfolder = {
    number: 0,
    length: 0,
};

async function main_loop_scanosu() {

    const lastbeatmap = get_last_beatmap();

    readdir(osusongs, { encoding: 'utf-8' }, async (err, songsFiles) => {
        if (err) { console.log(err); return false; }
        songsFiles.sort((a, b) => false || Number(a.split(' ')[0]) - Number(b.split(' ')[0]));

        console.log('запуск с последней сохраненой точки'.yellow, lastbeatmap);

        lastfolder.length = songsFiles.length;

        for (let folder of songsFiles) {

            lastfolder.number++;

            if (path.extname(folder) === '.osz') continue;
            if (start_from_last_beatmap && lastbeatmap && lastbeatmap.length > 0 && lastbeatmap !== folder) continue;
            if (start_from_last_beatmap) start_from_last_beatmap = false;
            if (lastbeatmap === folder) continue;

            //console.clear();
            //console.log('Осталось просканировать папок:', songsFiles.length-lastfolder.number, '/', songsFiles.length, ((songsFiles.length-lastfolder.number) / songsFiles.length * 100).toFixed(2)+'%')
            //console.log(lastfolder.number, 'сканирование папки', folder);
            //if (lstatSync(osusongs+'/'+folder).isDirectory()){
            const beatmapset = await readSongFolder(osusongs, folder);

            if (!beatmapset) {
                //console.log(' S карта будет пропущена.'.yellow);
                continue;
            }

            const beatmapset_osz = await makeOsz(beatmapset);

            if (beatmapset_osz) {
                if (await sendNewBeatmap(beatmapset_osz, lastfolder)) {
                    await beatmaps_lists_add('sended', beatmapset_osz.id);
                }
            }

            //}            
        }

        console.log('Все карты были просканированы'.yellow);
        clear_last_beatmap();
        await new Promise(resolve => setTimeout(resolve, 86400000));
    });

}
exports.main_loop_scanosu = main_loop_scanosu;
