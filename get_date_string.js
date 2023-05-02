const { formatAddZero } = require("./index");

function get_date_string(date) {
    return `${date.getFullYear()}-${formatAddZero(date.getMonth() + 1, 2)}-${formatAddZero(date.getDate(), 2)}`;
}
exports.get_date_string = get_date_string;
