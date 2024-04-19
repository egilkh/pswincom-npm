import { SmsResult, XmlResponseModel } from './types';

export const makeSmsResult = (
  response: XmlResponseModel,
  receivers: string[]
): SmsResult => {
  const result: SmsResult = { logon: null, receivers: {}, refs: {} };

  if (response.SESSION?.LOGON) {
    result.logon = response.SESSION.LOGON;
  }

  if (response.SESSION?.MSGLST?.MSG) {
    if (Array.isArray(response.SESSION.MSGLST.MSG)) {
      for (let i = 0, len = receivers.length; i < len; i++) {
        let receiver = receivers[i];

        if (result.receivers[receiver]) {
          receiver = receiver + '(' + response.SESSION.MSGLST.MSG[i].ID + ')';
        }

        result.receivers[receiver] = response.SESSION.MSGLST.MSG[i].STATUS;
        result.refs[receiver] = response.SESSION.MSGLST.MSG[i].REF;
      }
    } else {
      result.receivers[receivers[0]] = response.SESSION.MSGLST.MSG.STATUS;
      result.refs[receivers[0]] = response.SESSION.MSGLST.MSG.REF;
    }
  }

  return result;
};
