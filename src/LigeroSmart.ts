import { IHttp, ILogger, IRead } from "@rocket.chat/apps-engine/definition/accessors";
import { apiUriRocket, apiUriTicketGet } from "./constants";

export default class LigeroSmart {

    public static async TicketCleateOrClose(http: IHttp,
                                            read: IRead,
                                            logger: ILogger,
                                            data: any): Promise<string|undefined>
    {
        // data['type'] = 'Message';
        // TODO: quando for encerramento
        // data['type'] = 'LivechatSession';
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
