const fs = require('fs')

module.exports = (folder_path) => {
    fs.rmSync(folder_path, { recursive: true, force: true });
}