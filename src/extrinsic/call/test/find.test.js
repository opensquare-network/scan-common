const { setKusama } = require("../../../test/ksm");
const { getBlockByHeight } = require("../../../chain/utils/get-block-hash");
const {
  Modules,
  CollectiveMethods,
  TipMethods,
} = require("../../../consts");
const { setPolkadot } = require("../../../test/dot");
const { disconnect } = require("../../../chain/api");
const { findTargetCall } = require("../find");
jest.setTimeout(3000000);

describe("Find target call from polkadot", () => {
  beforeAll(async () => {
    await setPolkadot();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("proxy works", async () => {
    const block = await getBlockByHeight(3543099);
    const extrinsic = block.block.extrinsics[1];

    const targetCall = findTargetCall(extrinsic.method, (call) => {
      const { section, method } = call;
      const isCouncilPropose = section === Modules.Council && method === CollectiveMethods.propose;
      return isCouncilPropose && call.args[0].toNumber() === 8;
    })

    expect(targetCall.args[0].toNumber()).toEqual(8)
  })
})

describe("Find target call from kusama", () => {
  beforeAll(async () => {
    await setKusama();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("batch works", async () => {
    const block = await getBlockByHeight(3201782);
    const extrinsic = block.block.extrinsics[3];

    const tipReason = "[2] https://gist.github.com/joshua-mir/a38428e2e291b76f4bb47e6011114764";
    const targetCall = findTargetCall(extrinsic.method, (call) => {
      const { section, method } = call;
      const isTipNew = section === Modules.Treasury && method === TipMethods.tipNew;
      return isTipNew && call.args[0].toHuman() === tipReason;
    })
    expect(targetCall.args[0].toHuman()).toEqual(tipReason);
  })

  test("multisig works", async () => {
    const block = await getBlockByHeight(5379799);
    const extrinsic = block.block.extrinsics[1];

    const tipHash = "0x3844124e14e714ba8b0ebd31b8153338fb3305aa3c524c298f6f83bf91befc50";
    const targetCall = findTargetCall(extrinsic.method, (call) => {
      const { section, method } = call;
      const isTipNew = section === Modules.Treasury && method === TipMethods.tip;
      return isTipNew && call.args[0].toHex() === tipHash;
    })

    expect(targetCall.args[0].toHex()).toEqual(tipHash);
  })
})
