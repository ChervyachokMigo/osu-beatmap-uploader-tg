const fs = require('fs');
const md5File = require('md5-file');

const { beatmap_modes } = require("../misc/consts.js");
const { parse_osu_file, osu_file_beatmap_property } = require('osu-tools');

const beatmap_props = [
    osu_file_beatmap_property.metadata_artist,
    osu_file_beatmap_property.metadata_title,
    osu_file_beatmap_property.metadata_creator,
    osu_file_beatmap_property.metadata_version,
    osu_file_beatmap_property.metadata_beatmap_id,
    osu_file_beatmap_property.metadata_beatmapset_id,
    osu_file_beatmap_property.general_gamemode,
    osu_file_beatmap_property.metadata_source,
    osu_file_beatmap_property.metadata_tags,
    osu_file_beatmap_property.difficulty_Approach_Rate,
    osu_file_beatmap_property.difficulty_Circle_Size,
    osu_file_beatmap_property.difficulty_Health_Points_drain_rate,
    osu_file_beatmap_property.difficulty_Overall_Difficulty,
    osu_file_beatmap_property.events_backgrounds,
    osu_file_beatmap_property.metadata_beatmap_md5
]

function readBeatmap(beatmapPath) {
    //const beatmap_data = parse_osu_file(beatmapPath, beatmap_props, {is_hit_objects_only_count: true, is_parse_sliders: false });
    //console.log('beatmap_data', beatmap_data);
    function getPropery(data) {
        var res = data.split(':');
        res.shift();
        return res.join(':').trim();
    }

    let beatmap_text = fs.readFileSync(beatmapPath, { encoding: 'utf-8' }).split("\n");

    let res = {};

    res.md5_hash = md5File.sync(beatmapPath);

    for (let beatmap_row of beatmap_text) {
        if (beatmap_row.toLowerCase().trim().startsWith("artist:") == true) {
            res.artist = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("title:") == true) {
            res.title = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("creator:") == true) {
            res.creator = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("version:") == true) {
            res.difficulty = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("beatmapid") == true) {
            res.beatmapID = getPropery(beatmap_row);
            res.id = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("beatmapsetid") == true) {
            res.beatmapsetID = getPropery(beatmap_row);
        }

        if (beatmap_row.toLowerCase().trim().startsWith("mode") == true) {
            res.gamemode = beatmap_modes[Number(getPropery(beatmap_row))];
        }

        if (beatmap_row.toLowerCase().trim().startsWith("source") == true) {
            res.source = getPropery(beatmap_row);
        }
        if (beatmap_row.toLowerCase().trim().startsWith("tags") == true) {
            res.tags = getPropery(beatmap_row);
        }
        if (beatmap_row.toUpperCase().trim().startsWith("HPDRAINRATE") == true) {
            res.HP = getPropery(beatmap_row);
        }
        if (beatmap_row.toUpperCase().trim().startsWith("CIRCLESIZE") == true) {
            res.CS = getPropery(beatmap_row);
        }
        if (beatmap_row.toUpperCase().trim().startsWith("OVERALLDIFFICULTY") == true) {
            res.OD = getPropery(beatmap_row);
        }
        if (beatmap_row.toUpperCase().trim().startsWith("APPROACHRATE") == true) {
            res.AR = getPropery(beatmap_row);
        }
    }

    if (!res.gamemode) {
        res.gamemode = beatmap_modes[0];
    }

    return res;
}
exports.readBeatmap = readBeatmap;
