import { IHttp, ILogger, IPersistence, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { IDepartment, ILivechatMessage, ILivechatRoom } from "@rocket.chat/apps-engine/definition/livechat";
import { RocketChatAssociationModel, RocketChatAssociationRecord } from "@rocket.chat/apps-engine/definition/metadata";
import { UserType } from "@rocket.chat/apps-engine/definition/users";
import { apiUriRocket, apiUriTicketGet } from "./constants";

export default class LigeroSmart {

    public static async ProcessData (
                            eventType: string,
                            read: IRead,
                            persistence: IPersistence,
                            room: ILivechatRoom,
                            message?: ILivechatMessage,
                            logger?: ILogger
                        )
    {
        if(logger){
            // logger.debug('PD: 1')
        }

        let data: any = undefined;
        let roomMessages: any;
        const lcRoom = room as ILivechatRoom;
        // Workaroung to get TAGs
        const fullRoomInfo = JSON.parse(JSON.stringify(lcRoom));

        if(logger){
            // logger.debug('PD: 2')
        }

        const roomPersisAss = new RocketChatAssociationRecord(
            RocketChatAssociationModel.ROOM, lcRoom.id
        );
        if(logger){
            // logger.debug('PD: 3')
        }

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
            if (message.sender.emails
                && message.sender.emails[0]
                && message.sender.emails[0].address){
                    messageAsObj['email'] = message.sender.emails[0].address;
                } else {
                    messageAsObj['email'] = '';
                }

            messageAsObj['u'] = {
                        _id:  message.sender.id,
                        username: message.sender.username,
                        name: message.sender.name,
                        email: messageAsObj['email'],
            }
            if (message.sender.type === UserType.USER
                || message.sender.type === UserType.BOT
                || message.sender.type === UserType.APP)
            {
                    messageAsObj['agentId']  = message.sender.username;
            }
            if(logger){
                // logger.debug('PD: 4')
            }

            if (message.attachments) {
                const serverUrl = await read.getEnvironmentReader().getServerSettings().getValueById('Site_Url');
                let FileType = 'application/octet-stream';

                let AttachUrl =
                    message.attachments[0].imageUrl ||
                    message.attachments[0].audioUrl ||
                    message.attachments[0].videoUrl ||
                    message.attachments[0]!.title!.link!;

                if (AttachUrl.indexOf('http')!=0){
                    AttachUrl = `${serverUrl+AttachUrl}`;
                }

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

                messageAsObj['fileUpload'] = {
                    publicFilePath: AttachUrl
                };

            }

            // console.debug(messageAsObj);
            if(logger){
                // logger.debug('PD: 5')
            }

            roomMessages = await read.getPersistenceReader().readByAssociation(roomPersisAss);

            // console.debug(roomMessages);
            if(logger){
                // logger.debug('PD: 6')
            }

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
            if(logger){
                // logger.debug('PD: 7')
            }

            const roomPersis = persistence.updateByAssociation(
                roomPersisAss,
                newMessage,
                true,
            );
        }
        if(logger){
            // logger.debug('PD: 8')
        }

        // Get messages
        let roomMessagesArray: Array<any> = [];
        roomMessages = await read.getPersistenceReader().readByAssociation(roomPersisAss);
        if(logger){
            // logger.debug('PD: 9')
        }

        if (roomMessages && roomMessages[0] && roomMessages[0]['Messages']){
            roomMessagesArray = roomMessages[0]['Messages'];
            // console.debug(roomMessagesArray);
        }
        if(logger){
            // logger.debug('PD: 10')
        }

        data = {
            _id: lcRoom.id,
            type: eventType,
            messages: roomMessagesArray,
            tags: fullRoomInfo._unmappedProperties_?.tags || undefined,
        }
        if(logger){
            // logger.debug('PD: 10.1')
        }

        const servedBy = lcRoom.servedBy;
        if(logger){
            // logger.debug('PD: 10.2')
        }

        let mailAddress='';
        if(servedBy && servedBy.emails && servedBy.emails[0] && servedBy.emails[0].address){
            mailAddress = servedBy.emails[0].address || '';
        }
        if (servedBy) {
            data = {
                ...data,
                agent: {
                            _id: servedBy.id || '',
                        name: servedBy.name || '',
                    username: servedBy.username || '',
                        email: mailAddress,
                }
            }
        }
        if(logger){
            // logger.debug('PD: 11')
        }

        const liveVisitor = lcRoom.visitor;

        if (!liveVisitor) {
            // no phone in visitor
            return;
        }

        data = {
            ...data,
            visitor: liveVisitor || {},
            departmentName: lcRoom.department?.name
        }
        if(logger){
            // logger.debug('PD: 12')
        }

        if (data.visitor &&
            data.visitor.visitorEmails &&
            data.visitor.visitorEmails[0] &&
            data.visitor.visitorEmails[0].address){
            data.visitor = {
                ...data.visitor,
                email: data.visitor.visitorEmails[0].address
            }
        }

        return data;
    }

    public static async TicketCreateOrClose(http: IHttp,
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
        if (!response || !response.statusCode || response.statusCode !== 200
            || (response.content && JSON.parse(response.content)['Error'])
            ){
            logger.error('Error calling LigeroSmart: ' + response.content);
            return undefined;
        }

        if(!response || !response.content){
            logger.error('Error calling LigeroSmart: got NO return from LigeroSmart');
            return undefined;
        }

        const responseTID = JSON.parse(response.content);
        if (responseTID && responseTID['Tickets'] && responseTID['Tickets'][0]){
            return responseTID['Tickets'][0];
        } else {
            return undefined;
        }


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

        if (!responseTN || !responseTN.statusCode || responseTN.statusCode !== 200
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

    public static async SendTelegramMessage(http: IHttp, text: String, token: String, telegramChannel): Promise<void> {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const { data } = await http.post(url, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            content: JSON.stringify({
                chat_id: telegramChannel.session_id,
                text,
            })
        });
        const { ok } = data;
        if (!ok) {
            throw new Error(`LigeroSmart could not send message through Telegram channel ${JSON.stringify(data)}`);
        }
    };
}
