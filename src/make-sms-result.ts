import { SmsResult, XmlResponseModel } from './types';

export const makeSmsResult = (
  response: XmlResponseModel,
  receivers: string[],
): SmsResult => {
  const result: SmsResult = { logon: undefined, receivers: {}, refs: {} };

  if (response.SESSION?.LOGON) {
    result.logon = response.SESSION.LOGON;
  }

  if (response.SESSION?.MSGLST?.MSG) {
    if (Array.isArray(response.SESSION.MSGLST.MSG)) {
      for (let index = 0, length = receivers.length; index < length; index++) {
        let receiver = receivers[index];

        if (result.receivers[receiver]) {
          receiver =
            receiver + '(' + response.SESSION.MSGLST.MSG[index].ID + ')';
        }

        result.receivers[receiver] = response.SESSION.MSGLST.MSG[index].STATUS;
        result.refs[receiver] = response.SESSION.MSGLST.MSG[index].REF;
      }
    } else {
      result.receivers[receivers[0]] = response.SESSION.MSGLST.MSG.STATUS;
      result.refs[receivers[0]] = response.SESSION.MSGLST.MSG.REF;
    }
  }

  return result;
};
