
const path = require('node:path');
require('colors');

const dashboard = require('dashboard_framework');

const { get_last_beatmap, clear_last_beatmap } = require("../tools/last_beatmap.js");
const { sendNewBeatmap } = require("../tools/sendNewBeatmap.js");
const { makeOsz } = require('../tools/makeOsz.js');
const { beatmaps_lists_add } = require('../tools/beatmaps_lists.js');
const { osulaser } = require('../data/config.js');
const lastfolder = require('../tools/lastfolder.js');
const { open_realm, get_realm_objects, set_laser_files_path, export_beatmapset, laser_beatmap_status } = require('osu-tools');
const { laser_beatmaps_verify } = require('../tools/laser_beatmaps_verify.js');
const { checkDir } = require('../tools/misc.js');
const clean_exported = require('../tools/clean_exported.js');

let start_from_last_beatmap = true;

const exported_beatmaps_path = path.join(__dirname, '..', 'data', 'exported_beatmaps');

async function scan_laser() {
	checkDir(exported_beatmaps_path);

	const realm_path = path.join(osulaser, 'client.realm');
	const realm = open_realm(realm_path);
	const beatmapsets = [...get_realm_objects(realm, 'BeatmapSet')]
		.filter ( v => v.Status === laser_beatmap_status.Loved || v.Status === laser_beatmap_status.Approved || v.Status === laser_beatmap_status.Ranked)
		.sort((a, b) => a.OnlineID - b.OnlineID);
	set_laser_files_path(osulaser);

    //console.log(beatmapsets);
	lastfolder.set_len(beatmapsets.length);

	for (let beatmapset of beatmapsets) {

		lastfolder.inc();

		//console.log('beatmapset.OnlineID', beatmapset.OnlineID);

		
		//console.log('beatmapset.Beatmaps.length', beatmapset.Beatmaps.length)
		//console.log('beatmapset.Beatmaps', beatmapset.Beatmaps)

		const verify_result = await laser_beatmaps_verify(beatmapset);

		if (!verify_result) {
			//console.log(' S карта будет пропущена.'.yellow);
			continue;
		}

		const exported_beatmapset = export_beatmapset(beatmapset, exported_beatmaps_path);
		const beatmapset_osz = await makeOsz({
			...verify_result,
			absolute_path: exported_beatmapset.exported_path
		});
		clean_exported(exported_beatmapset.exported_path);

		if (beatmapset_osz) {
			await dashboard.css_apply({
				selector: 'body', 
				prop: 'background-image', 
				value: `url(https://assets.ppy.sh/beatmaps/${beatmapset_osz.id}/covers/raw.jpg)`
			});

			await dashboard.emit_event({
				feedname: 'events',
				type: 'beatmap',
				title: `${beatmapset_osz.title}`,
				desc: `${beatmapset_osz.artist}`,
				url: {
					href: `https://osu.ppy.sh/beatmapsets/${beatmapset_osz.id}`,
				},
				icon: `https://assets.ppy.sh/beatmaps/${beatmapset_osz.id}/covers/card.jpg`,
				sound: 'notify'
			});

			if (await sendNewBeatmap(beatmapset_osz)) {
				await beatmaps_lists_add('sended_map', beatmapset_osz.id);
			}
		}

	}	

	console.log('Все карты были просканированы'.yellow);
    await dashboard.change_status({name: 'action', status: 'end'});

    await new Promise(resolve => setTimeout(resolve, 86400000));

}
exports.scan_laser = scan_laser;
