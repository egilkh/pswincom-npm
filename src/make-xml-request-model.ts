import { Builder } from 'xml2js';
import { dateToTimestamp } from './date-to-timestamp';
import { SmsOptions, XmlRequestModel } from './types';

export const makeXmlRequestModel = (options: SmsOptions): string => {
  const requestModel: XmlRequestModel = {
    SESSION: {
      CLIENT: options.username,
      PW: options.password,
      MSGLST: {
        MSG: options.receivers.map((rcv, index) => {
          return {
            ID: index + 1,
            OP: options.operation || 1,
            TEXT: options.message,
            SND: options.sender,
            RCV: rcv,
          };
        }),
      },
    },
  };

  if (options.deliveryTime) {
    const deliveryTimeStamp = dateToTimestamp(options.deliveryTime);
    for (const m of requestModel.SESSION.MSGLST.MSG) {
      m.DELIVERYTIME = deliveryTimeStamp;
    }
  }

  const xml2jsBuilder = new Builder({});

  return xml2jsBuilder.buildObject(requestModel);
};
