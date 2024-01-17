const { MYSQL_SAVE, sended_map_db } = require('../../tools/DB.js');

const fs = require( 'fs');

var file_json = JSON.parse(fs.readFileSync('sended_from_chat.json'));
(async function(){
for (let beatmapset_id of file_json.beatmapset_ids){
    console.log({ beatmapset_id: beatmapset_id })
    await MYSQL_SAVE(sended_map_db, { beatmapset_id: beatmapset_id }, { beatmapset_id: beatmapset_id });
}
})();
