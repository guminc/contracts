export function AssetType(assetClass, data) {
  return { assetClass, data };
}

export function Asset(assetClass, assetData, value) {
  return { assetType: AssetType(assetClass, assetData), value };
}

export function Order(
  maker,
  makeAsset,
  taker,
  takeAsset,
  salt,
  start,
  end,
  dataType,
  data
) {
  return {
    maker,
    makeAsset,
    taker,
    takeAsset,
    salt,
    start,
    end,
    dataType,
    data,
  };
}
