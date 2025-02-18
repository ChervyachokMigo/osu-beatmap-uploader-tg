
require('colors');

const dashboard = require('dashboard_framework');

const { get_beatmap_info } = require('./check_map.js');
const { GET_VALUES_FROM_OBJECT_BY_KEY, escapeString } = require('./misc.js');

const { beatmaps_lists_add, is_betamap_in_lists } = require('./beatmaps_lists.js');
const { osu_api_error_restart_ms } = require('../data/config.js');
const lastfolder = require('./lastfolder.js');
const { beatmap_modes, tg_file_length_max } = require('../misc/consts.js');
const { get_beatmapset_files, escape_string } = require('osu-tools');
const { calculate_filesizes } = require('./calculate_filesizes.js');

async function laser_beatmaps_verify(local_beatmapset) {

    const beatmapset_id = local_beatmapset.OnlineID;

    if (beatmapset_id <= 0) {
		//console.log(' E у карты отсутствует beatmapset id'.red);
        return null;
    }

	if (local_beatmapset.Beatmaps.length < 1) {
		console.log(` E [${beatmapset_id}] у мапсета отсутствуют карты`.red);
        return null;
	}

	if (is_betamap_in_lists(beatmapset_id)){
		//console.log(' S карта уже была отправлена'.yellow, beatmapset_id);
        //console.log(' S карта в списке загрузки'.yellow, beatmapset_id);
        //console.log(' S о карте нет информации на банчо'.yellow, beatmapset_id);
        //console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.yellow, beatmapset_id);
        return null;
    }

	const beatmapset_metadata = local_beatmapset.Beatmaps[0].Metadata;

	if ( beatmapset_metadata.Author.Username === 'SadGod') {
		console.log(` S [${beatmapset_id}] карта автора SadGod будет пропущена.`.yellow);
		return null;
	}

	const foldername = escape_string(`${beatmapset_id} ${beatmapset_metadata.Artist} - ${beatmapset_metadata.Title}`);

	const beatmapset = {
        id: beatmapset_id,
        artist: beatmapset_metadata.Artist,
        title: beatmapset_metadata.Title,
        source: beatmapset_metadata.Source,
        tags: beatmapset_metadata.Tags,
        creator: beatmapset_metadata.Author.Username,
		status: local_beatmapset.Status,
        beatmap: local_beatmapset.Beatmaps.map( v => ({
			md5_hash: v.MD5Hash,
			id: v.OnlineID,
			difficulty: v.DifficultyName,
			star_rate: v.StarRating,
			status: v.Status,
			gamemode: beatmap_modes[v.Ruleset.OnlineID],
			HP: v.Difficulty.DrainRate,
			CS: v.Difficulty.CircleSize,
			OD: v.Difficulty.OverallDifficulty,
			AP: v.Difficulty.ApproachRate,
			BPM: v.BPM,
			length: v.Length
		})),
        foldername,
		laser_beatmapset: local_beatmapset
    };

	if (beatmapset.tags) {
		beatmapset.tags = beatmapset.tags.split(' ').map(i => '#' + i);
		if (beatmapset.tags.length > 10) {
			beatmapset.tags = beatmapset.tags.slice(0, 10);
			beatmapset.tags.push('...');
		}
	}

	const beatmapset_files = get_beatmapset_files(local_beatmapset);

	const beatmapset_size = calculate_filesizes(beatmapset_files.files.map( v => v.filepath));
	
	if (beatmapset_size > tg_file_length_max) {
        console.log(' S карта будет пропущена из-за ограничения телеграмма в 50 мегабайт'.red, beatmapset_id);
        beatmaps_lists_add('long_map', beatmapset_id);
        return null;
    }

    await dashboard.change_status({name: 'action', status: 'verify_beatmaps'});

	await dashboard.change_text_item({
		name: 'folder', 
		item_name: 'current', 
		text: `${lastfolder.get_info()} ${foldername}`
	});

	console.log(' * запрос информации о карте на банчо', beatmapset.id);
	const bancho_beatmapset = await get_beatmap_info(beatmapset.id);

	if (bancho_beatmapset?.authentication) {
		console.log('osu not auth. restart');
		await new Promise(resolve => setTimeout(resolve, osu_api_error_restart_ms));
		throw new Error('osu not auth. bad beatmap info'.red);
	}

	if (!bancho_beatmapset?.beatmaps || bancho_beatmapset?.beatmaps?.length == 0) {
		await beatmaps_lists_add('not_found_map', beatmapset.id);
		console.log(' E нет информации о карте на банчо'.red, beatmapset.id);
		return null;
	}

	if (bancho_beatmapset?.status == 'graveyard' || bancho_beatmapset?.status == 'wip' || bancho_beatmapset?.status == 'pending'){
		console.log(' S карта еще не готова к ранкеду и будет пропущена'.yellow, beatmapset.id);
		return null;
	}

    //remove mania prefixes
	bancho_beatmapset.beatmaps = bancho_beatmapset.beatmaps.map((val) => {
		val.version = val.version.replace('[2K]', '')
			.replace('[3K]', '').replace('[4K]', '').replace('[5K]', '')
			.replace('[6K]', '').replace('[7K]', '').replace('[8K]', '')
			.replace('[9K]', '').replace('[10K]', '').trim();
		return val;
	});

	//let bancho_beatmap_versions = get_versions_but_fruits(bancho_beatmap_info.beatmaps, 'version');

	//сравнить локальные и банчо карты
	const bancho_beatmap_md5s = GET_VALUES_FROM_OBJECT_BY_KEY(bancho_beatmapset.beatmaps, 'checksum');
	const local_beatmap_md5s = GET_VALUES_FROM_OBJECT_BY_KEY(beatmapset.beatmap, 'md5_hash');

	for (let bancho_md5 of bancho_beatmap_md5s) {
		if (local_beatmap_md5s.indexOf(bancho_md5) == -1) {
			console.log('bancho md5', bancho_beatmap_md5s);
			console.log('local md5', local_beatmap_md5s);
			console.log(' E карты не совпадают.'.red, beatmapset.id);
			console.log(' + будет добавлена в список загрузок'.yellow, beatmapset.id);
			await beatmaps_lists_add('download_map', beatmapset.id);
			return null;
		}
	}

    beatmapset.bancho_beatmap_info = bancho_beatmapset;
	return beatmapset;

}

exports.laser_beatmaps_verify = laser_beatmaps_verify;
