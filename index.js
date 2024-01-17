
const { powershell_call } = require('./display/powershell.js')
const { prepareDB } = require('./tools/DB.js');
const { init_osu } = require('./tools/check_map.js');
const { init_beatmap_lists } = require('./tools/beatmaps_lists.js');
const { main_loop_scanosu } = require('./main_loop_scanosu.js');

const initialize = async() => {
    powershell_call();
    await prepareDB();
    await init_osu();
    await init_beatmap_lists();
    await main_loop_scanosu();
}

initialize ();
