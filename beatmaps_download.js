
const fs = require('fs');
const path = require(`path`);

var { v1, v2, mods, tools, auth } = require ('osu-api-extended');
const { init_osu, get_beatmap_info } = require('./check_map.js');
const { prepareDB, MYSQL_GET_ALL, MYSQL_DELETE, GET_VALUES_FROM_OBJECT_BY_KEY, map_to_download_db } = require('./DB.js');

const mainpath = path.dirname(process.argv[1]);
const download_path = `${mainpath}\\beatmaps`;

if (!fs.existsSync(`${download_path}`)) { fs.mkdirSync(`${download_path}`, {recursive: true});}

async function beatmap_download(id, localpath){
    console.log(`try download ${path.basename(localpath)}`);
    return new Promise( async(resolve,rej)=>{
         await v2.beatmap.download(id, localpath).then((result)=>{
            if (typeof result == 'string'){
                resolve ( result );
            } else {
                resolve ( false );
            }
            //console.log('download complete', result)
        }).catch((reason)=>{
            console.log('error', reason);
            rej ( reason );
        });
    });
    
    var failed = await new Promise ((res,rej)=>{
        try{
            var stats = fs.statSync(localpath);
            console.log(`Filesize: ${stats.size/1024} KB`);
            if(stats.size > 3000){
                res(false);
            } else {
                let jsondata = fs.readFileSync(localpath, {encoding:`utf-8`});
                let jsonparsed = JSON.parse(jsondata);
                res(jsonparsed.error);
            }
        } catch (e){
            res(e);
        }
    });

    return failed;
}

function escapeString  (text){
    return text.replace(/[&\/\\#+$~%'":*?<>{}|]/g, '');
}

async function main(){
    await prepareDB();
    await init_osu();

    try{
        var mysql_data = await MYSQL_GET_ALL(map_to_download_db, {});
        var maps_to_download = GET_VALUES_FROM_OBJECT_BY_KEY( mysql_data, 'beatmapset_id');
        //var maps_to_download = JSON.parse(fs.readFileSync('maps_to_download.json'));
    } catch (e){
        console.error('nothing to downloads.')
        return false;
    }
    var process_map_counter = 0;
    for (let beatmapsetid of maps_to_download){
        console.log(process_map_counter,'/',maps_to_download.length)
        let bancho_beatmap_info = await get_beatmap_info(beatmapsetid);
        if (bancho_beatmap_info.authentication) {
            throw new Error('osu not auth');
        }
        let newbeatmap_name = `${bancho_beatmap_info.id} ${escapeString(bancho_beatmap_info.artist)} - ${escapeString(bancho_beatmap_info.title)}.osz`;
        var download_result = await beatmap_download(beatmapsetid , `${download_path}\\${newbeatmap_name}`);
        if (typeof download_result == 'string') {
            console.log('download complete');
            await MYSQL_DELETE(map_to_download_db, {beatmapset_id: beatmapsetid});
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