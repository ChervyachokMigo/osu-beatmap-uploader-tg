
const fs = require('fs');
const path = require(`path`);

var { v2 } = require ('osu-api-extended');

const { init_osu, get_beatmap_info } = require('../tools/check_map.js');

const { escapeString, checkDir, GET_VALUES_FROM_OBJECT_BY_KEY } = require('../tools/misc.js');
const { prepareDB } = require('../tools/DB.js');

const download_path = path.join(path.dirname(process.argv[1]), 'beatmaps');

async function beatmap_download(id, localpath){
    console.log(`try download ${path.basename(localpath)}`);
    return new Promise( async(resolve,rej)=>{
        await v2.beatmap.set.download(id, localpath).then((result)=>{
            if (typeof result == 'string'){
                var stats = fs.statSync(localpath);
                console.log(`Filesize: ${stats.size/1024} KB`);
                if(stats.size > 3000){
                    resolve(result);
                } else {
                    let jsondata = fs.readFileSync(localpath, {encoding:`utf-8`});
                    let jsonparsed = JSON.parse(jsondata);
                    console.error(jsonparsed.error)
                    resolve(false);
                }
            } else {
                resolve ( false );
            }
        }).catch((reason)=>{
            console.error('error', reason);
            rej ( reason );
        });
    });
}

async function main(){
    await prepareDB();
    await init_osu();

    checkDir(download_path);
    
    const maps_to_download = GET_VALUES_FROM_OBJECT_BY_KEY( await MYSQL_GET_ALL({ action: 'download_map'}), 'beatmapset_id');

    if (maps_to_download.length == 0){
        console.error('nothing to downloads.');
        return false;
    }

    var process_map_counter = 0;

    for (let beatmapsetid of maps_to_download){
        console.log(process_map_counter,'/',maps_to_download.length);

        let bancho_beatmap_info = await get_beatmap_info(beatmapsetid);

        if (bancho_beatmap_info.authentication) {
            throw new Error('osu not auth');
        }

        let newbeatmap_name = `${bancho_beatmap_info.id} ${escapeString(bancho_beatmap_info.artist)} - ${escapeString(bancho_beatmap_info.title)}.osz`;
        var download_result = await beatmap_download(beatmapsetid , `${download_path}\\${newbeatmap_name}`);

        console.log(download_result);

        if (typeof download_result == 'string') {
            console.log('download complete');
            await MYSQL_DELETE( 'download_map', { beatmapset_id: beatmapsetid });
        } else {
            if (download_result == false){
                console.log('file unavailable');
            } else {
                console.log(download_result);
            }
            
        }
        process_map_counter++;
    }
}

main();