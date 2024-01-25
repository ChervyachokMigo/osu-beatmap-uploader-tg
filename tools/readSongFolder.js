const { readdirSync } = require('fs');
const path = require('path');
require('colors');

const dashboard = require('dashboard_framework');

const { get_beatmap_info } = require('./check_map.js');
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require('./misc.js');
const { readBeatmap } = require("./readBeatmap.js");
const { beatmaps_lists_add, is_betamap_in_lists } = require('./beatmaps_lists.js');
const { osu_api_error_restart_ms } = require('../data/config.js');
const lastfolder = require('./lastfolder.js');

async function readSongFolder(folder_osusongs, localfolder) {

    const beatmapset_id = Number(localfolder.split(' ').shift());

    if (beatmapset_id > 0) {

        if (is_betamap_in_lists(beatmapset_id)){
            return null;
        }

    } else {
        console.log(' E у карты отсутствует beatmapset id'.red);
        return null;
    }

    let beatmapset = {
        id: beatmapset_id,
        artist: '',
        title: '',
        source: '',
        tags: '',
        creator: '',
        beatmap: [],
        localfolder,
    };

    const absolute_folder_path = path.join(folder_osusongs, localfolder);
    const beatmap_files = readdirSync(absolute_folder_path, { encoding: 'utf-8' });

    if (beatmap_files && beatmap_files.length && beatmap_files.length > 0) {

        await dashboard.change_status({name: 'action', status: 'read_folder'});

        await dashboard.change_text_item({
            name: 'folder', 
            item_name: 'current', 
            text: `${lastfolder.get_info()} ${localfolder}`
        });

        console.log(`${lastfolder.get_info()} ${localfolder}`);

        for (let filename of beatmap_files) {
            if (path.extname(filename).toLowerCase() === '.osu') {
                console.log(' * чтение карты', filename);
                let beatmap_info = readBeatmap( path.join(absolute_folder_path, filename) );

                if (!isNaN(beatmapset.id) && beatmapset.id == 0) {
                    beatmapset.id = Number(beatmap_info.beatmapsetID);
                }

                if (beatmapset?.id || beatmapset.id > 0) {
                    beatmapset.artist = beatmap_info.artist;
                    beatmapset.title = beatmap_info.title;
                    beatmapset.creator = beatmap_info.creator;
                    beatmapset.source = beatmap_info.source;
                    beatmapset.tags = beatmap_info.tags;
                    if (beatmapset.tags) {
                        beatmapset.tags = beatmapset.tags.split(' ').map(i => '#' + i);
                        if (beatmapset.tags.length > 10) {
                            beatmapset.tags = beatmapset.tags.slice(0, 10);
                            beatmapset.tags.push('...');
                        }
                    }

                    beatmapset.beatmap.push(beatmap_info);
                } else {
                    console.log(' E у карты отсутствует beatmapset id'.red, filename);
                }
            }
        }

        if (beatmapset.beatmap.length > 0 && beatmapset.id > 0) {
            console.log(' * найдено ', beatmapset.beatmap.length, 'карт');
            console.log(' * запрос информации о карте на банчо', beatmapset.id);

            let bancho_beatmap_info = await get_beatmap_info(beatmapset.id);

            if (bancho_beatmap_info.authentication) {
                console.log('osu not auth. restart');
                await new Promise(resolve => setTimeout(resolve, osu_api_error_restart_ms));
                throw new Error('osu not auth. bad beatmap info'.red);
            }

            if (!bancho_beatmap_info.beatmaps || bancho_beatmap_info.beatmaps.length == 0) {
                await beatmaps_lists_add('not_found', beatmapset.id);
                console.log(' E нет информации о карте на банчо'.red, beatmapset.id);
                return null;
            }

            /*console.log(bancho_beatmap_info.status)
            if (bancho_beatmap_info.status == 'graveyard' || bancho_beatmap_info.status == 'wip' || bancho_beatmap_info.status == 'pending'){
                console.log(' S карта еще не готова к ранкеду и будет пропущена'.yellow, beatmapset.id);
                return null;
            }*/
            bancho_beatmap_info.beatmaps = bancho_beatmap_info.beatmaps.map((val) => {
                val.version = val.version.replace('[2K]', '')
                    .replace('[3K]', '').replace('[4K]', '').replace('[5K]', '')
                    .replace('[6K]', '').replace('[7K]', '').replace('[8K]', '')
                    .replace('[9K]', '').replace('[10K]', '').trim();
                return val;
            });

            //let bancho_beatmap_versions = get_versions_but_fruits(bancho_beatmap_info.beatmaps, 'version');
            var bancho_beatmap_md5s = GET_VALUES_FROM_OBJECT_BY_KEY(bancho_beatmap_info.beatmaps, 'checksum');
            var local_beatmap_md5s = GET_VALUES_FROM_OBJECT_BY_KEY(beatmapset.beatmap, 'md5_hash');

            for (let bancho_md5 of bancho_beatmap_md5s) {
                if (local_beatmap_md5s.indexOf(bancho_md5) == -1) {
                    console.log('bancho md5', bancho_beatmap_md5s);
                    console.log('local md5', local_beatmap_md5s);
                    console.log(' E карты не совпадают.'.red, beatmapset.id);
                    console.log(' + будет добавлена в список загрузок'.yellow, beatmapset.id);
                    await beatmaps_lists_add('to_download', beatmapset.id);
                    return null;
                }
            }

            beatmapset.bancho_beatmap_info = bancho_beatmap_info;

            console.log(' + папка просканирована успешно'.green);
            return beatmapset;
        } else {
            console.log(' * папка пуста'.yellow, absolute_folder_path);
        }
    }
    console.log(' * папка пуста'.yellow, absolute_folder_path);
    return null;
}
exports.readSongFolder = readSongFolder;
