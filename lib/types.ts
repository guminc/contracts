export type IArchetypeConfig = {
  baseUri: string;
  affiliateSigner: string;
  ownerAltPayout: string;
  superAffiliatePayout: string;
  maxSupply: number;
  maxBatchSize: number;
  affiliateFee: number;
  platformFee: number;
  defaultRoyalty: number;
  discounts: {
    affiliateDiscount: number;
    mintTiers: {
      numMints: number;
      mintDiscount: number;
    }[];
  };
};
