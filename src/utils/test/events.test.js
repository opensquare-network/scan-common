const { extractExtrinsicEvents } = require("../index");
const { getApi, findBlockApi } = require("../../chain");
const { setPolkadot } = require("../../test/dot");
const { disconnect } = require("../../chain/api");
jest.setTimeout(3000000);

describe("Utils", () => {
  beforeAll(async () => {
    await setPolkadot();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("extractExtrinsicEvents works", async () => {
    const api = await getApi()
    const blockHeight = 11431139;
    const blockHash = await api.rpc.chain.getBlockHash(blockHeight);

    const blockApi = await findBlockApi(blockHash);
    const allEvents = await blockApi.query.system.events();

    const extrinsicEvents = extractExtrinsicEvents(allEvents, 2)
    expect(extrinsicEvents.length).toEqual(6);
  })

})
