const { MYSQL_GET_ALL_RESULTS_TO_ARRAY, MYSQL_GET_ALL, 
    sended_map_db, map_to_download_db, map_not_found, map_too_long } = require("./DB");
const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("./misc");

const beatmaps_lists = {
    sended: [],
    to_download: [],
    not_found: [],
    too_long: []
};

const models = {    
    sended: sended_map_db,
    to_download: map_to_download_db,
    not_found: map_not_found,
    too_long: map_too_long
};

const init_beatmap_lists = async() => {
    beatmaps_lists.sended = GET_VALUES_FROM_OBJECT_BY_KEY(MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(sended_map_db)), 'beatmapset_id').sort( (a,b) => a - b);
    beatmaps_lists.to_download = GET_VALUES_FROM_OBJECT_BY_KEY(MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(map_to_download_db)), 'beatmapset_id').sort( (a,b) => a - b);
    beatmaps_lists.not_found = GET_VALUES_FROM_OBJECT_BY_KEY(MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(map_not_found)), 'beatmapset_id').sort( (a,b) => a - b);
    beatmaps_lists.too_long = GET_VALUES_FROM_OBJECT_BY_KEY(MYSQL_GET_ALL_RESULTS_TO_ARRAY(await MYSQL_GET_ALL(map_too_long)), 'beatmapset_id').sort( (a,b) => a - b);
    
}

module.exports = {
    init_beatmap_lists,
    beatmaps_lists_add: async (name, id) => {
        const key_value = { beatmapset_id: id };
        beatmaps_lists[name].push(id);
        await MYSQL_SAVE(models[name], key_value , key_value);
    },
    beatmaps_lists_find_index: (name, id) => {
        return beatmaps_lists[name].findIndex( v => v === id);
    }
}