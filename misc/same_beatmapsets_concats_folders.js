const fs = require('node:fs');
const fse = require('fs-extra')
const path = require('node:path');

require('colors');

const { keypress } = require('../tools/keypress.js');

const { osusongs } = require('../data/config.js');

var beatmapsets = [];

async function answerFolder(folders){
    var variants_text = ['0. skip'];
    var variants = [0];

    for (let i = 1; i < folders.length + 1; i++ ){
        variants.push(i);
        variants_text.push(`${i}. ${folders[i-1]}`);
    }
    
    return await keypress(`Какую папку оставить?\n${variants_text.join('\n')}`, variants.join(''));
}


async function afterscan(){
    console.log('папки просканированы');
    console.log('найдено ',beatmapsets.length,'карт');
    var beatmapsetsWithCopies = beatmapsets.filter(val => val.copies.length>0);
    console.log('найдено одинаковых', beatmapsetsWithCopies.length);
    var foldercounter = 0;
    for (let beatmapsetCopies of beatmapsetsWithCopies){
        foldercounter++;
        let folders = [];
        folders.push(beatmapsetCopies.folder);
        folders = folders.concat(beatmapsetCopies.copies);
        //console.log(beatmapsetCopies)
        //console.log(folders)
        let user_answer = Number(await answerFolder(folders));
        if (user_answer > 0 && user_answer <= folders.length){
            console.log('вы выбрали папку', folders[user_answer-1]);
            for (let folder of folders){
                if (folder !== folders[user_answer-1]){
                    try {
                        fse.copySync(osusongs+'/'+folder, osusongs+'/'+folders[user_answer-1]);
                        fse.removeSync(osusongs+'/'+folder)
                        console.log('файлы перемещены из ',folder,'в',folders[user_answer-1])
                    } catch (err) {
                        console.error(err)
                    }
                }
            }
        }
        console.log('осталось выбрать ',beatmapsetsWithCopies.length - foldercounter, '/', beatmapsetsWithCopies.length)

    }
    
}

async function scanosu(){
    console.log('scanning.. wait')
    fs.readdir(osusongs, {encoding: 'utf-8'}, async (err, songsFiles)=>{
        if (err) {console.log(err); return false}

        songsFiles.sort( (a,b) => false || Number(a.split(' ')[0]) - Number(b.split(' ')[0]));

        var folder_current = 0;
        
        for (let folder of songsFiles){
            folder_current++;        
            //console.log('Осталось просканировать папок:', songsFiles.length-folder_current, '/', songsFiles.length, ((songsFiles.length-folder_current) / songsFiles.length * 100).toFixed(2)+'%')
           // console.log(folder_current, 'сканирование папки', folder)
            if (fs.lstatSync(osusongs+'/'+folder).isDirectory()){

                var beatmapsetid = await readSongFolder(osusongs, folder);
                
                if (beatmapsetid){
                    let beatmapsetexists = beatmapsets.findIndex(val=>{
                        return val.id === beatmapsetid
                    });
                    if ( beatmapsetexists == -1) {
                        beatmapsets.push({folder, id: beatmapsetid, copies: []});
                    } else {
                        beatmapsets[beatmapsetexists].copies.push(folder);
                    }
                    
                } else {
                    console.log(' S карта будет пропущена.'.yellow);
                }
                /*if (beatmapsetid>10000){
                    break;
                }*/
            }
           
            
        }
        await afterscan();
    });
    
}


async function readSongFolder(folder_osusongs, folderpath){

    var absolute_folder_path = folder_osusongs + '/' + folderpath;

    var beatmap_files = fs.readdirSync(absolute_folder_path, {encoding: 'utf-8'});
    var beatmapsetID;

    if (beatmap_files && beatmap_files.length && beatmap_files.length>0){
        for(let filename of beatmap_files){

            if (path.extname(filename).toLowerCase()==='.osu'){
                //console.log(' * чтение карты', filename);
                beatmapsetID = getBeatmapsetID(`${absolute_folder_path}/${filename}`);
                if (!beatmapsetID || beatmapsetID<=0){
                    //console.log(' * у карты отсутствует beatmapset id, попытка взять его у папки'.yellow, folderpath);
                    let beatmapsetid_from_folder = Number(folderpath.split(' ').shift());
                    if (!isNaN(beatmapsetid_from_folder) && beatmapsetid_from_folder>0){
                        beatmapsetID = beatmapsetid_from_folder;
                    }
                }
                if (beatmapsetID || beatmapsetID>0){
                    //console.log(' * beatmapset id найден', beatmapsetID);
                    break;
                }
            }
        }
        if (beatmapsetID || beatmapsetID>0){
            return Number(beatmapsetID);
        } else {
            console.log(' E у карты отсутствует beatmapset id'.red);
            return undefined;
        }
    }
    console.log(' * папка пуста'.yellow, absolute_folder_path);
    return undefined;
}


function getBeatmapsetID(beatmapPath){
    function getPropery(data){
        var res = data.split(':');
        res.shift();
        return res.join(':').trim()
    }

    let beatmap_text = fs.readFileSync(beatmapPath, {encoding: 'utf-8'});
    beatmap_text = beatmap_text.split("\n"); 
    var beatmapsetID = 0;
    for(let beatmap_row of beatmap_text) {
        if (beatmap_row.toLowerCase().trim().startsWith("beatmapsetid") == true){
            beatmapsetID = getPropery(beatmap_row);
            break;
        }
    }
    return beatmapsetID
}

scanosu();