const fs = require('fs');

function getLastBeatmap() {
    try {
        var lastbeatmap = '';
        lastbeatmap = fs.readFileSync('lastbeatmap.txt', { encoding: 'utf-8' });
        lastbeatmap = lastbeatmap.trim();
    } catch (e) {
        console.log(e);
        lastbeatmap = false;
    }
    return lastbeatmap;
}
exports.getLastBeatmap = getLastBeatmap;
