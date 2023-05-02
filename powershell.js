
const spawn = require('child_process').spawn;
const util = require('util');
const os = require('os');

const progessbar = require('./progress-bar.js');

const powershellCmd = 'Get-WmiObject Win32_PerfRawData_Tcpip_NetworkInterface | select Name,BytesReceivedPersec,BytesSentPersec,BytesTotalPersec | fl'
const _psToUTF8 = '$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8 ; ';

var sended_mb_total = 0;
var sended_mb_start = 0;
var last_file_size = 0;
var powershell_isfirstupdate = false;
var powershell_timers = [];

const powershell = spawn('powershell.exe', ['-NoLogo', '-InputFormat', 'Text', '-NoExit', '-ExecutionPolicy', 'Unrestricted', '-Command', '-'], {
    stdio: 'pipe',
    windowsHide: true,
    maxBuffer: 1024 * 20000,
    encoding: 'UTF-8',
    env: util._extend({}, process.env, { LANG: 'en_US.UTF-8' })
});

powershell.on('error', function (e) {
    console.log(e.toString('utf8'))
});

powershell.stderr.on('data', function (data) {
    console.log(data.toString('utf8'));
});

powershell.on('close', function () {
    powershell.kill();
});

powershell.stdout.on('data', function (data) {
    data = data.toString('utf8').trim();
    if (data.length>0){
        data = data.split('\r\n');
        data = data.map((v)=>v.split(':').map((v2)=>v2.trim()));
        data.map((v)=>{
            switch (v[0]){
                case 'BytesSentPersec':
                    if (parseInt(v[1])>0){
                        sended_mb_total = parseInt(v[1])/1048576;
                        if(!powershell_isfirstupdate){
                            sended_mb_start = sended_mb_total;
                            powershell_isfirstupdate = true;
                        } else {
                            if (powershell_timers.length == 0) {
                                sended_mb_start = sended_mb_total;
                                powershell_timers.push(setInterval( powershell_call, 1000));
                            }
                        }
                    };
                    let sended_mb = Number(sended_mb_total)-Number(sended_mb_start);
                    if (last_file_size > 0){
                        let file_procent = Number(sended_mb)/Number(last_file_size)*100;
                        let file_upload_progress_info = 'FILESIZE: ' + sended_mb.toFixed(2)+ ' / '+ last_file_size.toFixed(2) + ' МБ';
                            if (typeof progessbar.tasks[2]=='undefined'){
                                progessbar.tasks.push(file_upload_progress_info );
                            } else {
                                progessbar.tasks[2] = file_upload_progress_info;
                               
                            }
                        
                        progessbar.PrintProcents(file_procent);

                            //console.log(` * отправка файла %s\%, %s / %s MB`, file_procent.toFixed(2), sended_mb.toFixed(2), last_file_size.toFixed(2));
                    }
                    break;
                case 'Name':
                    //console.log(v[1])
                    break;
                default:
                    break;
            }
        })
        

        
    }
});

function powershell_call(){
    try {
        powershell.stdin.write(_psToUTF8 + powershellCmd + os.EOL);
    } catch (e) {
        console.log(e.toString('utf8'));
    }
}

function powershell_sended_calc_start(filename, folder_counter){
    let task = [`FOLDER: ${folder_counter.number}/${folder_counter.length}`,'FILENAME: '+filename];

    progessbar.setDefault(50, task);

    for (let timer of powershell_timers){
        clearInterval(timer);
    }
    powershell_timers = [];
    powershell_call();
}

function powershell_sended_calc_end(){
    for (let timer of powershell_timers){
        clearInterval(timer);
    }
    powershell_timers = [];
}

function powershell_set_filesize(filesize){
    last_file_size = filesize;
}

module.exports = {
    powershell_sended_calc_start: powershell_sended_calc_start,
    powershell_sended_calc_end: powershell_sended_calc_end,
    powershell_call: powershell_call,
    powershell_set_filesize: powershell_set_filesize
}