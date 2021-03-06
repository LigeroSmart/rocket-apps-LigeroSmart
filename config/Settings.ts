import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
    LigeroSmartHi = 'ligerosmart_hi',
    LigeroSmartUrl = 'ligerosmart_url',
    LigeroSmartWebserviceName = 'ligerosmart_ws_name',
    ligerosmartNewTicket = 'ligerosmart_new_ticket',
    ligerosmartUserLogin = 'ligerosmart_user_login',
    ligerosmartUserPassword = 'ligerosmart_user_password',
    ligerosmartTelegramBot = 'ligerosmart_telegram_bot',
}

export enum DefaultMessage {
    DEFAULT_LigeroSmartHi = 'Hi!',
    DEFAULT_LigeroSmartUrl = 'http://web',
    DEFAULT_LigeroSmartWebserviceName = 'RocketChat',
    DEFAULT_LigeroSmartNewTicket = 'The ticket %s was created for this chat session.',
    DEFAULT_LigeroSmartUserLogin = 'rocketchat',
    DEFAULT_LigeroSmartUserPassword = 'rocketchat',
}

export const settings: Array<ISetting> = [
    {
        id: AppSetting.LigeroSmartUrl,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_LigeroSmartUrl,
        i18nLabel: 'ligerosmart_url',
        required: true,
    },
    {
        id: AppSetting.LigeroSmartWebserviceName,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_LigeroSmartWebserviceName,
        i18nLabel: 'ligerosmart_ws_name',
        required: true,
    },
    {
        id: AppSetting.LigeroSmartHi,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_LigeroSmartHi,
        i18nLabel: 'ligerosmart_hi',
        i18nDescription: 'ligerosmart_hi_desc',
        required: false,
    },
    {
        id: AppSetting.ligerosmartNewTicket,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_LigeroSmartNewTicket,
        i18nLabel: 'ligerosmart_new_ticket',
        required: false,
    },
    {
        id: AppSetting.ligerosmartUserLogin,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_LigeroSmartUserLogin,
        i18nLabel: 'ligerosmart_user_login',
        required: true,
    },
    {
        id: AppSetting.ligerosmartUserPassword,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_LigeroSmartUserPassword,
        i18nLabel: 'ligerosmart_user_password',
        required: true,
    },
    {
        id: AppSetting.ligerosmartTelegramBot,
        public: true,
        type: SettingType.STRING,
        packageValue: undefined,
        i18nLabel: 'ligerosmart_bot_label',
        i18nDescription: 'ligerosmart_bot_desc',
        required: false,
    },
];
