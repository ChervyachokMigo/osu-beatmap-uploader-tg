const path = require("path")

module.exports = {
    WEBPORT: 4461,
    SOCKETPORT: 4462,
    DEBUG_DASHBOARD: false,
    last_beatmap_path: path.join('data', 'last_beatmap'),
    error_log_path: path.join('data', 'logs', 'errors.txt'),
}