import { parseStringPromise } from 'xml2js';
import { XmlDeliveryResponse } from './types';

export const makeDeliveryResponse = async (
  // Should be the XML provided by the gateway
  body: string
): Promise<XmlDeliveryResponse> => {
  const xmlResponse: XmlDeliveryResponse = await parseStringPromise(body, {
    explicitArray: false,
  });

  return xmlResponse;
};
