import { DeliveryResult, DeliveryResults, XmlDeliveryResponse } from './types';

export const makeDeliveryResult = (
  xmlResponse: XmlDeliveryResponse,
): DeliveryResults => {
  if (!xmlResponse.MSGLST?.MSG) {
    return [];
  }

  const results: DeliveryResult[] = [];

  if (!Array.isArray(xmlResponse.MSGLST.MSG)) {
    results.push({
      id: xmlResponse.MSGLST.MSG.ID,
      ref: xmlResponse.MSGLST.MSG.REF,
      receiver: xmlResponse.MSGLST.MSG.RCV,
      state: xmlResponse.MSGLST.MSG.STATE,
      deliveryTime: xmlResponse.MSGLST.MSG.DELIVERYTIME,
    });
  }

  if (Array.isArray(xmlResponse.MSGLST.MSG)) {
    for (const message of xmlResponse.MSGLST.MSG) {
      results.push({
        id: message.ID,
        ref: message.REF,
        receiver: message.RCV,
        state: message.STATE,
        deliveryTime: message.DELIVERYTIME,
      });
    }
  }

  return results;
};
