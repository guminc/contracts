import { CID } from "multiformats/cid";
import * as json from "multiformats/codecs/json";
import { sha256 } from "multiformats/hashes/sha2";
import { base64 } from "multiformats/bases/base64";
import { base58btc } from "multiformats/bases/base58";

async function main() {
  const bytes = json.encode({ address: "0x60A59d7003345843BE285c15c7C78B62b61e0d7c" });

  console.log({ bytes });

  const hash = await sha256.digest(bytes);
  const cid = CID.create(1, json.code, hash);
  console.log({ cid });

  const mybase64 = cid.toString(base58btc);

  console.log({ mybase64 });

  const parsed = CID.parse(cid.toString(base58btc), base58btc);

  console.log({ parsed });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
