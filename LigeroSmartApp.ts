import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPostMessageSent, MessageProcessingType } from '@rocket.chat/apps-engine/definition/messages';
import { ILivechatRoom, IPostLivechatRoomClosed } from '@rocket.chat/apps-engine/definition/livechat';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { settings } from './config/Settings';
import LigeroSmart from './src/LigeroSmart';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

export class LigeroSmartApp extends App implements IPostMessageSent, IPostLivechatRoomClosed  {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
        ): Promise<void>
    {

        if (!message.text && !message.attachments) {
            return;
        }

        if (message.room.type !== RoomType.LIVE_CHAT) {
            // not a livechat
            return;
        }

        console.debug(message);

        const data = await LigeroSmart.ProcessData('Message',read,persistence, message.room as ILivechatRoom, message);

        if(!data){
            return;
        }

        const TicketID = await LigeroSmart.TicketCleateOrClose(
            http,
            read,
            this.getLogger(),
            data
        )

        if (!TicketID){
            return;
        }

        const TicketNumber = await LigeroSmart.TicketNumberGet(
            http,
            read,
            this.getLogger(),
            TicketID,
        );

        console.log('CHEGOU YYYYYYYYYYYYYYYYYYYYYYYYYYYY ' + TicketNumber);
    }

    public async executePostLivechatRoomClosed(
        room: ILivechatRoom,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        // modify?: IModify
        ): Promise<void>
    {
        const data = await LigeroSmart.ProcessData('LivechatSession',read,persistence, room);

        if(!data){
            return;
        }

        const TicketID = await LigeroSmart.TicketCleateOrClose(
            http,
            read,
            this.getLogger(),
            data
        )

        if (!TicketID){
            return;
        }

        const TicketNumber = await LigeroSmart.TicketNumberGet(
            http,
            read,
            this.getLogger(),
            TicketID,
        );

        console.log('CHEGOU XXXXXXXXXXXXXXXXX ' + TicketNumber);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
    }
}
