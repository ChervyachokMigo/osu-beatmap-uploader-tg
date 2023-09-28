const { v2, auth } = require ('osu-api-extended');

const { osu_api_error_restart_ms, OSU_LOGIN, OSU_PASSWORD } = require('./config.js');

module.exports = {
    v2: function (){
        return v2;
    },

    init_osu: async function (){     
        var token = await auth.login_lazer(OSU_LOGIN, OSU_PASSWORD);
        if (typeof token.access_token === 'undefined'){
            await new Promise(resolve => setTimeout(resolve, osu_api_error_restart_ms));
            throw new Error('osu not auth. restart');
        }
    },

    get_beatmap_info: async function(beatmapsetid){
        try{
            console.log(beatmapsetid)
            return await v2.beatmap.set.details(beatmapsetid).catch(reason=> { return reason; });

        }
        catch (e){
            console.log(e);
            await new Promise(resolve => setTimeout(resolve, osu_api_error_restart_ms));
            throw new Error('error beatmap');
        }
    },
}
