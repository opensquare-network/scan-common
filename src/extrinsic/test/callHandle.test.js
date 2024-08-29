const { getBlockIndexer } = require("../../chain");
const { handleCallsInExtrinsic } = require("../callInExtrinsic");
const { extractExtrinsicEvents } = require("../../utils");
const { setKusama } = require("../../test/ksm");
const { disconnect, getApi } = require("../../chain/api");
jest.setTimeout(3000000);

describe("Handling of", () => {
  beforeAll(async () => {
    await setKusama();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("proxy call works", async () => {
    const height = 14748635;
    const api = await getApi();
    const blockHash = await api.rpc.chain.getBlockHash(height);
    const block = await api.rpc.chain.getBlock(blockHash);
    const allEvents = await api.query.system.events.at(blockHash);
    const blockIndexer = getBlockIndexer(block.block);

    const extrinsicIndex = 2;
    const events = extractExtrinsicEvents(allEvents, extrinsicIndex);
    const extrinsic = block.block.extrinsics[extrinsicIndex];
    const extrinsicIndexer = {
      ...blockIndexer,
      extrinsicIndex: 2,
    };

    let callIndex = 0;
    await handleCallsInExtrinsic(
      extrinsic,
      events,
      extrinsicIndexer,
      async (call, author, extrinsicIndexer, wrappedEvents) => {
        if (callIndex === 0) {
          expect(author).toEqual(
            "JKoSyjg9nvVZterFB5XssM7eaYj4Ty6LhCLRGUfy6NKGNC3"
          );
        }
        callIndex++;
      }
    );
  });
});
