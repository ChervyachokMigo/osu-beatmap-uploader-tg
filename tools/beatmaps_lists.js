const { MYSQL_GET_ALL_RESULTS_TO_ARRAY, MYSQL_GET_ALL, 
    sended_map_db, map_to_download_db, map_not_found, map_too_long, 
    MYSQL_SAVE} = require("./DB");
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("./misc");

const beatmaps_lists = {
    sended: {
        list:[], 
        model: sended_map_db
    },
    to_download: {
        list:[], 
        model: map_to_download_db
    },
    not_found: {
        list:[], 
        model: map_not_found
    },
    too_long: {
        list:[], 
        model: map_too_long
    },
};

const beatmaps_lists_names = Object.keys(beatmaps_lists);

module.exports = {
    init_beatmap_lists: async () => {
        const key = 'beatmapset_id';
    
        for (let name of beatmaps_lists_names){
            const model = beatmaps_lists[name].model;
            
            beatmaps_lists[name].list = GET_VALUES_FROM_OBJECT_BY_KEY(
                MYSQL_GET_ALL_RESULTS_TO_ARRAY(
                    await MYSQL_GET_ALL(model)), key).sort( (a,b) => a - b);
        }
        
    },
    
    beatmaps_lists_add: async (name, id) => {
        const key_value = { beatmapset_id: id };
        beatmaps_lists[name].list.push(id);
        await MYSQL_SAVE(beatmaps_lists[name].model, key_value , key_value);
    },

    is_betamap_in_lists: (id) => {
        for (let name of beatmaps_lists_names){
            if (beatmaps_lists[name].list.findIndex( v => v === id) > -1){
                 //console.log(' S карта уже была отправлена'.yellow, beatmapset_id);
                 //console.log(' S карта в списке загрузки'.yellow, beatmapset_id);
                 //console.log(' S о карте нет информации на банчо'.yellow, beatmapset_id);
                 //console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.yellow, beatmapset_id);
                return true;
            }
        }
        return false;
    },

    beatmaps_lists_find_index: (name, id) => {
        return beatmaps_lists[name].list.findIndex( v => v === id);
    }
}