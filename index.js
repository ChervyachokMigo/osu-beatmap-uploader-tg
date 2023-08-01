const fs = require('fs');

var colors = require('colors');

const { powershell_call } = require('./powershell.js')

const { init_osu } = require('./check_map.js');

const { osusongs } = require('./config.js');
const { prepareDB, MYSQL_GET_ONE, sended_map_db, map_to_download_db } = require('./DB.js');
const { readSongFolder } = require("./readSongFolder");
const { getLastBeatmap } = require("./getLastBeatmap");
const { makeOsz } = require("./makeOsz");
const { sendNewBeatmap } = require("./sendNewBeatmap");

const { exec } = require('child_process');
const { keypress } = require('./keypress.js');

async function main_loop_scanosu(){
    var startFromLast = true;
    var lastfolder = {
        number: 0,
        length: 0,
    };

    fs.readdir(osusongs, {encoding: 'utf-8'}, async (err, songsFiles)=>{
        if (err) {console.log(err); return false}
        songsFiles.sort( (a,b) => false || Number(a.split(' ')[0]) - Number(b.split(' ')[0]));
        var lastbeatmap = getLastBeatmap();
        console.log('запуск с последней сохраненой точки'.yellow, lastbeatmap)
        lastfolder.length = songsFiles.length;
        for (let folder of songsFiles){
            lastfolder.number++;
            if (startFromLast && lastbeatmap && lastbeatmap.length > 0 && lastbeatmap !== folder) continue;
            if (startFromLast) startFromLast = false;
            if (lastbeatmap === folder) continue;
            
            console.clear();
            console.log('Осталось просканировать папок:', songsFiles.length-lastfolder.number, '/', songsFiles.length, ((songsFiles.length-lastfolder.number) / songsFiles.length * 100).toFixed(2)+'%')
            console.log(lastfolder.number, 'сканирование папки', folder)
            if (fs.lstatSync(osusongs+'/'+folder).isDirectory()){
                console.time('beatmap folder')
                var beatmapset = await readSongFolder(osusongs, folder);
                
                if (beatmapset){
                    let mysqldata_sended_map = await MYSQL_GET_ONE(sended_map_db, {beatmapset_id: Number(beatmapset.id)} );
                    let mysqldata_map_to_download = await MYSQL_GET_ONE(map_to_download_db, {beatmapset_id: Number(beatmapset.id)} );
                    if (!mysqldata_sended_map && !mysqldata_map_to_download ){
                        await makeOsz(beatmapset);
                        if (beatmapset.osz_file_buffer.length < 50 * 1024 * 1024) {
                            await sendNewBeatmap(beatmapset, lastfolder);
                        } else {
                            fs.appendFileSync('large_file.txt', folder + '\n');

                            console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.yellow, beatmapset.id);
                        }
                    } else {
                        console.log(' S карта будет пропущена, находится в списках'.yellow, beatmapset.id);
                    }
                } else {
                    console.log(' S карта будет пропущена.'.yellow);
                }
                console.timeEnd('beatmap folder');
            }            

        }

        console.log('Все карты были просканированы'.yellow);
        fs.writeFileSync('lastbeatmap.txt', '', { encoding: 'utf-8' });
        await new Promise(resolve => setTimeout(resolve, 86400000));
    });
    
}

async function initialize(){
    powershell_call();
    await prepareDB();
    await init_osu();
    await main_loop_scanosu();
}

initialize ();

