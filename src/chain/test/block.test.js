const { fetchOneBlockFromNode } = require("../fetchBlocks");
const { setKhala } = require("../../test/khala");
const { disconnect } = require("../../chain/api");
jest.setTimeout(3000000);

describe("Fetch khala block", () => {
  beforeAll(async () => {
    await setKhala();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("height 100786 works", async () => {
    const block = await fetchOneBlockFromNode(100786, false);
    expect(block.block.hash.toString()).toEqual("0x56d3dd960b0d8f89bfc2035c554da663b94e688541d715608ceac272c690f64a");
  })
})
