var colors = require('colors');
const { get_date_string, GET_VALUES_FROM_OBJECT_BY_KEY } = require("./tools");

function makeCaption(beatmapset, short = 0) {
    var caption = ``;

    caption += beatmapset.artist ? `Artist: ${beatmapset.artist}\n` : '';
    caption += beatmapset.title ? `Title: ${beatmapset.title}\n` : '';
    caption += beatmapset.creator ? `Creator: ${beatmapset.creator}\n` : '';
    caption += beatmapset.bancho_beatmap_info.status ? `Status: #${beatmapset.bancho_beatmap_info.status}\n` : '';
    caption += beatmapset.source ? `Source: ${beatmapset.source}\n` : '';
    caption += beatmapset.tags ? `Tags: ${(beatmapset.tags.join(' '))}\n` : '';
    caption += beatmapset.bancho_beatmap_info.ranked_date ? `Date: ${get_date_string(new Date(beatmapset.bancho_beatmap_info.ranked_date))}\n` : '';

    var beatmap_srs = [];
    for (let i in beatmapset.beatmap) {
        let bancho_beatmap = beatmapset.bancho_beatmap_info.beatmaps.filter(val => beatmapset.beatmap[i].md5_hash === val.checksum);
        if (bancho_beatmap.length > 0) {

            beatmapset.beatmap[i].difficulty_rating = Number(bancho_beatmap[0].difficulty_rating);
            beatmap_srs.push(Math.trunc(Number(bancho_beatmap[0].difficulty_rating)));
        }
    }

    beatmap_srs = beatmap_srs.filter((value, index, self) => { return self.indexOf(value) === index; });

    beatmap_srs.sort();

    beatmapset.beatmap.sort((a, b) => b.difficulty_rating - a.difficulty_rating);

    let beatmaplimits = beatmapset.beatmap.length - short;
    let beatmap_counts = 0;

    for (let beatmap of beatmapset.beatmap) {
        if (beatmap_counts < beatmaplimits) {
            caption += beatmap.difficulty + ' | ';
            if (beatmap.difficulty_rating !== undefined) {
                caption += beatmap.difficulty_rating + '★ | ';
            }
            caption += beatmap.md5_hash + '\n';
            /*caption += beatmap.AR?`▸ AR: ${beatmap.AR} `:'';
            caption += beatmap.OD?`▸ OD: ${beatmap.OD} `:'';
            caption += beatmap.CS?`▸ CS: ${beatmap.CS} `:'';
            caption += beatmap.HP?`▸ HP: ${beatmap.HP}`:'';*/
            //caption += beatmap.OD?'\n':'';
            //caption += '\n';
        }
        beatmap_counts++;
    }

    if (beatmaplimits < beatmapset.beatmap.length) {
        if (beatmap_counts >= beatmaplimits) {
            caption += `...и еще ${beatmap_counts - beatmaplimits + 1} карт\n`;
        }
    }

    var gamemodes = GET_VALUES_FROM_OBJECT_BY_KEY(beatmapset.beatmap, 'gamemode').filter((value, index, self) => { return self.indexOf(value) === index; });
    gamemodes = gamemodes.map(i => '#' + i);
    caption += gamemodes.join(' ');
    caption += '\n';

    if (beatmap_srs.length > 0) {
        beatmap_srs = beatmap_srs.map(i => '#' + i + '_star');
        caption += beatmap_srs.join(' ');
        caption += '\n';
    }

    if (beatmapset.bancho_beatmap_info.ranked_date) {
        caption += '#ranked_' + new Date(beatmapset.bancho_beatmap_info.ranked_date).getFullYear();
        caption += '\n';
    }

    caption += `LINK: https://osu.ppy.sh/beatmapsets/${beatmapset.id}\n`;

    if (caption.length > 1024) {
        console.log(' L слишком длинное сообщение, пробуем убрать одну сложность'.yellow, beatmapset.id);
        return false;
    }

    return caption;
}
exports.makeCaption = makeCaption;
