require('colors');
var log = console.log.bind(console)
module.exports = {
	progressbar_default: "█",
	progressbar_empty_default: "_",

	progressbar_length: 10,
	progressbar: '', 
	progressbar_empty: '',
	tasks: [],

	setDefault: function (progressbar_length = 10, tasks = []){
		this.progressbar_length = progressbar_length;
		this.progressbar_default = "█".repeat(progressbar_length);
		this.progressbar_empty_default = "_".repeat(progressbar_length);
		this.tasks = tasks
	},

	PrintProcents: function (procent){
		let progressbar_count = Math.trunc(procent*this.progressbar_length/100);
		if (progressbar_count>this.progressbar_length){
			progressbar_count = this.progressbar_length;
		}
		this.progressbar = this.progressbar_default.substring(0, progressbar_count);
		this.progressbar_empty = this.progressbar_empty_default.substring(0, this.progressbar_length - progressbar_count);
		
		console.clear();
		log ("[UPLOADING]")
		for (let task of this.tasks){
			log (task)
		}
		log ("╔".gray+'═'.repeat(this.progressbar_length).gray+"╗".gray);
		log ("║".gray+this.progressbar+this.progressbar_empty.black+"║".gray);
		log ("╚".gray+'═'.repeat(this.progressbar_length).gray+"╝".gray);
	},


}