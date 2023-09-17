const fs = require('fs');

const colors = require('colors');

const { powershell_call } = require('./powershell.js')

const { init_osu, get_beatmap_info } = require('./check_map.js');

const { osusongs, osu_api_error_restart_ms } = require('./config.js');

const { prepareDB, GET_VALUES_FROM_OBJECT_BY_KEY , MYSQL_GET_ALL_RESULTS_TO_ARRAY, MYSQL_GET_ALL, MYSQL_SAVE,
    sended_map_db, map_to_download_db, map_not_found, map_too_long } = require('./DB.js');

const { readBeatmap } = require("./readBeatmap");
const { getLastBeatmap } = require("./getLastBeatmap");
const { sendNewBeatmap } = require("./sendNewBeatmap");

const { exec } = require('child_process');
const { keypress } = require('./keypress.js');

const path = require('path');

const zip = require('zip-dir');
const { escapeString } = require("./tools");

const beatmaps_lists = {
    sended: [],
    to_download: [],
    not_found: [],
    too_long: []
};

async function init_beatmap_lists(){
    beatmaps_lists.sended = GET_VALUES_FROM_OBJECT_BY_KEY(MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(sended_map_db)), 'beatmapset_id').sort( (a,b) => a - b);
    beatmaps_lists.to_download = GET_VALUES_FROM_OBJECT_BY_KEY(MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(map_to_download_db)), 'beatmapset_id').sort( (a,b) => a - b);
    beatmaps_lists.not_found = GET_VALUES_FROM_OBJECT_BY_KEY(MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(map_not_found)), 'beatmapset_id').sort( (a,b) => a - b);
    beatmaps_lists.too_long = GET_VALUES_FROM_OBJECT_BY_KEY(MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(map_too_long)), 'beatmapset_id').sort( (a,b) => a - b);
    
}

async function main_loop_scanosu(){

    console.time('process_lasts');

    var startFromLast = true;

    var lastfolder = {
        number: 0,
        length: 0,
    };

    const lastbeatmap = getLastBeatmap();

    fs.readdir(osusongs, {encoding: 'utf-8'}, async (err, songsFiles)=>{
        if (err) {console.log(err); return false}
        songsFiles.sort( (a,b) => false || Number(a.split(' ')[0]) - Number(b.split(' ')[0]));
        
        console.log('запуск с последней сохраненой точки'.yellow, lastbeatmap);

        lastfolder.length = songsFiles.length;

        for (let folder of songsFiles){

            lastfolder.number++;

            if (startFromLast && lastbeatmap && lastbeatmap.length > 0 && lastbeatmap !== folder) continue;
            if (startFromLast) startFromLast = false;
            if (lastbeatmap === folder) continue;
            
            //console.clear();
            //console.log('Осталось просканировать папок:', songsFiles.length-lastfolder.number, '/', songsFiles.length, ((songsFiles.length-lastfolder.number) / songsFiles.length * 100).toFixed(2)+'%')
            //console.log(lastfolder.number, 'сканирование папки', folder);

            //if (fs.lstatSync(osusongs+'/'+folder).isDirectory()){

                var beatmapset = await readSongFolder(osusongs, folder);
                
                if (typeof beatmapset === 'undefined'){
                    //console.log(' S карта будет пропущена.'.yellow);
                    continue;
                }

                /*if (beatmaps_lists.sended.findIndex(b => beatmapset.id === b) > -1){
                    //console.log(' S карта уже была отправлена'.yellow, beatmapset.id);
                    continue;
                }
                if (beatmaps_lists.to_download.findIndex(b => beatmapset.id === b) > -1){
                    //console.log(' S карта в списке загрузки'.yellow, beatmapset.id);
                    continue;
                }
                if (beatmaps_lists.not_found.findIndex(b => beatmapset.id === b) > -1){
                    //console.log(' S о карте нет информации на банчо'.yellow, beatmapset.id);
                    continue;
                }
                if (beatmaps_lists.too_long.findIndex(b => beatmapset.id === b) > -1 ){
                    //console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.yellow, beatmapset.id);
                    continue;
                }*/

                beatmapset = await makeOsz(beatmapset);

                if (beatmapset) {
                    if (await sendNewBeatmap(beatmapset, lastfolder)){
                        await MYSQL_SAVE(sended_map_db, { beatmapset_id: beatmapset.id }, { beatmapset_id: beatmapset.id });
                        beatmaps_lists.sended.push(beatmapset.id);
                    }
                }

            //}            

        }

        console.log('Все карты были просканированы'.yellow);
        fs.writeFileSync('lastbeatmap.txt', '', { encoding: 'utf-8' });
        console.timeEnd('process_lasts');
        await new Promise(resolve => setTimeout(resolve, 86400000));
    });
    
}

async function initialize(){
    powershell_call();
    await prepareDB();
    await init_osu();
    await init_beatmap_lists();
    await main_loop_scanosu();
}

initialize ();

async function readSongFolder(folder_osusongs, folderpath) {

    const beatmapset_id = Number(folderpath.split(' ').shift());

    if (beatmapset_id > 0) {

        if (beatmaps_lists.sended.findIndex(b =>beatmapset_id === b) > -1) {
            //console.log(' S карта уже была отправлена'.yellow, beatmapset_id);
            return undefined;
        }

        if (beatmaps_lists.to_download.findIndex(b => beatmapset_id === b) > -1 ) {
            //console.log(' S карта в списке загрузки'.yellow, beatmapset_id);
            return undefined;
        }

        if (beatmaps_lists.not_found.findIndex(b => beatmapset_id === b) > -1) {
            //console.log(' S о карте нет информации на банчо'.yellow, beatmapset_id);
            return undefined;
        }

        if (beatmaps_lists.too_long.findIndex(b => beatmapset_id === b) > -1) {
            //console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.yellow, beatmapset_id);
            return undefined;
        }

    } else {
        console.log(' E у карты отсутствует beatmapset id'.red);
        return undefined;
    }

    var beatmapset = { id: beatmapset_id, artist: '', title: '', source: '', tags: '', creator: '', beatmap: [] };
    const absolute_folder_path = folder_osusongs + '/' + folderpath;
    const beatmap_files = fs.readdirSync(absolute_folder_path, { encoding: 'utf-8' });

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
                await MYSQL_SAVE(map_not_found, { beatmapset_id: beatmapset.id }, { beatmapset_id: beatmapset.id });
                beatmaps_lists.not_found.push(beatmapset.id);
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
                    beatmaps_lists.to_download.push(beatmapset.id);
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

async function makeOsz(beatmapset) {
    const artist = beatmapset.artist? escapeString(beatmapset.artist).trim() + ' - ': ''; 
    const title = beatmapset.title? escapeString(beatmapset.title).trim():'';
    beatmapset.osz_filename = `${beatmapset.id} ${artist}${title}`.substring(0, 56).trim().replaceAll(/[ ]+/gui, ' ') + '.osz';

    console.log(' * создание osz архива карты', beatmapset.osz_filename);
    console.time('osz create');
    beatmapset.osz_file_buffer = await zip(osusongs + '/' + beatmapset.localfolder);
    console.timeEnd('osz create');

    if (beatmapset.osz_file_buffer.length > 50 * 1024 * 1024){
        console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.red, beatmapset.id);
        await MYSQL_SAVE(map_too_long, { beatmapset_id: beatmapset.id }, { beatmapset_id: beatmapset.id });
        beatmaps_lists.too_long.push(beatmapset.id);
        return false;
    }
    return beatmapset;
}

