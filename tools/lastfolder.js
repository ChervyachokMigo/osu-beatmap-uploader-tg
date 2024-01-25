const lastfolder = {
    number: 0,
    length: 0,
};

module.exports = {
    get: () => lastfolder,
    inc: () => lastfolder.number++,
    set_len: (len) => lastfolder.length = len,
    get_info: () => `[${lastfolder.number}/${lastfolder.length}]`
}