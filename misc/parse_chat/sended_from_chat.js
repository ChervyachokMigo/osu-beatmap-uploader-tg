
const fs = require( 'fs');

const { MYSQL_SAVE, select_mysql_model } = require('mysql-tools');

(async function(){

	const file_json = JSON.parse(fs.readFileSync('sended_from_chat.json'));

	for (let beatmapset_id of file_json.beatmapset_ids){
		console.log({ beatmapset_id: beatmapset_id });
		const sended_map = select_mysql_model('sended_map');
		await MYSQL_SAVE(sended_map, { beatmapset_id: beatmapset_id });
	}

})();
