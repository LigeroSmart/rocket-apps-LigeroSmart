import { IHttp, ILogger, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { ILivechatMessage, ILivechatRoom } from "@rocket.chat/apps-engine/definition/livechat";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { UserType } from "@rocket.chat/apps-engine/definition/users";
import { apiUriRocket, apiUriTicketGet } from "./constants";

export default class LigeroSmart {

    public static async ProcessData (
                            eventType: string,
                            read: IRead,
                            persistence: IPersistence,
                            room: ILivechatRoom,
                            message?: ILivechatMessage
                        )
    {
        let data: any = undefined;
        let roomMessages: any;
        const lcRoom = room as ILivechatRoom;
        const roomPersisAss = new RocketChatAssociationRecord(
            RocketChatAssociationModel.ROOM, lcRoom.id
        );

        if(eventType === 'Message' && message){
            if (!lcRoom.visitor) {
                // no visitor identified
                return;
            }

            let messageAsObj = {};
            messageAsObj['_id'] = message.id;
            messageAsObj['msg'] = message.text;
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
                const AttachUrl = serverUrl + message.attachments[0]!.title!.link!;
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

            console.debug(messageAsObj);

            roomMessages = await read.getPersistenceReader().readByAssociation(roomPersisAss);

            console.debug(roomMessages);

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
            const roomPersis = persistence.updateByAssociation(
                roomPersisAss,
                newMessage,
                true,
            );
        }

        // Get messages
        let roomMessagesArray: Array<any> = [];
        roomMessages = await read.getPersistenceReader().readByAssociation(roomPersisAss);

        if (roomMessages && roomMessages[0] && roomMessages[0]['Messages']){
            roomMessagesArray = roomMessages[0]['Messages'];
            console.debug(roomMessagesArray);
        }
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

        return data;
    }

    public static async TicketCleateOrClose(http: IHttp,
                                            read: IRead,
                                            logger: ILogger,
                                            data: any): Promise<string|undefined>
    {
        const ligerosmartServerUrl: string =
            await read.getEnvironmentReader().getSettings().getValueById('ligerosmart_url');

        const ligerosmartServerUserLogin: string =
            await read.getEnvironmentReader().getSettings().getValueById('ligerosmart_user_login');

        const ligerosmartServerUserPass: string =
            await read.getEnvironmentReader().getSettings().getValueById('ligerosmart_user_password');

        data = {
            ...data,
            UserLogin: ligerosmartServerUserLogin || 'rocketchat',
            Password: ligerosmartServerUserPass || 'rocketchat',
        }

        const apiUrlRocket = ligerosmartServerUrl + apiUriRocket;

        const response = await http.post(apiUrlRocket,{
            content: JSON.stringify(data,null,2),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if (response.statusCode !== 200
            || (response.content && JSON.parse(response.content)['Error'])
            ){
            logger.error('Error calling LigeroSmart: ' + response.content);
            return undefined;
        }

        if(!response.content){
            logger.error('Error calling LigeroSmart: got NO return from LigeroSmart');
            return undefined;
        }

        const responseTID = JSON.parse(response.content);

        return responseTID['Tickets'][0];

    }

    public static async TicketNumberGet(http: IHttp, read: IRead, logger: ILogger, TicketID: string): Promise<string|undefined>
    {
        const ligerosmartServerUrl: string =
            await read.getEnvironmentReader().getSettings().getValueById('ligerosmart_url');

        const ligerosmartServerUserLogin: string =
            await read.getEnvironmentReader().getSettings().getValueById('ligerosmart_user_login');

        const ligerosmartServerUserPass: string =
            await read.getEnvironmentReader().getSettings().getValueById('ligerosmart_user_password');

        const apiUrlTicketGet = ligerosmartServerUrl + apiUriTicketGet;

        const ticketGetData = {
            UserLogin: ligerosmartServerUserLogin || 'rocketchat',
            Password: ligerosmartServerUserPass || 'rocketchat',
            TicketID: TicketID
        }

        const responseTN = await http.post(apiUrlTicketGet,{
            content: JSON.stringify(ticketGetData,null,2),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (responseTN.statusCode !== 200
            || (responseTN.content && (JSON.parse(responseTN.content)['Error']))
            ){
            logger.error('Error calling LigeroSmart: ' + responseTN.content);
            return undefined;
        }

        if(!responseTN.content){
            logger.error('Error calling LigeroSmart: There is no content in response 2');
            return undefined;
        }
        const responseTNData = JSON.parse(responseTN.content);

        if (!responseTNData['Ticket'][0]['TicketNumber']){
            logger.error('Error calling LigeroSmart: Could not retrive ticket number');
            return undefined;
        }

        const TicketNumber = responseTNData['Ticket'][0]['TicketNumber'];

        return TicketNumber;
    }
}
