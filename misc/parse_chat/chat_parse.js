const fs = require( 'fs');

var file_json = JSON.parse(fs.readFileSync('chat_result.json'));

console.dir(1, {depth: null})


fs.writeFileSync('sended_from_chat.json', JSON.stringify(get_ids(file_json)));


function get_ids(file_json){
    var ids = [];
    for (let message of file_json.messages){
        let link_obj = message.text_entities.filter(value=>value.type === 'link').shift();
        if (link_obj !== undefined){
            if (link_obj.text.startsWith('https://')){
                let beatmapset_id = Number(link_obj.text.split('/').pop());
                if (!isNaN(beatmapset_id)){
                    ids.push(beatmapset_id);
                }
            }
        }
    }
    return {beatmapset_ids: ids}
    
}