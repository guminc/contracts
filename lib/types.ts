export type IArchetypeConfig = {
  baseUri: string;
  affiliateSigner: string;
  maxSupply: number;
  maxBatchSize: number;
  affiliateFee: number;
  defaultRoyalty: number;
  discounts: {
    affiliateDiscount: number;
    mintTiers: {
      numMints: number;
      mintDiscount: number;
    }[];
  };
  tokenPool: number[];
};

export type IArchetypePayoutConfig = {
  ownerBps: number;
  platformBps: number;
  partnerBps: number;
  superAffiliateBps: number;
  superAffiliateTwoBps: number;
  partner: string;
  superAffiliate: string;
  superAffiliateTwo: string;
};
