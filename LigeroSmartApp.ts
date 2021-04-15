import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo, RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser, UserType } from '@rocket.chat/apps-engine/definition/users';
import { settings } from './config/Settings';
import LigeroSmart from './src/LigeroSmart';

export class LigeroSmartApp extends App implements IPostMessageSent  {
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
        let data: any;

        // if (message.room.type !== RoomType.LIVE_CHAT || (message.sender.type !== UserType.UNKNOWN)) {
        if (message.room.type !== RoomType.LIVE_CHAT) {
            // not a livechat
            return;
        }
        const lcRoom = message.room as ILivechatRoom;
        if (!lcRoom.visitor) {
            // no visitor identified
            return;
        }

        const roomPersisAss = new RocketChatAssociationRecord(
            RocketChatAssociationModel.ROOM, lcRoom.id
        );

        let messageAsObj = {};
        messageAsObj['_id'] = message.id;
        messageAsObj['msg'] = message.text || '';
        messageAsObj['ts']  = message.updatedAt;
        messageAsObj['username'] = message.sender.username;
        messageAsObj['userType'] = message.sender.type;
        messageAsObj['u'] = {
                 _id:  message.sender.id,
            username: message.sender.username,
                name: message.sender.name,
        }
        if (message.sender.type === UserType.USER
            || message.sender.type === UserType.BOT
            || message.sender.type === UserType.APP)
        {
                messageAsObj['agentId']  = message.sender.username;
        }

        if (message.attachments) {
            const serverUrl = await read.getEnvironmentReader().getServerSettings().getValueById('Site_Url');
            const AttachUrl = serverUrl + message.attachments[0].title!.link;
            messageAsObj['fileUpload'] = {
                publicFilePath: AttachUrl
            };

            let FileType = 'application/octet-stream';
            if (message.attachments[0].title?.value?.match(/.png$/gi) ) {
                FileType = 'image/png';
            } else if (message.attachments[0].title?.value?.match(/\.(jpg|jpeg)$/gi) ) {
                FileType = 'image/jpeg';
            } else if (message.attachments[0].title?.value?.match(/\.gif$/gi) ) {
                FileType = 'image/giv';
            } else if (message.attachments[0].title?.value?.match(/\.ogg$/gi) ) {
                FileType = 'audio/ogg';
            } else if (message.attachments[0].title?.value?.match(/\.mp3$/gi) ) {
                // Note, Zenvia API is not compatible right now with audio/mp3, so, let's use audio/mp4
                FileType = 'audio/mp4';
            } else if (message.attachments[0].title?.value?.match(/\.wav$/gi) ) {
                FileType = 'audio/wav';
            } else if (message.attachments[0].title?.value?.match(/\.mp4$/gi) ) {
                FileType = 'video/mp4';
            } else if (message.attachments[0].title?.value?.match(/\.pdf$/gi) ) {
                FileType = 'application/pdf';
            }
            messageAsObj['file'] = {
                type: FileType,
                name: message.attachments[0].title?.value,
            };
            // TODO: check if two way works or treat imageUrl, audioUrl and videoUrl separetely
        }

        let roomMessages = await read.getPersistenceReader().readByAssociation(roomPersisAss);

        let newMessage = {};
        if (!roomMessages || !roomMessages[0] || !roomMessages[0]['Messages']){
            newMessage = {
                Messages: [
                    messageAsObj
                ]
            };
        } else {
            const rMsg = roomMessages[0]['Messages'];
            newMessage = {
                Messages: [
                    ...rMsg,
                    messageAsObj
                ]
            };
        }

        const roomPersis = await persistence.updateByAssociation(
            roomPersisAss,
            newMessage,
            true,
        );

        // Get messages
        let roomMessagesArray: Array<any> = [];
        roomMessages = await read.getPersistenceReader().readByAssociation(roomPersisAss);

        if (roomMessages && roomMessages[0] && roomMessages[0]['Messages']){
            roomMessagesArray = roomMessages[0]['Messages'];
        }

        let eventType = 'Message';

        data = {
            _id: lcRoom.id,
            type: eventType,
            messages: roomMessagesArray,
        }

        const servedBy = lcRoom.servedBy;
        if (servedBy) {
            data = {
                ...data,
                agent: {
                         _id: servedBy.id || '',
                        name: servedBy.name || '',
                    username: servedBy.username || '',
                       email: servedBy.emails[0].address || '',
                }
            }
        }

        const liveVisitor = lcRoom.visitor;

        if (!liveVisitor) {
            // no phone in visitor
            return;
        }

        data = {
            ...data,
            visitor: liveVisitor || {},
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
