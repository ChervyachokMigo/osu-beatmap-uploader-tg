
const { prepareDB } = require('./tools/DB.js');
const { init_osu } = require('./tools/check_map.js');
const { init_beatmap_lists } = require('./tools/beatmaps_lists.js');
const { main_loop_scanosu } = require('./general/main_loop_scanosu.js');
const { dashboard_init } = require('./general/dashboard_init.js');
const { sendMessage } = require('./tools/bot.js');
const { scan_laser } = require('./general/scan_laser.js');

const initialize = async() => {
    await dashboard_init();
    await prepareDB();
    await init_osu();
    await init_beatmap_lists();

	//const start_message = 'Через 15 минут начнется выгрузка новых карт\nПросьба выключить уведомления, кто этого не сделал.';
	//await sendMessage(start_message);
	//const start_timeout = 60000 * 15; // 15 min

	//setTimeout( async () => {
		await scan_laser();
	//}, start_timeout);
    
}

initialize ();
