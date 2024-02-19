import { ethers, run } from "hardhat";
const ZERO = "0x0000000000000000000000000000000000000000";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  //   // Build air drop list from existing contract ownership
  //   const ERC721 = await ethers.getContractFactory("ERC721Upgradeable");
  //   const existing = ERC721.attach("0x46037e79fBe236D443C130f62d85CFE922c4ab7B");
  //   let airDropList: [string, number][] = [];
  //   let tokenId = 1;
  //   let currentOwner = "";
  //   let quantity = 0;
  //   let attempt = 0;

  //   while (true) {
  //     try {
  //       const ownerAddress = await existing.ownerOf(tokenId);
  //       console.log(tokenId, ownerAddress);
  //       if (ownerAddress === currentOwner) {
  //         // If the owner is the same as the previous, increase quantity
  //         quantity++;
  //       } else {
  //         // If the owner is different and not the first iteration, push the previous streak to the list
  //         if (currentOwner !== "") {
  //           airDropList.push([currentOwner, quantity]);
  //         }
  //         // Reset for the new owner
  //         currentOwner = ownerAddress;
  //         quantity = 1;
  //       }
  //     } catch (error) {
  //       // Assuming error means no more tokens exist, break the loop
  //       // Make sure to add the last streak if it exists
  //       if (attempt < 10) {
  //         console.log(`Checked up to token ${tokenId}, error.`);
  //         attempt += 1;
  //         await sleep(2000);
  //         continue;
  //       }
  //       if (currentOwner !== "") {
  //         airDropList.push([currentOwner, quantity]);
  //       }
  //       console.log(`Checked up to token ${tokenId}, no more tokens found.`);
  //       break;
  //     }
  //     attempt = 0;
  //     tokenId++;
  //   }
  //   console.dir(airDropList, { depth: null });
  //   console.log(JSON.stringify(airDropList, null, 2));

  // HAUS AIRDROP LIST
  let airDropList = [
    ["0x62b8711D1f3829e465A8FDc8e6DC1f6C7641b449", 1],
    ["0xf3e3F52e9B0431b384f5caC18CfB6C1003adC4b2", 1],
    ["0x732422A4afDe3DaE61657F0731AC1101b061918B", 1],
    ["0x213F377C6ed4E2DF4171Bc5696340434b26013B2", 1],
    ["0xbDF87dF83F005A96FbeF2a855888A07CF757692f", 1],
    ["0x8fD8Cc0F855Ade5470C8Af71ad2b0dF98B94E596", 1],
    ["0x53316609D17e7cB0D380081201b4b3470C931EFE", 1],
    ["0x36c988f0f2778daaf70AD899f64be100a4184B30", 1],
    ["0xEF0b80bd1fC57881F4AB55fFF887f0B895CDC40f", 1],
    ["0x0f80cEaDd6070020c300c157deff43c5f35470C4", 1],
    ["0xfaf0B3AB0341d6620313722679008c9F5040642E", 1],
    ["0x4C1a16A87942fF04fBaDdfAd212a51291dcB45A4", 1],
    ["0x463fb520183d7381663C140428B42b80097b6523", 1],
    ["0x03437b49b75f37573A7D9118609270b6A601523d", 1],
    ["0xC2508D3B212Bd8f26FfB4C98C6541E2cc8Bb75F6", 1],
    ["0x88eEb79b0cCE7000142BBB474562663B4aB623db", 1],
    ["0x6fB8d1C9DE89eCEF1FC7B6507a02ec6Fbb29687f", 1],
    ["0x958b43Ffc648508ebE9bF243fBB925d418C401Ec", 1],
    ["0xe95ECf4Be5F490C85d590509F522A6531238310B", 1],
    ["0x8AE6A9aC751fc295E95a64204788bA072228FbC3", 1],
    ["0x877CAF8a87fe37850A12B8515ed41F8De2085dCc", 1],
    ["0x41cA23D5334f16eaB5E6bc0eb54807F0814Aff99", 1],
    ["0xcA23c5C8a621d6cE6A5619A131E0C3a5a0Ac091A", 1],
    ["0x07eE3F3F755473AC0E7A31AE0911fC68Fd32Da7b", 1],
    ["0x752BbeBF40256DCDc3C9563eCFa8a2770fE93DD6", 1],
    ["0x4F646848a0A99abC33A4FF35F232DC24558B96AE", 1],
    ["0xdE12BC577B2ED3A2cD542CE8F0AdeB37C9b59992", 1],
    ["0x078D59AFb4eEAe689368B6523912c2f451eC2D75", 1],
    ["0xf597c9db2D05478CE73Aa919A5977eDd98B75A80", 1],
    ["0x5a81b80A7be4DC66C054B42b157d8d5aE11D2c89", 1],
    ["0xC4F93Bd8ABB709381A6cAf07746F4F445f8ea0F2", 1],
    ["0xd817AFe40ffdCa910A182134403C0AC95F219aDD", 1],
    ["0xBd0F5D4Be49f83fc26925d454533dA2E2504dA6A", 1],
    ["0xB07e5dEc606e256815511D4cD11b5a65CA36AC01", 1],
    ["0xE732f5dBb5c14A4E52F622a022d4059F5fa2243C", 1],
    ["0xAD439977313E7D49eA9334acd189156026865FDE", 1],
    ["0xae2269584F7374257f35F41dD19689B804DaFFFb", 1],
    ["0x835804dAFB911451EBAc7294895802BAFb90A9C3", 1],
    ["0xcE64da4caf4c7D5A65c74Fbacb16E170d300285d", 1],
    ["0x9F2022c9b3BD047915A04aeaB263528c53C4cE2D", 1],
    ["0x811E694976Bac4da69BF8C017E16e794b0EfB66b", 1],
    ["0x35e561DdaEc43d338EA9FE0E8593f3909C0243C3", 1],
    ["0x000000000000000000000000000000000000dEaD", 1],
    ["0x00612787a55e9a2605E189819A5d7f6e4d934279", 1],
    ["0x48BB273A73240AeDdB70814577246d379Bf45Faa", 1],
    ["0xA3531F399977d62822549Dd0f76B6688D7681541", 1],
    ["0x5C9f0F45bCc519A713804146fa15683995591Ad7", 1],
    ["0xC004C00262d9A4E79D92f732b0e11ba3CE72bc45", 1],
    ["0xfC9046c3294F7A86Dd24b385d5Ff0Bf6c9cF8A2C", 1],
    ["0xfb867761E8CC1B96567E808BE1e4D893f5CFf6E8", 1],
    ["0x00612787a55e9a2605E189819A5d7f6e4d934279", 1],
    ["0xFf6F09546F46112ecB924dE1133d51efe3418c6A", 5],
    ["0xD3f50357c251C5bC6f43c86ab5Cb39c15580DCFB", 1],
    ["0x00345Bb8270Bf08B561D0419000F2928E4B97194", 1],
    ["0x0AC9a18a14993Ce0c5E37398ba9B3f5877E1eaf0", 1],
    ["0xb55F6EAe6d6523bdF792F302030427FCd10ebeB1", 1],
    ["0x45044F984FeeDe521Be406380cecD9b46C18Fc5f", 1],
    ["0x562BcC85a979b392389590526BA3cefE4457D204", 1],
    ["0x63d5b67925dBcc66Ab8C404fCED4753F5dCAEcf6", 1],
    ["0xa372c078eEE7dA14c509e762672D81ECf85267ad", 1],
    ["0x89B41eeD9b104A43139681A3F356B0120C176B44", 1],
    ["0x9b7686c3af3f6Fb73374E1dC89D971335f09fAFb", 1],
    ["0xB3E65797A3687722a38CBC9A8ceb59eBF1B21553", 1],
    ["0x72d487508ec66d13f8D49e7115576C16A00a2F05", 1],
    ["0xB42c29198155903bac0CE4096970e6Bd149970C9", 1],
    ["0x0d2cC259b7AF59c2BF2012de56E723ea6B11b3F1", 1],
    ["0xfE1A43DDfE1414f4D9c9b0ac796DC3403C68125c", 1],
    ["0x9DDC50405351DE925f8ff8349391ca0276b90528", 1],
    ["0x9fE99c1C807CD052482324289ee7E9B3FBE29Ba2", 1],
    ["0xce1978091d09842f13799b67e12Ae07e526D29A8", 1],
    ["0x3C691aaccC85a7bFa92C8fB4c50670cd9Dd6eDBE", 1],
    ["0x2580E13c6Cf0c19C18B5EeeCa16a250bA2C1D6CA", 1],
    ["0x49AEF3924a006Cb6eaeAf2c2dc627fE1026f86df", 1],
    ["0xB9814fd3585021213A140BA3fB48089aE5F46673", 1],
    ["0x8Ac3dD047f535C454c759C3C3eBc6708263c52a8", 1],
    ["0xEDCE73173048562BBF29d6D9554eFfAC6f9ad963", 1],
    ["0xF8c6faf9106516Eb9b043964C5bFB827D9f2229B", 1],
    ["0xFC9926f779Acb36AC7b801DF8c5ffcc9A2d34D13", 2],
    ["0xE93D420455FaA3CC5f5a0d00c36FD409c66c371F", 1],
    ["0xD0cc08Ac12CdbAd1FD89cD81565854a647bE20E9", 1],
    ["0x96431E64260c4aC03357b989d27dD2440bc90653", 1],
    ["0x3e272f53741c32F20Ff77F5aB252535C7FBbaCa6", 1],
    ["0x780E82BAa867244E7923dd39c890CA1047aB8edd", 1],
    ["0xA44B7843C4574D66032e38D4845Ac91e3CE97b3F", 1],
    ["0x6042E8D8b162665529917eCF20919BAdf1Cc992F", 10],
    ["0x0DEfCACe2E4c8d12b79Ba58576f74B41c8831C09", 1],
    ["0x936AaDE0d4d835271C9C11B89880244330864a63", 1],
    ["0x3b70FF4cb7687A852eCB4f227c6D3D490E5d7f31", 1],
    ["0x80b1960Ce559fDF3f7543B0d87fbB5381f8C3903", 1],
    ["0x327F8B4df79834557BBE0B931BD374daFD403E9E", 1],
    ["0x69576d69823948A826c870d7105d7bAF4CA6FeF0", 1],
    ["0x6b371AB0760991a318D9F3cf7bb6CA10Cbe94766", 1],
    ["0x81E504C209E597FC905B4E6A28b76452B785304B", 1],
    ["0xcEE566112387FAc5dcd09A2e4C68EB6F0C6f718d", 1],
    ["0xA55c9B5CbD43369A4640cD4DC8B25EfBb39ed3C9", 1],
    ["0xd9D966150Be1E4a7a3f4Ac88c970b9f2898bF27C", 1],
    ["0xf4BE01B8d4443546498de6A923fFb27D0ac611d5", 1],
    ["0x4015063FD711F4Abb52CAf7BEf210C96eff9701F", 1],
    ["0x04799529529a476632f34E4950a642ee6b7c644D", 1],
    ["0x3613298ce855dE97B55FCE6a84D5e8689F547118", 1],
    ["0x1C6f1A832e73949c97FE335a98B6A5Fc3c9C29E9", 1],
    ["0x782d4aD52158437E338aaFFFe148FcCC09e16fcA", 1],
    ["0xA9D2BCF3AcB743340CdB1D858E529A23Cef37838", 1],
    ["0xafa12555626FD52db2Bbc17da1b066381Ed9AB4b", 1],
    ["0x428B0714aEcc9c5E9C09d47e54Bb04910486F22f", 1],
    ["0x91eD722E42D3BF37786cE3F583fa8F26caf7B213", 1],
    ["0xbfc431C8b3fe0EFBCb0047Bf57745DAC73400C3F", 1],
    ["0x47B6690c69363C0e4834f7d762ABf6e1d4669d34", 1],
    ["0x61781072aa9c0af98384AA791e964F80F3af8Cfc", 1],
    ["0xdec08cb92a506B88411da9Ba290f3694BE223c26", 1],
    ["0x79631EcB2529aAfB578bDd5d8E7bF99a5D5c81C3", 1],
    ["0x198E18EcFdA347c6cdaa440E22b2ff89eaA2cB6f", 1],
    ["0x3Ed3fD7441dec0D505e5F1F8CbED87d38e72A77B", 1],
    ["0x104B2618231020b4320580b40FE05dce77323fa1", 1],
    ["0x1b319e3f01805Ff2c54234868732F90d3c20E67D", 1],
    ["0xE6b9BB760e56e3f43B6E839Ac3D738039eC0cDeB", 1],
    ["0x6362859b125382C6bd68cDc96c427C6CC12377A6", 2],
    ["0xE6b9BB760e56e3f43B6E839Ac3D738039eC0cDeB", 3],
    ["0x85838816B9330b9Eb2F989C55454D280da1DA60E", 1],
    ["0x62323b7d31a480253e582dCfB3bc456ABb609D87", 1],
    ["0x9fF04B2Db76CEade3752A294350c70a23E3C1762", 1],
    ["0x56dac66DB126D5ad9ABA4422717D68aC5774f1B8", 1],
    ["0xB04F4d89E78905d7da3B2966D95699c5A7659a90", 1],
    ["0xE6b9BB760e56e3f43B6E839Ac3D738039eC0cDeB", 2],
    ["0xDD91872feb1EcdD7eeFe27E669fdff321AEa12df", 1],
    ["0x08D2a85aEd9F1c17b22bDaFBc3Fdf6B5F1DABce7", 2],
    ["0x308ebd3055E36ad3683dB746962e21b1B3a315Bc", 1],
    ["0x20B6092AF3EBAC8ca3de20Aaa2F6c8B83E5C66BC", 1],
    ["0x076eD06A2063bBbcD605a61466Eb616195A12426", 1],
    ["0x6d53036ffb5E2888a2d3ee3746De12335397Fc84", 1],
    ["0xE55c9840eb6Ba1c75160Ed611E3C72Bc438dCA54", 1],
    ["0xC3921B28849f486eCe0cc922f8a1Cf8c769c68fB", 1],
    ["0x7bdA36e22524A44ff093Fd332BFE5f60717408B2", 1],
    ["0xd0Af002B9e6cf131affC29A65f9ee1C8B62338EE", 1],
    ["0x34A79192afAE197385A43444c15B7cE068899877", 1],
    ["0x488DFe1407591f4eC297e1b1c652FD229fa25955", 1],
    ["0xcb80084408BcFB3C8ea55d49626c034DCBbB1360", 1],
    ["0xfEB41f7DC10c98Fb5a7995Fd9c5De7c83E02dde7", 1],
    ["0xB642d3b6E7511AD71A882C41a5F9c9dcf21f2765", 1],
    ["0x4d0bF3C6B181E719cdC50299303D65774dFB0aF7", 1],
    ["0xD5dE81E7e5E4F740a26Ebb254d6052e1D03B4787", 1],
    ["0x7CFcD6C9Dd7ABac18221C7aA9387DE1C12537d5C", 1],
    ["0x963877ADc76054712E2eB46EcD6dF281fC74CF32", 1],
    ["0xe29ae7Ba0AeCC1795cFf9d588C6E8332e3D16665", 1],
    ["0x0dA47666a8311250C7Fa713250A828307fe933fE", 1],
    ["0x57F6035Aa8abcf6E8BA55AEFaCd3A0c3207720e4", 1],
    ["0x3bcA4137CaE91A7750c879332121897d6b273367", 1],
    ["0xc5Bc0D7D0F281b056a7158feF99aD9A606b53511", 1],
    ["0xFf81b6e6599ECD876f6Fcf4EADDA990153fffCf4", 1],
    ["0xF18183B66dAFaF1f69DC10dB28728bf17a586e2E", 1],
    ["0x1a7077d93336e0e752E46C8128cED45011E3aa81", 1],
    ["0x0cA59AC8103081894D1D0Ad52dcDF83797111b1c", 1],
    ["0x923D5989154747d62cc20A8f3C3d0A907F150EE8", 3],
    ["0x211f6A84aeE392253d76407a4c59d0631ababe69", 1],
    ["0x5dFa160e0f96CE631D28649D02bB7738D69FE761", 1],
    ["0xB051E29500066D77E3715a95a583fAbf016efb31", 1],
    ["0xE40cA0Cb113D54EC4CfD1Aa3ac842BddaD8386d7", 3],
    ["0x854D33F336157ccF5d05B6cAfB034D76e435ed04", 1],
    ["0x27184d64D2E8108CF0503C15a30B6E6BA14C5910", 1],
    ["0xD5B82f1efef871C931128faaa4484d4861d1Cdd9", 1],
    ["0x173428b10533718ef9e29F63EC0DE9c9ab5fEB30", 1],
    ["0x27184d64D2E8108CF0503C15a30B6E6BA14C5910", 1],
    ["0x971e87bb6A90B8c791D703EA3E78D103c99D50D0", 1],
    ["0xAA4312853013Ed0Be29C14405635aD174570C1AB", 1],
    ["0x048A0Af593a6d44A06E634Cc3f4f2394cF2E57E7", 1],
    ["0x996e1d4ce3e1e558889832832004B2466153adbe", 1],
    ["0x44DbAd8187186BB50C57B5E8dd6a2B249e2F64a4", 1],
    ["0x4f42BC14C9a2cFa3dA1f0217B71C22EcB7CD8171", 1],
    ["0xf59F20f3A2B46c05148C68273CABE1dF7E30b502", 1],
    ["0x766d48b7726934fdFB9345eaB81117D1F8765488", 1],
    ["0xb81379B78A786C7b9Af608c4d838bbfE2102Ba7f", 1],
    ["0x8D67bed1188BEA88f5c680012abEA2C1443955e9", 1],
    ["0x8D4583655cC7A5B36EE3abe3747176b42b698ec4", 1],
    ["0x0c520D5d99DF7ecbF3754cCDc1C9583495582069", 1],
    ["0x0D263830af443317D8bca4AC1a325fEC10C309ae", 1],
    ["0x735eD02655Bca15EC46491C0dE4946591135459b", 1],
    ["0x374534de1Dfd0B0f965600D887f452f7035eA08b", 1],
    ["0xe9822F18F2654e606a8dFF9d75EDd98367E7c0aE", 3],
    ["0xe81b1843e083021b584479F8767C02551718A022", 1],
    ["0x76a11fB494a723F3D080B965144a762C67BB9a15", 1],
    ["0x763bAa879a5Ed8534D6bb843a4B8165EA2967E89", 1],
    ["0x18C41F45Aa7e0C9F5d25459588284080D360B8ed", 1],
    ["0x15F1D5830EcD8b777b2eFBb9b0676e39142656b0", 1],
    ["0x5b91D8975cD743A4e345CA99776a33C5432Ea163", 1],
    ["0x7bdA36e22524A44ff093Fd332BFE5f60717408B2", 1],
    ["0x0cA59AC8103081894D1D0Ad52dcDF83797111b1c", 1],
    ["0x2B258bEbd3C9Fe23eCe1397d83369c6F54806eB9", 1],
    ["0x7fC65Ccc5c9C69080d682e0930849301C7aeb524", 1],
    ["0xb8776B76B5DF22e6eAAD8d071192843a47C04FdB", 1],
    ["0x3927C6D7aC022576C29988D893e824e1eAa26e4D", 7],
    ["0x1F19065B71927A644E30ce5ea0242A305D66E17e", 1],
    ["0xfCc7B6B1C58557A8D991a652D1E841f45C6793a0", 1],
    ["0xA93CCB29Cae932bD0B6E225F6ab14D4F2351dc3d", 1],
    ["0xf9FD229c2F3082e433B169c3A0e920725386ac92", 1],
    ["0x70672780BDCc614331f67D0620b6B66Eff103CEe", 1],
    ["0xA1B22e9AD2A7f3D69f8c3e45D0BB8F907958d584", 1],
    ["0xDe12968A993158Fd293f4699C9Ea486528Dd6A85", 1],
    ["0x562BcC85a979b392389590526BA3cefE4457D204", 1],
    ["0xbb76a0D36a6AADC9f21ADa13157CeDbf074417cb", 3],
    ["0x463fb520183d7381663C140428B42b80097b6523", 1],
    ["0x5dCa7bad26550B04A2D6911BA64Bb7E7bDd67787", 1],
    ["0xc932941c38A752cE5579Ece11a33a57f4e3536d7", 2],
    ["0xaF09448BA7123F6976E6dfF72F4e425aAf11AE5E", 1],
    ["0xA55c1b775c218A41B9f3AA8defB8aB05A47B96af", 1],
    ["0x934BC64D8681A4Fc385da636c8b2C6Ca7ECdF3d6", 2],
    ["0x4CD6F715722Eb17c489cA803fB63b7e4905Bc895", 1],
    ["0x34E040AE65E8CBfde0B8e2F8bBDa396f8f05e46C", 1],
    ["0xA55c1b775c218A41B9f3AA8defB8aB05A47B96af", 1],
    ["0x50EF8F32B81b5C00555B0af7f7c999155BeE0b26", 10],
    ["0x7A6995B909BFF154F5093Fae24dA8FC73fA5e7C7", 1],
    ["0x23A4c6A0f83AF04730EB98A8c6d23f1659a1FD00", 2],
    ["0x44faf6C259fa3f0f6fEFA2C462D2D723FCe9A4b4", 1],
    ["0xa113a957198337b8654eb193D2DF373528d49D2A", 1],
    ["0xe3FA56242De97ED9414b8DE0ed4d77691298561d", 1],
    ["0xf0201695813e6a8D79E246221D027A33cb7E31D2", 1],
    ["0x33B6A3aB72417403301c174a1b0471298591CC00", 1],
    ["0x110cAa1E08C09153158F5316D534A9Df29c8AC3C", 1],
    ["0x73f0093427a0848d955643f7f45903D2b6F49b6f", 1],
    ["0xbA7fd2B3913691b77C2A5Bc413efa306B5A77fB9", 1],
    ["0x49f1a1C5E41BaEf1E36eEF383044EBBb6eda8aC1", 1],
    ["0xFE734bA72aacbA0e72BF337Db0e63528B2285F71", 2],
    ["0x1442059d5e3af94519fC867fF32d8C3702fD3A3c", 1],
    ["0xa8767b2E7370Eb6da0e9C34ea91Ee9eE6a3dDD79", 1],
    ["0x6EB7Eb43F17790e8E7ABB352804e4e2b93555555", 2],
    ["0x67CBD1aEe9576C14049E720bb35Bc18b3386322D", 2],
    ["0x8559e3fcde0f466213e10F180e34425483CA97cb", 5],
    ["0xf94A9816Bc6Eb69F22dA236fE73C2f9792Ec7376", 1],
    ["0xbEE315D9905aa0A580DdFA2ADf74A7c2e2Fc3A9f", 1],
    ["0x97A10C045fCb083e1807d63519431a8Ff776dC05", 1],
    ["0xc5Bc0D7D0F281b056a7158feF99aD9A606b53511", 1],
    ["0x91a80F52706fa8A4ED629A4D6D3Fa06d3da853f8", 1],
    ["0x854D7B77B762B2ca07b1Ccc21e2a19eB1ccC34C7", 1],
    ["0x133171475401450b7581562046CC673c4abE68aE", 1],
    ["0xd84710a499174fddbBa6d63ce0a16B4B0ec7Fce5", 1],
    ["0x43F04a3c545287D7f530ebDCA97b6432d2260E2e", 1],
    ["0x61E5AedC33Cb315b1B997ddcE60B239fbF1B5Bd1", 5],
    ["0xc3B441e5B1c0B8E2CA08Cc01e3AD4a1998A9e72d", 1],
    ["0x2D86499A410a9ac2139833Ba8d6942b8A8700a7B", 2],
    ["0xc3B441e5B1c0B8E2CA08Cc01e3AD4a1998A9e72d", 1],
    ["0x6c167Ae3f9247CCFBe9b9Bf3C1b014612ca680A5", 1],
    ["0x2D86499A410a9ac2139833Ba8d6942b8A8700a7B", 1],
    ["0xc3B441e5B1c0B8E2CA08Cc01e3AD4a1998A9e72d", 1],
    ["0xb248A284756a52C7eC5Fb119648747128c1eC28b", 1],
    ["0xfC1166cD08aA556CB0Feb875ce3f2ac16070D869", 1],
    ["0x100F82B00E6488aE8C2C6CdA5F3162c0FC0107dA", 1],
    ["0xCfc4BF2ccD9bc5a3F91225c39c40Cdd57F041cf6", 1],
    ["0x44E1c0Cbce2d7B08BF30227d36F6567f9F7CBCA4", 1],
    ["0xc8e2d34FC59636C57269C386A09C8AA12c0Ea2F4", 1],
    ["0xA25DCf955F5A78f81213D88f0BAcC8FEA03E067e", 1],
    ["0xaDc0a310fdBfdF0e62d7929ab2036587C40011b7", 1],
    ["0x740922622811A8Fc1A5AF687aeFe6D5BBC460Be1", 1],
    ["0x8df06f490652Bf4E0eF18a5163b01906f2D95981", 1],
    ["0xe3FA56242De97ED9414b8DE0ed4d77691298561d", 1],
    ["0xdd769e033011d8FCC0F16D3ebDA96f176CDa96f6", 1],
    ["0xeAc369F0502a5fbdE7e3580001040bE795386692", 1],
    ["0x740922622811A8Fc1A5AF687aeFe6D5BBC460Be1", 2],
    ["0xaDc0a310fdBfdF0e62d7929ab2036587C40011b7", 2],
    ["0xdCb68A4eC1B41ce1f753fAA5fA9C477650809CfF", 1],
    ["0x9DDE99BBB492774E7783c3d90E5c0E4961490CA0", 1],
    ["0x259478C08bdf4224a87F9420951d20DF731131Cf", 1],
    ["0x95c26770ffD65108f268659656D8607214F8FfAf", 3],
    ["0xFB2285df9dfBb69188ee8faB3Ebf23422a3910A6", 2],
    ["0x4b246412441b08839fB5F7380b281B5D8C7Ae181", 1],
    ["0x6671219099eA6CCC75Eb3f4f4200D46A97b09a19", 1],
    ["0xda6a10B3bfd88c8658c6EdB94CA1Fd6DEa62889c", 1],
    ["0x3AA40FDdB4896Cbbb83d2Dfc1B4a6EF781F01058", 1],
    ["0x2BAEAb030837918892b022E95e8915b7fAA602f7", 1],
    ["0x8A7087Fd28eC91d48444Cd3ac17d7db8657125d5", 1],
    ["0xeB57dd0A036e0bf4bf16A00C2697C3f6B54d10aB", 1],
    ["0xFCc41B7367F94EC8b9a68B761345a5467A56E204", 1],
    ["0x2bf40D9818430c8Cec0853A2e8DFf51DcDF77B8f", 2],
    ["0xe3FA56242De97ED9414b8DE0ed4d77691298561d", 1],
    ["0xccE524f0A33731Ee49e4BC7c33ADDDA9862d9DcE", 1],
    ["0x9146025BB4A311C8066a9e25EeE700C9be6733AE", 2],
    ["0xE6C486eb5f5cC2C64b53AB6c3942986D648C9b89", 1],
    ["0xD90510fe92DD13635E1201398b36e483D56F1AbC", 1],
    ["0xf1fC5017F4f00673607a8e73d527B8B559339dea", 1],
    ["0x00622116402F303f22D38F3ec202774F183f6468", 1],
    ["0xc9cB9A3f7b439bA8ef8413F7847fF110A794c12E", 1],
    ["0x4E0C09589d862485d724F3f8C1ff5745A52e0570", 5],
    ["0x584313319d0bFeAd2a9d98a7154f5dCb5a62887F", 1],
    ["0xec52Bf592F9e77317d3858F1Ce9aB4FB86195e50", 1],
    ["0x10D094BbFF45b68f0b5261dC84cC724908bDea33", 1],
    ["0xC458F3944C98d19120AB2f7AFe8F8E1568628d3c", 1],
    ["0xc88D4c252E3d796dD8280563F234b78afF4aD7dd", 1],
    ["0x4A09b2Ef6eeE4635555E5e32B61b2412e76644fB", 1],
    ["0x2f42D303b34c29E1F3FEB9CE5d5355f1e101f99D", 1],
    ["0x73cccA7296DfEdB88Bfd68cEda833d8D79abB35f", 1],
    ["0xEa388c0bF4CBEA270473a0e4218bED7Aa26aE4a7", 1],
    ["0x551cE4488D0Ea7c9568E6D13C52Ee4c81D7Acb14", 1],
    ["0xDD8a3114540Dd19806d7FcD7caee159dB3af41f4", 1],
    ["0x2A3Bc5691389Dedd6D8FFcFb826B6b591Ed5E42c", 1],
    ["0x131d8D438C8Da6D4Cf3AE6877ab9F1181E12f636", 1],
    ["0xceDA4186f184d4816B99580bC36dD243C629affD", 1],
    ["0x8eF8cB7E823DBa4b3c09F96Fe9caDb2a4Ea67Cc3", 1],
    ["0xc5Bc0D7D0F281b056a7158feF99aD9A606b53511", 1],
    ["0xB9814fd3585021213A140BA3fB48089aE5F46673", 2],
    ["0xf889Faab204590702c5eFE0f4A72C642a59Ad28A", 1],
    ["0xcB1CE445D01D0BcD07236a77C895e09C3Abe3B34", 1],
    ["0x3bcA4137CaE91A7750c879332121897d6b273367", 1],
    ["0x98B5a355284B42903A7a6d31Fc130E5F2e7D7301", 1],
    ["0xd6CA84C87Fe90EBd16423162767FB0A05a4046ba", 1],
    ["0xEE32F3f24c964330d4702212A096ae2377ed65ff", 1],
    ["0x8e7DfC77CD457cd21160C77a076d7426213B89b6", 1],
    ["0x9B5b2E4C41Cb91A4F0d024F7FC0023A966F4D740", 1],
    ["0x39d26136bD9B2024D2ef03cbE8FB5F0DdE4d7292", 1],
    ["0x16F6ce93135320fCd80F4B680a329BBf05Cb68fe", 1],
    ["0xe136b6E0f5667715C480CeA522627050A5c68E4A", 1],
    ["0xa5428D3d037BFE9fC5F27A1D1741d4404B78749c", 1],
    ["0x2B0666DC49e70C4A23a9bdC4a54695CC2361f72c", 1],
    ["0x5abA5750E3cA0a861022F5C42eFA36F929Ff86c0", 1],
    ["0x2C62fEA2CbF9a501008bE9E9CC5bB978271fe58d", 1],
    ["0x9395D3897Da19e921aA7F97048dE6E64bE3f8C0b", 1],
    ["0xd95177d3899cAa6a4c98B51AaB4b9508D31dc06d", 1],
    ["0x064245A7FDbdF571F77b052Eee4e76682cbB01ba", 1],
    ["0x62F1b4dF30dc386802f512a84AD4d77538356170", 1],
    ["0xf56cC6c3B4eec55B20478bEDE92eEEA5814cF504", 1],
    ["0x39a357999CfED99dd23C3403EED9E785cbd68602", 10],
    ["0x73622bF69Ac59afBb25386760485B4134Bec37F1", 20],
    ["0x3341214aF49039A358EFBA89a9fAC1910dfD9f86", 1],
    ["0x20D72443D9dD6C99a26C654f0ABD215deE5448eB", 1],
    ["0xf46AD5D4a7c993284205e63e8DAe956bA6aEB03d", 7],
    ["0x7bdA36e22524A44ff093Fd332BFE5f60717408B2", 1],
    ["0x3bcA4137CaE91A7750c879332121897d6b273367", 1],
    ["0x073c0BD7685eE79FC8FA045aC1AD2D0265A3766B", 1],
    ["0x0f240079355bFb7bA5449895Ea4aD0134c8AD0da", 1],
    ["0x8A88C42331f8c3f58072773c2E6A7368256Ed48a", 2],
    ["0x2D4099c2F78091182C36B50cd4de37D7012886C3", 1],
    ["0xa53a7E1e00b0bBfdD58A21449e2fE606F58B9FAE", 1],
    ["0x73075CC91Ea38BFad691576A428A27e660d79D2d", 1],
    ["0xe57045d728EFf6cB7F0e74BbA6db66A85cF3EF5F", 1],
    ["0x3D8DA51ed8067094330aAC8555bef477306A248D", 1],
    ["0x3265a87200542D7fc68408723e3296DFc577C7F3", 1],
    ["0xA638281022EBc6E5f32D33Cf0c76ADd600fEbd4E", 1],
    ["0xf46AD5D4a7c993284205e63e8DAe956bA6aEB03d", 7],
    ["0xC4dBC7D5957dceF7eD2B0778C597c16Ce2769E7d", 1],
    ["0x249fDd621085d3e6330fB5908e75b6a71Df33f47", 2],
    ["0x73622bF69Ac59afBb25386760485B4134Bec37F1", 252],
    ["0xf3027C60Ad95B2Ee3faB28A23843B8f5D2552858", 1],
    ["0x338f816BB6425A56dd6c52C835813C1950C69E5d", 1],
    ["0x7F65014Ac2c005C3DfFEFA3FAd407A58041FF5F2", 1],
    ["0x62B90c5A44865B4147e97Dfc80d58641f44BbC33", 1],
    ["0xd4f3E45065d71a060c5FAf8629ba9304Cca535Ac", 1],
  ];

  // mint in n txs (can handle about 500 owners per tx with 3mil gas limit)
  const splits = 1;
  function splitToChunks(array, parts) {
    const copied = [...array];
    let result = [];
    for (let i = parts; i > 0; i--) {
      result.push(copied.splice(0, Math.ceil(copied.length / i)));
    }
    return result;
  }

  const ArchetypeLogic = await ethers.getContractFactory("ArchetypeLogic");
  const archetypeLogic = await ArchetypeLogic.attach("0xd6ABB04bfC53265e8e51Ddd7E711c5A2E6b1524e");
  const Archetype = await ethers.getContractFactory("Archetype", {
    libraries: {
      ArchetypeLogic: archetypeLogic.address,
    },
  });
  const archetype = Archetype.attach("0xf56Af79C9e8446357b8e38CBEcB36976b9C9ed72");

  const airDropListSplit = splitToChunks(airDropList, splits);
  for (const split of airDropListSplit) {
    console.log(split.map(list => list[0]));
    console.log(split.map(list => list[1]));
    const result = await archetype.batchMintTo(
      { key: ethers.constants.HashZero, proof: [] },
      split.map(list => list[0]),
      split.map(list => list[1]),
      ZERO,
      "0x",
      {
        value: ethers.utils.parseEther("0.00"),
        // gasLimit: 30000000 // manually set gas limit to 30 million (block limit)
      }
    );

    const msg = await result.wait();
    console.log({ msg });
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });