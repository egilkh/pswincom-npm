import { faker } from '@faker-js/faker';
import { deepEqual, equal } from 'node:assert';
import { describe, it, mock } from 'node:test';
import { makeDeliveryResponse, sendSms } from '../src';
import { dateToTimestamp } from '../src/date-to-timestamp';
import { makeSmsResult } from '../src/make-sms-result';
import { makeXmlRequestModel } from '../src/make-xml-request-model';
import {
  MessageOperation,
  SmsOptions,
  XmlResponseLoginStatus,
  XmlResponseMessageStatus,
} from '../src/types';

// Run tests as if we are in UTC to avoid issues with timezones
process.env.TZ = 'UTC';

describe('sendSms', () => {
  const mockFetch = mock.fn(
    fetch,
    async (): Promise<Response> => ({
      headers: new Headers(),
      status: 200,
      statusText: 'OK',
      ok: true,
      redirected: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      type: 'basic',
      url: '',
      // eslint-disable-next-line unicorn/no-null -- Required for Response
      body: null,
      bodyUsed: false,

      blob: async () => new Blob(),
      json: async () => ({}),
      clone: () => new Response(),

      text: async () => `
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <SESSION>
          <LOGON>FAIL</LOGON>
        </SESSION>
      `,
    }),
  );

  it('should fail to send message with no credentials', async () => {
    const result = await sendSms({
      username: '',
      password: '',
      sender: 'test',
      receivers: ['4711111111'],
      message: 'A test message',
      fetch: mockFetch,
    });

    equal(mockFetch.mock.callCount(), 1);

    deepEqual(result, {
      logon: 'FAIL',
      receivers: {},
      refs: {},
    });
  });
});

describe('makeXmlRequestModel', () => {
  it('should create xml without delivery time', () => {
    const message = faker.commerce.productName();
    const password = faker.internet.password();
    const user = faker.internet.email();
    const sender = faker.commerce.productAdjective();
    const receivers = [faker.phone.number(), faker.phone.number()];

    const options: SmsOptions = {
      message,
      password,
      username: user,
      sender,
      receivers,
    };

    const actual = makeXmlRequestModel(options);

    const expectation = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<SESSION>
  <CLIENT>${user}</CLIENT>
  <PW>${password}</PW>
  <MSGLST>
    <MSG>
      <ID>1</ID>
      <OP>1</OP>
      <TEXT>${message}</TEXT>
      <SND>${sender}</SND>
      <RCV>${receivers[0]}</RCV>
    </MSG>
    <MSG>
      <ID>2</ID>
      <OP>1</OP>
      <TEXT>${message}</TEXT>
      <SND>${sender}</SND>
      <RCV>${receivers[1]}</RCV>
    </MSG>
  </MSGLST>
</SESSION>
    `.trim();

    equal(actual, expectation);
  });

  it('should create xml with delivery time', () => {
    const message = faker.commerce.productName();
    const password = faker.internet.password();
    const user = faker.internet.email();
    const sender = faker.commerce.productAdjective();
    const receivers = [faker.phone.number(), faker.phone.number()];
    const deliveryTime = new Date('2025-01-01T12:00:00.000Z');

    const options: SmsOptions = {
      message,
      password,
      username: user,
      sender,
      receivers,
      deliveryTime,
    };

    const actual = makeXmlRequestModel(options);

    const expectation = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<SESSION>
  <CLIENT>${user}</CLIENT>
  <PW>${password}</PW>
  <MSGLST>
    <MSG>
      <ID>1</ID>
      <OP>1</OP>
      <TEXT>${message}</TEXT>
      <SND>${sender}</SND>
      <RCV>${receivers[0]}</RCV>
      <DELIVERYTIME>202501011200</DELIVERYTIME>
    </MSG>
    <MSG>
      <ID>2</ID>
      <OP>1</OP>
      <TEXT>${message}</TEXT>
      <SND>${sender}</SND>
      <RCV>${receivers[1]}</RCV>
      <DELIVERYTIME>202501011200</DELIVERYTIME>
    </MSG>
  </MSGLST>
</SESSION>
        `.trim();

    equal(actual, expectation);
  });

  it('should create xml without different operation', () => {
    const message = faker.commerce.productName();
    const password = faker.internet.password();
    const user = faker.internet.email();
    const sender = faker.commerce.productAdjective();
    const receivers = [faker.phone.number(), faker.phone.number()];

    const options: SmsOptions = {
      message,
      password,
      username: user,
      sender,
      receivers,
      operation: MessageOperation.Unicode,
    };

    const actual = makeXmlRequestModel(options);

    const expectation = `
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<SESSION>
  <CLIENT>${user}</CLIENT>
  <PW>${password}</PW>
  <MSGLST>
    <MSG>
      <ID>1</ID>
      <OP>9</OP>
      <TEXT>${message}</TEXT>
      <SND>${sender}</SND>
      <RCV>${receivers[0]}</RCV>
    </MSG>
    <MSG>
      <ID>2</ID>
      <OP>9</OP>
      <TEXT>${message}</TEXT>
      <SND>${sender}</SND>
      <RCV>${receivers[1]}</RCV>
    </MSG>
  </MSGLST>
</SESSION>
    `.trim();

    equal(actual, expectation);
  });
});

describe('dateToTimestamp', () => {
  it('should format date to timestamp', () => {
    const date = new Date('2021-01-01T12:00:00.000Z');
    const actual = dateToTimestamp(date);
    const expectation = '202101011200';

    equal(actual, expectation);
  });
});

describe('makeSmsResponse', () => {
  it('should format response', () => {
    const response = {
      SESSION: {
        LOGON: XmlResponseLoginStatus.OK,
        MSGLST: {
          MSG: [
            {
              ID: '1',
              STATUS: XmlResponseMessageStatus.OK,
              REF: '123',
            },
            {
              ID: '2',
              STATUS: XmlResponseMessageStatus.OK,
              REF: '456',
            },
            {
              ID: '3',
              STATUS: XmlResponseMessageStatus.OK,
              REF: '789',
            },
          ],
        },
      },
    };

    const receivers = ['4711111111', '4711111111', '4722222222'];

    const actual = makeSmsResult(response, receivers);

    const expectation = {
      logon: 'OK',
      receivers: {
        '4711111111': 'OK',
        '4711111111(2)': 'OK',
        '4722222222': 'OK',
      },
      refs: {
        '4711111111': '123',
        '4711111111(2)': '456',
        '4722222222': '789',
      },
    };

    deepEqual(actual, expectation);
  });
});

describe('makeDeliveryResponse', () => {
  it('should parse xml, single message', async () => {
    const xml = ` <?xml version="1.0" encoding="iso-8859-1"?>
                  <!DOCTYPE MSGLST SYSTEM "pswincom_report_request.dtd">
                  <MSGLST>
                    <MSG>
                      <ID>1</ID>
                      <REF>69500962-2a9e-4f04-8ca3-23e89fc36ee2</REF>
                      <RCV>4712345678</RCV>
                      <STATE>DELIVRD</STATE>
                    </MSG>
                  </MSGLST>`;

    const deliveryResponse = await makeDeliveryResponse(xml);

    if (Array.isArray(deliveryResponse.MSGLST?.MSG)) {
      throw new TypeError('Expected single message');
    }

    equal(deliveryResponse.MSGLST?.MSG?.ID, '1');
  });

  it('should parse xml, multiple message', async () => {
    const xml = ` <?xml version="1.0" encoding="iso-8859-1"?>
                  <!DOCTYPE MSGLST SYSTEM "pswincom_report_request.dtd">
                  <MSGLST>
                    <MSG>
                      <ID>1</ID>
                      <REF>69500962-2a9e-4f04-8ca3-23e89fc36ee2</REF>
                      <RCV>4712345678</RCV>
                      <STATE>DELIVRD</STATE>
                    </MSG>
                    <MSG>
                      <ID>2</ID>
                      <REF>69500962-2a9e-4f04-8ca3-23e89fc36ee2</REF>
                      <RCV>4712345678</RCV>
                      <STATE>UNDELIV</STATE>
                    </MSG>
                  </MSGLST>`;

    const deliveryResponse = await makeDeliveryResponse(xml);

    if (!Array.isArray(deliveryResponse.MSGLST?.MSG)) {
      throw new TypeError('Expected single message');
    }

    equal(deliveryResponse.MSGLST?.MSG?.[0].ID, '1');
    equal(deliveryResponse.MSGLST?.MSG?.[0].STATE, 'DELIVRD');
    equal(deliveryResponse.MSGLST?.MSG?.[1].ID, '2');
    equal(deliveryResponse.MSGLST?.MSG?.[1].STATE, 'UNDELIV');
  });
});

describe('makeDeliveryResult', () => {
  it('should create for one', () => {
    throw new Error('Not implemented');
  });

  it('should create for multiple', () => {
    throw new Error('Not implemented');
  });
});
