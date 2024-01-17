const fs = require('fs');
const md5File = require('md5-file');

const { beatmap_modes } = require("../misc/consts.js");

function readBeatmap(beatmapPath) {
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
