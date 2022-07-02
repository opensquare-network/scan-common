const { normalizeCall } = require("../index");
const { getBlockByHeight } = require("../../../../chain/utils/get-block-hash");
const { setPolkadot } = require("../../../../test/dot");
const { disconnect } = require("../../../../chain/api");
jest.setTimeout(3000000);

describe("Normalize call", () => {
  beforeAll(async () => {
    await setPolkadot();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("balances#transferKeepAlive works", async () => {
    const block = await getBlockByHeight(10987021);
    const extrinsic = block.block.extrinsics[2];

    const normalized = normalizeCall(extrinsic.method);
    expect(normalized).toEqual({
      "callIndex": "0x0503",
      "section": "balances",
      "method": "transferKeepAlive",
      "args": [
        {
          "name": "dest",
          "type": "LookupSource",
          "value": "14dGjgjFpuVobFkKQYwTs2z6zZ9BKKFjyUYCVFgAGx8of1YF"
        },
        {
          "name": "value",
          "type": "Balance",
          "value": "23127871295"
        }
      ]
    });
  })

  test("multisig#asMulti works", async () => {
    const block = await getBlockByHeight(10990968);
    const extrinsic = block.block.extrinsics[2];

    const normalized = normalizeCall(extrinsic.method);
    expect(normalized).toEqual({
      "callIndex": "0x1e01",
      "section": "multisig",
      "method": "asMulti",
      "args": [
        {
          "name": "threshold",
          "type": "u16",
          "value": "2"
        },
        {
          "name": "otherSignatories",
          "type": "Vec<AccountId>",
          "value": [
            "132epEkFxPVyZRA4BNNQRstm6HZSvvFyqK9cMCSicuV1KshT",
            "15iLjQonC6Zzjk1g6DQSbBJkS1VqneuQBSVuyAtXWjwJ7Nem"
          ]
        },
        {
          "name": "maybeTimepoint",
          "type": "Option<Timepoint>",
          "value": {
            "height": 10990959,
            "index": 4
          }
        },
        {
          "name": "call",
          "type": "OpaqueCall",
          "value": {
            "callIndex": "0x0500",
            "section": "balances",
            "method": "transfer",
            "args": [
              {
                "name": "dest",
                "type": "LookupSource",
                "value": "16P61ABnJTEXDhBd5CvoA4qpLUzoybxkZegQSkUo2JrsDaGN"
              },
              {
                "name": "value",
                "type": "Balance",
                "value": "30000000000"
              }
            ]
          }
        },
        {
          "name": "storeCall",
          "type": "bool",
          "value": false
        },
        {
          "name": "maxWeight",
          "type": "Weight",
          "value": "640000000"
        }
      ]
    });
  })

  test("utility#batch works", async () => {
    const block = await getBlockByHeight(10991444);
    const extrinsic = block.block.extrinsics[2];

    const normalized = normalizeCall(extrinsic.method);
    expect(normalized).toEqual({
      "callIndex": "0x1a00",
      "section": "utility",
      "method": "batch",
      "args": [
        {
          "name": "calls",
          "type": "Vec<Call>",
          "value": [
            {
              "callIndex": "0x0500",
              "section": "balances",
              "method": "transfer",
              "args": [
                {
                  "name": "dest",
                  "type": "LookupSource",
                  "value": "1qnJN7FViy3HZaxZK9tGAA71zxHSBeUweirKqCaox4t8GT7"
                },
                {
                  "name": "value",
                  "type": "Balance",
                  "value": "43610600000000"
                }
              ]
            }
          ]
        }
      ]
    });
  })

  test("treasury#proposeSpend works", async () => {
    const block = await getBlockByHeight(10976450);
    const extrinsic = block.block.extrinsics[3];

    const normalized = normalizeCall(extrinsic.method);
    expect(normalized).toEqual({
      "callIndex": "0x1300",
      "section": "treasury",
      "method": "proposeSpend",
      "args": [
        {
          "name": "value",
          "type": "BalanceOf",
          "value": "383300000000000"
        },
        {
          "name": "beneficiary",
          "type": "LookupSource",
          "value": "1C42oGF3s8ztCsc22MA4LKd8BogMJNdVmCgtTXGfxqwjrSb"
        }
      ]
    });
  })
})
