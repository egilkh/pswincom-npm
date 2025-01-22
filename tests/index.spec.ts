import { faker } from '@faker-js/faker';
import { deepEqual, equal } from 'node:assert';
import { describe, it, mock } from 'node:test';
import { makeDeliveryResponse, sendSms } from '../src';
import { dateToTimestamp } from '../src/date-to-timestamp';
import { makeSmsResult } from '../src/make-sms-result';
import { makeXmlRequestModel } from '../src/make-xml-request-model';
import {
  DeliveryMessageState,
  MessageOperation,
  SmsOptions,
  XmlDeliveryResponse,
  XmlResponseLoginStatus,
  XmlResponseMessageStatus
} from '../src/types';
import { makeDeliveryResult } from '../src/make-delivery-result';

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
      bytes(): Promise<Uint8Array> {
        return Promise.resolve(new Uint8Array());
      },
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

  it('should format correctly with double digit month', () => {
    const date = new Date('2021-11-01T12:00:00.000Z');
    const actual = dateToTimestamp(date);
    const expectation = '202111011200';

    equal(actual, expectation);
  });

  it('should format correctly with double digit day', () => {
    const date = new Date('2021-01-11T12:00:00.000Z');
    const actual = dateToTimestamp(date);
    const expectation = '202101111200';

    equal(actual, expectation);
  });

  it('should format correctly on last month of year', () => {
    const date = new Date('2021-12-11T12:00:00.000Z');
    const actual = dateToTimestamp(date);
    const expectation = '202112111200';

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
  it('should return empty if no message', () => {
    const xmlResponse = {};

    const result = makeDeliveryResult(xmlResponse);
    
    equal(result.length, 0);
  });

  it('should create for one', () => {
    const id = faker.string.uuid();
    const reference = faker.string.alphanumeric(10);
    const receiver = faker.phone.number();
    const state = DeliveryMessageState.DELIVRD;
    const deliveryTime = faker.string.numeric(12);

    const xlmResponse: XmlDeliveryResponse = {
      MSGLST: {
        MSG: {
          ID: id,
          REF: reference,
          RCV: receiver,
          STATE: state,
          DELIVERYTIME: deliveryTime
        }
      }
    };
    
    const result = makeDeliveryResult(xlmResponse);
    
    equal(result.length, 1);
    deepEqual(result[0], {
      id,
      ref: reference,
      receiver,
      state,
      deliveryTime
    });
  });

  it('should create for multiple', () => {
    const messages = [
      {
        ID: faker.string.uuid(),
        REF: faker.string.alphanumeric(10),
        RCV: faker.phone.number(),
        STATE: DeliveryMessageState.BARREDA,
        DELIVERYTIME: faker.string.numeric(12)
      },
      {
        ID: faker.string.uuid(),
        REF: faker.string.alphanumeric(10),
        RCV: faker.phone.number(),
        STATE: DeliveryMessageState.FAILED,
        DELIVERYTIME: faker.string.numeric(12)
      },
      {
        ID: faker.string.uuid(),
        REF: faker.string.alphanumeric(10),
        RCV: faker.phone.number(),
        STATE: DeliveryMessageState.DELIVRD,
        DELIVERYTIME: faker.string.numeric(12)
      },
      {
        ID: faker.string.uuid(),
        REF: faker.string.alphanumeric(10),
        RCV: faker.phone.number(),
        STATE: DeliveryMessageState.DELIVRD,
        DELIVERYTIME: faker.string.numeric(12)
      },
      {
        ID: faker.string.uuid(),
        REF: faker.string.alphanumeric(10),
        RCV: faker.phone.number(),
        STATE: DeliveryMessageState.DELETED,
        DELIVERYTIME: faker.string.numeric(12)
      },

    ];
    const xmlResponse: XmlDeliveryResponse = {
      MSGLST: {
        MSG: messages,
      }
    };
    const expectedResult = messages.map((message) => ({
      id: message.ID,
      ref: message.REF,
      receiver: message.RCV,
      state: message.STATE,
      deliveryTime: message.DELIVERYTIME
    }));

    const result = makeDeliveryResult(xmlResponse);

    equal(result.length, 5);
    deepEqual(result, expectedResult);
  });
});
