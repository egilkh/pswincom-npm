import { encode } from 'iconv-lite';
import { parseStringPromise } from 'xml2js';
import { makeSmsResult } from './make-sms-result.js';
import { makeXmlRequestModel } from './make-xml-request-model.js';
import { SmsOptions, XmlResponseModel } from './types.js';

export const sendSms = async (options: SmsOptions) => {
  const fetchFunction = options.fetch || fetch;

  const xml = makeXmlRequestModel(options);
  const body = encode(xml, 'latin1');

  const hostname = process.env.PSW_GW_HOST || 'xml.pswin.com';
  const path = process.env.PSW_GW_PATH || '';
  const port = process.env.PSW_GW_PORT || '443';
  const url = `https://${hostname}:${port}${path}`;

  const response = await fetchFunction(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'Content-Length': String(body.length),
    },
    body: body,
  });

  const responseText = await response.text();

  const xmlResponse: XmlResponseModel = await parseStringPromise(responseText, {
    explicitArray: false,
  });

  return makeSmsResult(xmlResponse, options.receivers);
};
