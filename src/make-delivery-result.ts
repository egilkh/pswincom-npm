import { DeliveryResult, DeliveryResults, XmlDeliveryResponse } from './types';

export const makeDeliveryResult = (
  xmlResponse: XmlDeliveryResponse
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
    xmlResponse.MSGLST.MSG.forEach((msg) => {
      results.push({
        id: msg.ID,
        ref: msg.REF,
        receiver: msg.RCV,
        state: msg.STATE,
        deliveryTime: msg.DELIVERYTIME,
      });
    });
  }

  return results;
};
