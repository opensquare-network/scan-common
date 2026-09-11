const { fetchOneBlockFromNode } = require("../fetchBlocks");
const { getExtrinsicSigner } = require("../decodeExtrinsic");
const { handleCallsInExtrinsic } = require("../../extrinsic/callInExtrinsic");
const { extractExtrinsicEvents } = require("../../utils");
const { setPolkadotAssetHub } = require("../../test/assetHub");
const { getBlockIndexer } = require("../utils/getBlockIndexer");
const { disconnect } = require("../../chain/api");
jest.setTimeout(3000000);

// Polkadot AssetHub emits "general" transactions (extrinsic format v5, preamble 0x45).
// They declare which transaction extension set they were encoded with via
// transactionExtensionsByVersion, and version 1 carries more extensions than the
// version 0 set polkadot.js decodes with, so it used to throw
// "Invalid data passed to Mortal era" and the whole block failed to fetch.
describe("Decode general transaction", () => {
  beforeAll(async () => {
    await setPolkadotAssetHub();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("height 20502549 with a general transaction", async () => {
    const { block } = await fetchOneBlockFromNode(20502549, false);
    expect(block.header.number.toNumber()).toEqual(20502549);
    expect(block.hash.toHex()).toEqual(
      "0xd77bc2ece63758f0199fa37a63309d4eb9a8b90436446b89c97b6ce739c0f0a0",
    );

    const methods = block.extrinsics.map(
      (extrinsic) => `${extrinsic.method.section}.${extrinsic.method.method}`,
    );
    expect(methods).toEqual([
      "parachainSystem.setValidationData",
      "timestamp.set",
      "utility.forceBatch",
    ]);
  });

  test("a signed v4 transaction on the same chain still decodes", async () => {
    const { block } = await fetchOneBlockFromNode(20502416, false);
    const extrinsic = block.extrinsics[2];
    expect(extrinsic.method.section).toEqual("balances");
    expect(extrinsic.method.method).toEqual("transferAllowDeath");
    expect(extrinsic.isSigned).toBe(true);
  });

  // polkadot.js throws on `signer` of a general transaction, so the origin has to be
  // read off the transaction extensions instead.
  test("the signer of a general transaction comes from its extensions", async () => {
    const { block } = await fetchOneBlockFromNode(20498811, false);
    const extrinsic = block.extrinsics[2];

    expect(extrinsic.isGeneral()).toBe(true);
    expect(() => extrinsic.signer).toThrow();
    expect(getExtrinsicSigner(extrinsic)).toEqual(
      "12iqiE5Kb8fHd2io8wpBJ23tR27WVELkNMv5yQWLFe52zaUQ",
    );
  });

  test("handles the calls in a general transaction without throwing", async () => {
    const { block, events } = await fetchOneBlockFromNode(20498811, false);
    const signer = "12iqiE5Kb8fHd2io8wpBJ23tR27WVELkNMv5yQWLFe52zaUQ";
    const extrinsicIndexer = { ...getBlockIndexer(block), extrinsicIndex: 2 };

    const handled = [];
    await handleCallsInExtrinsic(
      block.extrinsics[2],
      extractExtrinsicEvents(events, 2),
      extrinsicIndexer,
      (call, callSigner) => handled.push(`${call.section}.${call.method} ${callSigner}`),
    );

    // the forceBatch wraps two staking payouts, and every call is attributed to the
    // account the transaction extensions authorized
    expect([...new Set(handled)].sort()).toEqual([
      `staking.payoutStakers ${signer}`,
      `utility.forceBatch ${signer}`,
    ]);
    expect(handled.every((item) => item.endsWith(signer))).toBe(true);
  });
});
