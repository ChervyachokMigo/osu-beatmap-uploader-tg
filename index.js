
const { prepareDB } = require('./tools/DB.js');
const { init_osu } = require('./tools/check_map.js');
const { init_beatmap_lists } = require('./tools/beatmaps_lists.js');
const { main_loop_scanosu } = require('./general/main_loop_scanosu.js');
const { dashboard_init } = require('./general/dashboard_init.js');

const initialize = async() => {
    await dashboard_init();
    await prepareDB();
    await init_osu();
    await init_beatmap_lists();
    await main_loop_scanosu();
}

initialize ();
