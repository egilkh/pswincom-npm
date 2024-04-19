import { Builder } from 'xml2js';
import { dateToTimestamp } from './date-to-timestamp';
import { SmsOptions, XmlRequestModel } from './types';

export const makeXmlRequestModel = (options: SmsOptions): string => {
  const requestModel: XmlRequestModel = {
    SESSION: {
      CLIENT: options.username,
      PW: options.password,
      MSGLST: {
        MSG: options.receivers.map((rcv, i) => {
          return {
            ID: i + 1,
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
    var deliveryTimeStamp = dateToTimestamp(options.deliveryTime);
    requestModel.SESSION.MSGLST.MSG.forEach(function (m) {
      m.DELIVERYTIME = deliveryTimeStamp;
    });
  }

  const xml2jsBuilder = new Builder({});

  return xml2jsBuilder.buildObject(requestModel);
};
