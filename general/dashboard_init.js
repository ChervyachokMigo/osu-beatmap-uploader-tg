const dashboard = require('dashboard_framework');

const { WEBPORT, SOCKETPORT, DEBUG_DASHBOARD } = require("../misc/settings");

const colors = {
    enable: [59, 124, 255],
    disable: [25, 53, 110],
    processing: [182, 205, 252],
    neutral: [97, 97, 97]
};

const dashboard_init = async () => {
    
    await dashboard.run( WEBPORT, SOCKETPORT );

    await dashboard.set_setting({ name: 'debug', value: DEBUG_DASHBOARD });

    await dashboard.set_status([
        {
            name: 'db_ready',
            text: 'База данных',
            status: 'not',
            values: [
                { name: 'ready', color: colors.enable, text: 'готова' },
                { name: 'processing', color: colors.processing, text: 'инициализация' },
                { name: 'not', color: colors.disable, text: 'не подготовлена' },
            ]
        },
        {
            name: 'osu_auth',
            text: 'Осу логин',
            status: 'off',
            values: [
                { name: 'on', color: colors.enable, text: 'онлайн' },
                { name: 'auth', color: colors.processing, text: 'авторизация' },
                { name: 'off', color: colors.disable, text: 'оффлайн' }
            ]
        },
        {
            name: 'folder',
            text: 'Текущая папка',
            status: 'current',
            values: [
                { name: 'current', color: colors.neutral, text: '' }
            ]
        },
        {
            name: 'action',
            text: 'Действие',
            status: 'init',
            values: [
                { name: 'init', color: colors.neutral, text: 'инициализация' },
                { name: 'read_folder', color: colors.neutral, text: 'чтение папки' },
				{ name: 'verify_beatmaps', color: colors.neutral, text: 'проверка карты' },
                { name: 'make_osz', color: colors.neutral, text: 'создание osz' },
                { name: 'send_desc', color: colors.neutral, text: 'отправка описания' },
                { name: 'send_preview', color: colors.neutral, text: 'отправка превью' },
                { name: 'send_osz', color: colors.neutral, text: 'отправка карты' },
                { name: 'waiting', color: colors.neutral, text: 'ожидание' },
                { name: 'end', color: colors.neutral, text: 'завершено' },
            ]
        },
        
    ]);

    await dashboard.css_apply({ selector: 'body', prop: 'background-color', value: '#313131' });
    await dashboard.create_feed({ feedname: 'events' });
    dashboard.set_notifies({
        folder_path: 'sounds', 
        sounds: [{
            name: 'notify', 
            file: 'notify.mp3'},
        ]
    });
};
exports.dashboard_init = dashboard_init;
