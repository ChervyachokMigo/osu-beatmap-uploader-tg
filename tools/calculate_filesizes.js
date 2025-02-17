const { fstatSync, statSync } = require("fs-extra");

function calculate_filesizes(files) {
	let size = 0;
	if (files.length > 0) {
		for (let filepath of files) {
			const filestats = statSync(filepath);
			size += filestats.size;
		}
		return size;
	}
	return null;
}

exports.calculate_filesizes = calculate_filesizes;