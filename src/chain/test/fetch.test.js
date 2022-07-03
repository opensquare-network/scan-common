const { fetchOneBlockFromNode } = require("../fetchBlocks");
const { setPolkadot } = require("../../test/dot");
const { disconnect } = require("../../chain/api");
jest.setTimeout(3000000);

describe("Fetch block", () => {
  beforeAll(async () => {
    await setPolkadot();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("height 11001467 author works", async () => {
    const { author } = await fetchOneBlockFromNode(11001467, true);
    expect(author).toEqual("145MeLV4uyei8H4H7Amb89uQW7y9reMAJkBYyQTXk6PCHnoW");
  })
})
