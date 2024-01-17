const { existsSync, mkdirSync } = require("fs-extra");

const formatAddZero = (t, symbols = 1) => {
    let res = t.toString();
    const num_len = res.length;

    if (num_len < symbols) {
        for (let i = 0; i < symbols - num_len; i++) {
            res = `0${res}`;
        }
    }
    return res;
}

module.exports = {
    escapeString: (text) => {
        return text.replace(/[&\/\\#+$~%'":*?<>{}|]/g, '');
    },

    checkDir: (dir_path) => {
        if (!existsSync(`${dir_path}`)) 
            mkdirSync(`${dir_path}`, {recursive: true});
    },

    formatAddZero,

    get_date_string(date){
        return `${date.getFullYear()}-${formatAddZero(date.getMonth()+1, 2)}-${formatAddZero(date.getDate(), 2)}`;
    },

    GET_VALUES_FROM_OBJECT_BY_KEY: (arr, key) => {
        let res = [];
        for (let data of arr){
            res.push(data[key]);
        }
        return res;
    },

    get_versions_but_fruits: (arr, key) => {
        var res = [];
        for (let data of arr){
            if (data.mode_int !== 2){
                res.push(data[key]);
            }
        }
        return res;
    },

}