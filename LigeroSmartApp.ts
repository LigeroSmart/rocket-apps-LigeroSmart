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
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { ILivechatRoom, IPostLivechatRoomClosed } from '@rocket.chat/apps-engine/definition/livechat';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { settings } from './config/Settings';
import LigeroSmart from './src/LigeroSmart';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
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
        // this.getLogger().debug('m: 1');

        if (!message.text && !message.attachments) {
            return;
        }
        // this.getLogger().debug('m: 2');

        if (message.room.type !== RoomType.LIVE_CHAT) {
            // not a livechat
            return;
        }

        const appUser = await read.getUserReader().getAppUser(this.getID());
        // console.debug(message);
        // this.getLogger().debug('m: 3');

        let first=0;
        if(!message.room.customFields || !message.room.customFields.LigeroSmartFirstMessage){
            const roomUp = await modify.getExtender().extendRoom(message.room.id,{} as IUser);
            roomUp.addCustomField('LigeroSmartFirstMessage', '1');
            await modify.getExtender().finish(roomUp);
            first=1;
        }

        const data = await LigeroSmart.ProcessData('Message',read,persistence, message.room as ILivechatRoom, message, this.getLogger());
        // this.getLogger().debug('m: 4');
        if(!data){
            return;
        }

        // SEND HI AND TICKET NUMBER #####################################################
        // this.getLogger().debug('m: 5');
        if(!first){
            return;
        }
        const TicketID = await LigeroSmart.TicketCreateOrClose(
            http,
            read,
            this.getLogger(),
            data
        )
        // this.getLogger().debug('m: 6');
        if (!TicketID){
            return;
        }
        // this.getLogger().debug('m: 7');
        const TicketNumber = await LigeroSmart.TicketNumberGet(
            http,
            read,
            this.getLogger(),
            TicketID,
        ) || '';
        // this.getLogger().debug('m: 8 - TN='+TicketNumber);

        // Check if Telegram is enabled
        const telegramToken = await (await read.getEnvironmentReader().getSettings().getById('ligerosmart_telegram_bot')).value;



        const hiMessageText =
            await (await read.getEnvironmentReader().getSettings().getById('ligerosmart_hi')).value;
        if(hiMessageText){
            const hiMessage = modify.getCreator().startLivechatMessage();
            hiMessage.setText(hiMessageText).setRoom(message.room).setSender(appUser!);
            await modify.getCreator().finish(hiMessage);

            if(telegramToken && message.room.customFields && message.room.customFields.telegramChannel){
                await LigeroSmart.SendTelegramMessage(http, hiMessageText, telegramToken, message.room.customFields.telegramChannel);
            }
        }

        let ticketMessageText:String =
            await (await read.getEnvironmentReader().getSettings().getById('ligerosmart_new_ticket')).value;
        if(ticketMessageText){
            ticketMessageText = ticketMessageText.replace('%s',TicketNumber);
            const ticketMessage = modify.getCreator().startLivechatMessage();
            ticketMessage.setText(ticketMessageText.toString()).setRoom(message.room).setSender(appUser!);
            await modify.getCreator().finish(ticketMessage);

            if(telegramToken && message.room.customFields && message.room.customFields.telegramChannel){
                await LigeroSmart.SendTelegramMessage(http, ticketMessageText, telegramToken, message.room.customFields.telegramChannel);
            }
        }
    }

    public async executePostLivechatRoomClosed(
        room: ILivechatRoom,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        // modify?: IModify
        ): Promise<void>
    {
        // this.getLogger().debug('c: 1');
        const data = await LigeroSmart.ProcessData('LivechatSession',read,persistence, room,undefined,this.getLogger());
        // this.getLogger().debug('c: 2');
        if(!data){
            return;
        }
        // this.getLogger().debug('c: 3');
        const TicketID = await LigeroSmart.TicketCreateOrClose(
            http,
            read,
            this.getLogger(),
            data
        )
        // this.getLogger().debug('c: 4');
        return;
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
    }
}
