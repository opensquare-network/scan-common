const { fetchOneBlockFromNode } = require("../fetchBlocks");
const { disconnect } = require("../../chain/api");
const { setPolkadotPeople } = require("../../test/peoplePolkadot");
jest.setTimeout(3000000);

// People Polkadot runtime 2005002 introduced general transactions encoded with
// transaction extension version 1, which carries people specific extensions
// (AsPerson, PeopleLiteAuth, AsMember, AsCoinage, AsResources). They are not
// defined by polkadot.js, so without their types the positional decode desyncs
// and fetching the block throws "Unable to find Call with index [2, 69]".
describe("Decode People Polkadot general transaction", () => {
  beforeAll(async () => {
    await setPolkadotPeople();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("height 12094848 with version 1 general transactions", async () => {
    const { block } = await fetchOneBlockFromNode(12094848, false);
    expect(block.header.number.toNumber()).toEqual(12094848);
    expect(block.hash.toHex()).toEqual(
      "0x81993b58b90f331d4951cf59bd5ebb53dece6bdf4a181ecf2e28c871b00bbde0",
    );

    const generalExtrinsics = block.extrinsics.filter(
      (extrinsic) => extrinsic.isGeneral && extrinsic.isGeneral(),
    );
    expect(generalExtrinsics.length).toEqual(9);

    const methods = [
      ...new Set(
        generalExtrinsics.map(
          (extrinsic) => `${extrinsic.method.section}.${extrinsic.method.method}`,
        ),
      ),
    ];
    expect(methods).toEqual(["coinage.unloadRecyclerIntoExternalAsset"]);
  });
});
