
const path = require('path');
require('colors');
const { readdir } = require('fs');

const dashboard = require('dashboard_framework');

const { get_last_beatmap, clear_last_beatmap } = require("./tools/last_beatmap.js");
const { sendNewBeatmap } = require("./tools/sendNewBeatmap.js");
const { makeOsz } = require('./tools/makeOsz.js');
const { beatmaps_lists_add } = require('./tools/beatmaps_lists.js');
const { osusongs } = require('./data/config.js');
const { readSongFolder } = require('./readSongFolder.js');

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

            await dashboard.change_text_item({
                name: 'folder', 
                item_name: 'current', 
                text: `[${lastfolder.number}/${lastfolder.length}] ${folder}`
            });

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
                await dashboard.css_apply({
                    selector: 'body', 
                    prop: 'background-image', 
                    value: `url(https://assets.ppy.sh/beatmaps/${beatmapset_osz.id}/covers/raw.jpg)`
                });

                await dashboard.emit_event({
                    feedname: 'events',
                    type: 'beatmap',
                    title: `${beatmapset_osz.title}`,
                    desc: `${beatmapset_osz.artist}`,
                    url: {
                        href: `https://osu.ppy.sh/beatmapsets/${beatmapset_osz.id}`,
                    },
                    icon: `https://assets.ppy.sh/beatmaps/${beatmapset_osz.id}/covers/card.jpg`
                });

                dashboard.play_notify('notify', 0.1);

                if (await sendNewBeatmap(beatmapset_osz, lastfolder)) {
                    await beatmaps_lists_add('sended', beatmapset_osz.id);
                }
            }

            //}            
        }

        console.log('Все карты были просканированы'.yellow);
        await dashboard.change_status({name: 'action', status: 'end'});
        clear_last_beatmap();
        await new Promise(resolve => setTimeout(resolve, 86400000));
    });

}
exports.main_loop_scanosu = main_loop_scanosu;
