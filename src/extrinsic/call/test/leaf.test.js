const { setPolkadot } = require("../../../test/dot");
const { disconnect } = require("../../../chain/api");
const { getBlockByHeight } = require("../../../chain/utils/get-block-hash");
const { findLeafOriginAndCalls } = require("../leaf");
const { getBlockIndexer } = require("../../../chain");
jest.setTimeout(3000000);

describe("Leaf call: ", () => {
  beforeAll(async () => {
    await setPolkadot();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("proxy calls works", async () => {
    const block = await getBlockByHeight(26739373);
    const extrinsicIndex = 2;
    const extrinsic = block.block.extrinsics[extrinsicIndex];
    const indexer = {
      ...getBlockIndexer(block.block),
      extrinsicIndex,
    };

    const originAndCalls = await findLeafOriginAndCalls(extrinsic.method, extrinsic.signer.toString(), indexer);
    const {origin, call} = originAndCalls[0];
    expect(originAndCalls.length).toEqual(1);
    expect(origin).toEqual("15EVjoms1KvEAvZaaNYYvnWHmc3Xg1Du3ECuARHyXdPyh1bs");
    expect(call.section).toEqual("convictionVoting")
  });

  test("multisig asMulti calls works", async () => {
    const block = await getBlockByHeight(26739022);
    const extrinsicIndex = 2;
    const extrinsic = block.block.extrinsics[extrinsicIndex];
    const indexer = getBlockIndexer(block.block);

    const originAndCalls = await findLeafOriginAndCalls(extrinsic.method, extrinsic.signer.toString(), indexer);
    const {origin, call} = originAndCalls[0];
    expect(origin).toEqual("13fnouKsAaWxBxCx9VarXBNyYo7vUCeTUbRmQBjytju8YqqB");
    expect(originAndCalls.length).toEqual(1);
    expect(call.section).toEqual("balances")
  })

  test("multisig asMultiThreshold1 calls works", async () => {
    const block = await getBlockByHeight(26742764);
    const extrinsicIndex = 3;
    const extrinsic = block.block.extrinsics[extrinsicIndex];
    const indexer = getBlockIndexer(block.block);

    const originAndCalls = await findLeafOriginAndCalls(extrinsic.method, extrinsic.signer.toString(), indexer);
    const {origin, call} = originAndCalls[0];
    expect(origin).toEqual("156taJdiwPcdXmN9vthi49kVWKecAUNxERTJ5RkK8xmgi5EU");
    expect(originAndCalls.length).toEqual(1);
    expect(call.section).toEqual("balances")
  });

  test("utility batch calls works", async () => {
    const block = await getBlockByHeight(26739909);
    const extrinsicIndex = 2;
    const extrinsic = block.block.extrinsics[extrinsicIndex];
    const indexer = getBlockIndexer(block.block);

    const originAndCalls = await findLeafOriginAndCalls(extrinsic.method, extrinsic.signer.toString(), indexer);
    const {origin, call} = originAndCalls[0];
    expect(origin).toEqual("139YLKvyLxEeG7asCwBZniVKacCibNMNdMPrq3ukrzagMqUV");
    expect(originAndCalls.length).toEqual(5);
    expect(call.section).toEqual("convictionVoting")
  })

  test("utility asDrive calls works", async () => {
    const block = await getBlockByHeight(19597698);
    const extrinsicIndex = 3;
    const extrinsic = block.block.extrinsics[extrinsicIndex];
    const indexer = getBlockIndexer(block.block);

    const originAndCalls = await findLeafOriginAndCalls(extrinsic.method, extrinsic.signer.toString(), indexer);
    const {origin, call} = originAndCalls[0];
    expect(origin).toEqual("14guKi671djzPu2NrT2ifey5Wmgn1gsaJkLnTcraXTt8j61V");
    expect(originAndCalls.length).toEqual(1);
    expect(call.section).toEqual("system")
  });

  test("sudo sudo calls works", async () => {
    const block = await getBlockByHeight(789423);
    const extrinsicIndex = 3;
    const extrinsic = block.block.extrinsics[extrinsicIndex];
    const indexer = getBlockIndexer(block.block);

    const originAndCalls = await findLeafOriginAndCalls(extrinsic.method, extrinsic.signer.toString(), indexer);
    const {origin, call} = originAndCalls[0];
    expect(origin).toEqual("1KvKReVmUiTc2LW2a4qyHsaJJ9eE9LRsywZkMk5hyBeyHgw");
    expect(originAndCalls.length).toEqual(1);
    expect(call.section).toEqual("balances")
  });

  test("sudo sudoAs calls works", async () => {
    const block = await getBlockByHeight(777003);
    const extrinsicIndex = 3;
    const extrinsic = block.block.extrinsics[extrinsicIndex];
    const indexer = getBlockIndexer(block.block);

    const originAndCalls = await findLeafOriginAndCalls(extrinsic.method, extrinsic.signer.toString(), indexer);
    const {origin, call} = originAndCalls[0];
    expect(origin).toEqual("12x9kaH1ignWYyqUumys4imy8pu9nRvt9ERmNyY2Jxpaj4gc");
    expect(originAndCalls.length).toEqual(1);
    expect(call.section).toEqual("proxy")
  });
});
