
const path = require('node:path');
require('colors');
const { readdir } = require('node:fs');

const dashboard = require('dashboard_framework');

const { get_last_beatmap, clear_last_beatmap } = require("../tools/last_beatmap.js");
const { sendNewBeatmap } = require("../tools/sendNewBeatmap.js");
const { makeOsz } = require('../tools/makeOsz.js');
const { beatmaps_lists_add } = require('../tools/beatmaps_lists.js');
const { osusongs } = require('../data/config.js');
const { readSongFolder } = require('../tools/readSongFolder.js');
const lastfolder = require('../tools/lastfolder.js');

let start_from_last_beatmap = true;

async function main_loop_scanosu() {

    const lastbeatmap = get_last_beatmap();

    readdir(osusongs, { encoding: 'utf-8' }, async (err, songsFiles) => {
        if (err) { console.log(err); return false; }
        songsFiles.sort((a, b) => false || Number(a.split(' ')[0]) - Number(b.split(' ')[0]));

        console.log('запуск с последней сохраненой точки'.yellow, lastbeatmap);

        lastfolder.set_len(songsFiles.length);

        for (let folder of songsFiles) {

            lastfolder.inc();

            if (path.extname(folder) === '.osz') continue;
            if (start_from_last_beatmap && lastbeatmap && lastbeatmap.length > 0 && lastbeatmap !== folder) continue;
            if (start_from_last_beatmap) start_from_last_beatmap = false;
            if (lastbeatmap === folder) continue;
            
            const beatmapset = await readSongFolder(osusongs, folder);

            if (!beatmapset) {
                //console.log(' S карта будет пропущена.'.yellow);
                continue;
            }

			if (beatmapset.creator === 'SadGod') {
				console.log(' S карта автора SadGod будет пропущена.'.yellow);
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
                    icon: `https://assets.ppy.sh/beatmaps/${beatmapset_osz.id}/covers/card.jpg`,
                    sound: 'notify'
                });

                if (await sendNewBeatmap(beatmapset_osz)) {
                    await beatmaps_lists_add('sended_map', beatmapset_osz.id);
                }
            }

        }

        console.log('Все карты были просканированы'.yellow);
        await dashboard.change_status({name: 'action', status: 'end'});

        clear_last_beatmap();

        await new Promise(resolve => setTimeout(resolve, 86400000));
    });

}
exports.main_loop_scanosu = main_loop_scanosu;
