
const { MYSQL_SAVE, MYSQL_GET_ALL } = require('MYSQL-tools');

const { GET_VALUES_FROM_OBJECT_BY_KEY } = require("./misc");

const beatmaps_lists = {
    sended_map: [],
    download_map: [],
    not_found_map: [],
    long_map: []
};

const beatmaps_lists_names = Object.keys(beatmaps_lists);

module.exports = {
    init_beatmap_lists: async () => {

        for (let action of beatmaps_lists_names){
            const data = await MYSQL_GET_ALL({ action });
            beatmaps_lists[action] = GET_VALUES_FROM_OBJECT_BY_KEY( data, 'beatmapset_id' )
				.sort( (a,b) => a - b);
        }
        
    },
    
    beatmaps_lists_add: async (name, id) => {
        beatmaps_lists[name].push(id);
        await MYSQL_SAVE(name, { beatmapset_id: id });
    },

    is_betamap_in_lists: (id) => {
        for (let name of beatmaps_lists_names){
            if (beatmaps_lists[name].findIndex( v => v === id) > -1){
                 //console.log(' S карта уже была отправлена'.yellow, beatmapset_id);
                 //console.log(' S карта в списке загрузки'.yellow, beatmapset_id);
                 //console.log(' S о карте нет информации на банчо'.yellow, beatmapset_id);
                 //console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.yellow, beatmapset_id);
                return true;
            }
        }
        return false;
    }
}