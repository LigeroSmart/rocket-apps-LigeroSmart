import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
    LigeroSmartHi = 'ligerosmart_hi',
    LigeroSmartBye = 'ligerosmart_bye',
    LigeroSmartUrl = 'ligerosmart_url',
    ligerosmartNewTicket = 'ligerosmart_new_ticket',
    ligerosmartUserLogin = 'ligerosmart_user_login',
    ligerosmartUserPassword = 'ligerosmart_user_password',
}

export enum DefaultMessage {
    DEFAULT_LigeroSmartHi = 'Hi!',
    DEFAULT_LigeroSmartBye = 'Thanks!',
    DEFAULT_LigeroSmartUrl = 'http://web',
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
        id: AppSetting.LigeroSmartHi,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_LigeroSmartHi,
        i18nLabel: 'ligerosmart_hi',
        i18nDescription: 'ligerosmart_hi_desc',
        required: false,
    },
    {
        id: AppSetting.LigeroSmartBye,
        public: true,
        type: SettingType.STRING,
        packageValue: DefaultMessage.DEFAULT_LigeroSmartBye,
        i18nLabel: 'ligerosmart_bye',
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
];
