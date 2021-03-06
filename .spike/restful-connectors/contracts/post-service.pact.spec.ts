import {getTestBed, TestBed} from '@angular/core/testing';
import {RestfulConnectorsModule, RestfulConnectorsService} from '../';
import {environment, MOCK_SERVER_PORT} from '../../../environments/environment';

require('should');

const { Pact, Matchers } = require('@pact-foundation/pact');
const requestId = '01234567890123456789012345678901';
const endpoint = `/dpo/requests/${requestId}/event`;
const LOG_LEVEL = process.env.LOG_LEVEL || 'WARN';
process.env.API_HOST = environment.api;

const {term, somethingLike} = Matchers;

const expectedPayload = {
  message: somethingLike('completed by gary'),
  type: term({
    generate: 'REQUEST_COMPLETE',
    matcher: 'REQUEST_COMPLETE|REQUEST_DECLINED'
  }),
};

const responseCode201 = {
  state: 'close request post event',
  uponReceiving: 'a post event for close request',
  withRequest: {
    method: 'POST',
    path: endpoint,
    headers: {
      'Content-Type': 'application/json'
    },
    body: expectedPayload,
  },
  willRespondWith: {
    status: 201,
    body: {
      message: somethingLike('success')
    }
  }
};

let provider;
describe('Post Service', () => {
  before(() => {
    provider = new Pact({
      consumer: 'Data Privacy Portal DPO',
      provider: 'Data Privacy Portal Request Service',
      port: MOCK_SERVER_PORT,
      log: process.cwd() + '/contracts/logs/mockserver-integration.log',
      dir: process.cwd() + '/contracts/pacts',
      pactfileWriteMode: 'merge',
      logLevel: LOG_LEVEL,
      cors: true,
      spec: 2
    });

    return provider.setup();
  });

  after(() => {
    return provider.finalize();
  });

  beforeEach(() => {
    return TestBed.configureTestingModule({
      imports: [RestfulConnectorsModule]
    });
  });

  afterEach(() => {
    getTestBed().resetTestingModule();
  });

  describe('post close request event', () => {
    let service, response;

    const payload = {
      'message': 'completed by gary',
      'type': 'REQUEST_COMPLETE'
    };
    beforeEach(async function () {
      service = TestBed.get(RestfulConnectorsService);
      await provider.addInteraction(responseCode201);
      response = await service.post(requestId, payload);
    });

    afterEach(async function () {
      await provider.verify();
    });

    describe('with a 201 server response', () => {
      it('post service response', () => {
        response.message.should.equal('success');
      });
    });
  });
});
