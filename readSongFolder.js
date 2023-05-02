const fs = require('fs');
const path = require('path');
const { get_beatmap_info } = require('./check_map.js');
const { MYSQL_SAVE, MYSQL_GET_ONE, sended_map_db, map_to_download_db } = require('./DB.js');
const { readBeatmap } = require("./readBeatmap");
const { GET_VALUES_FROM_OBJECT_BY_KEY, get_versions_but_fruits } = require("./tools");
var colors = require('colors');
const { osu_api_error_restart_ms } = require('./config.js');
const { keypress } = require('./keypress.js');

async function readSongFolder(folder_osusongs, folderpath) {
    var absolute_folder_path = folder_osusongs + '/' + folderpath;
    var beatmap_files = fs.readdirSync(absolute_folder_path, { encoding: 'utf-8' });
    var beatmapset = { id: 0, artist: '', title: '', source: '', tags: '', creator: '', beatmap: [] };
    beatmapset.id = Number(folderpath.split(' ').shift());

    if (beatmapset?.id || beatmapset.id > 0) {
        let mysqldata_map_to_download = await MYSQL_GET_ONE(map_to_download_db, { beatmapset_id: Number(beatmapset.id) });
        if (mysqldata_map_to_download) {
            console.log(' S карта в списке загрузки'.yellow, beatmapset.id);
            //exec(`explorer.exe "${absolute_folder_path.replaceAll('/','\\')}"`);
            return undefined;
        }
        let mysqldata_sended_map = await MYSQL_GET_ONE(sended_map_db, { beatmapset_id: Number(beatmapset.id) });
        if (mysqldata_sended_map) {
            console.log(' S карта уже была отправлена'.yellow, beatmapset.id);
            //exec(`explorer.exe "${absolute_folder_path.replaceAll('/','\\')}"`);
            return undefined;
        }
    } else {
        console.log(' E у карты отсутствует beatmapset id'.red);
        return undefined;
    }

    if (beatmap_files && beatmap_files.length && beatmap_files.length > 0) {
        for (let filename of beatmap_files) {
            if (path.extname(filename).toLowerCase() === '.osu') {
                console.log(' * чтение карты', filename);
                let beatmap_info = readBeatmap(`${absolute_folder_path}/${filename}`);
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
            let beatmap_versions = GET_VALUES_FROM_OBJECT_BY_KEY(beatmapset.beatmap, 'difficulty');
            console.log(' * запрос информации о карте на банчо', beatmapset.id);
            console.time('bancho request');
            let bancho_beatmap_info = await get_beatmap_info(beatmapset.id);

            console.log(' * [debug] * bancho_beatmap_info id'.yellow, bancho_beatmap_info.id);
            console.timeEnd('bancho request');
            if (bancho_beatmap_info.authentication) {
                console.log('osu not auth. restart');
                await new Promise(resolve => setTimeout(resolve, osu_api_error_restart_ms));
                throw new Error('osu not auth. bad beatmap info'.red);
            }

            if (!bancho_beatmap_info.beatmaps || bancho_beatmap_info.beatmaps.length == 0) {
                console.log(' E нет информации о карте на банчо'.red, beatmapset.id);
                return undefined;
            }

            /*console.log(bancho_beatmap_info.status)
            if (bancho_beatmap_info.status == 'graveyard' || bancho_beatmap_info.status == 'wip' || bancho_beatmap_info.status == 'pending'){
                console.log(' S карта еще не готова к ранкеду и будет пропущена'.yellow, beatmapset.id);
                return undefined;
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
                    await MYSQL_SAVE(map_to_download_db, { beatmapset_id: beatmapset.id }, { beatmapset_id: beatmapset.id });
                }
            }

            /*for (let bancho_diff_name of bancho_beatmap_versions) {
                if (beatmap_versions.indexOf(bancho_diff_name) == -1) {
                    console.log('bancho md5', bancho_beatmap_md5s);
                    console.log('local md5', local_beatmap_md5s);
                    console.log(' E карты не совпадают.'.red, beatmapset.id);
                    console.log(' * local beatmaps: ', beatmap_versions.join('; '));
                    console.log(' * bancho beatmaps:', bancho_beatmap_versions.join('; '));
                    console.log(' + будет добавлена в список загрузок'.yellow, beatmapset.id);
                    await keypress('press any key')
                    await MYSQL_SAVE(map_to_download_db, { beatmapset_id: beatmapset.id }, { beatmapset_id: beatmapset.id });
                    //exec(`explorer.exe "${absolute_folder_path.replaceAll('/','\\')}"`);
                    
                    return undefined;
                }
            }*/

            beatmapset.bancho_beatmap_info = bancho_beatmap_info;
            beatmapset.localfolder = folderpath;
            
            console.log(' + папка просканирована успешно'.green);
            return beatmapset;
        } else {
            console.log(' * папка пуста'.yellow, absolute_folder_path);
        }
    }
    console.log(' * папка пуста'.yellow, absolute_folder_path);
    return undefined;
}

exports.readSongFolder = readSongFolder;
