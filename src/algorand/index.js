import algosdk from "algosdk";
import axios from "axios";

// Write functions to do the following,
// 1. Create the necessary transactions to mint arc3 NFTs

const pinImageFile = async (assetName, desc, assetFile) => {
  const res = await new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.readAsDataURL(assetFile);
    reader.onload = async function () {
      try {
        // Upload base64 image to server
        const res = await axios.post("/api/upload", {
          asset: {
            name: assetName,
            description: desc,
          },
          image: reader.result
        });
        resolve(res);
      } catch (err) {
        // Reject any error returned by server
        reject(err);
      }
    };
  })

  return res.data;
}

const signAndSubmit = async (signTransactions, sendTransactions, txns) => {
  // used by backend to sign and submit txns
  const groupedTxns = algosdk.assignGroupID(txns);

  const encodedTxns = groupedTxns.map((txn) => algosdk.encodeUnsignedTransaction(txn));

  const signed = await signTransactions(encodedTxns);

  const res = await sendTransactions(signed, 4);

  return res;
};

const getCreateNftTxn = async (algodClient, from, assetName, defaultFrozen, unitName, assetURL) => {
  const suggestedParams = await algodClient.getTransactionParams().do();

  // txn to create a pure nft
  return algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from,
    assetName,
    total: 1,
    decimals: 0,
    defaultFrozen,
    unitName,
    assetURL,
    suggestedParams,
  });
};

export { pinImageFile, getCreateNftTxn, signAndSubmit };
