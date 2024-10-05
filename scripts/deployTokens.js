import * as dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });
import { getAlgodClient } from "../src/clients/index.js";
import algosdk from "algosdk";

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algodClient = getAlgodClient(network);

// get creator account
const deployer = algosdk.mnemonicToSecretKey(process.env.NEXT_PUBLIC_DEPLOYER_MNEMONIC);

const submitToNetwork = async (signedTxn) => {
  // send txn
  let tx = await algodClient.sendRawTransaction(signedTxn).do();
  console.log("Transaction : " + tx.txId);

  // Wait for transaction to be confirmed
  confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

  //Get the completed Transaction
  console.log(
    "Transaction " +
    tx.txId +
    " confirmed in round " +
    confirmedTxn["confirmed-round"]
  );

  return confirmedTxn;
};

(async () => {
  // write your code here

  // Deploy fungible tokens using deployer account
  // https://developer.algorand.org/docs/get-details/asa/#creating-an-asset
  const suggestedParams = await algodClient.getTransactionParams().do();

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: deployer.addr,
    suggestedParams,
    defaultFrozen: false,
    unitName: 'fut',
    assetName: 'Fungible Token',
    total: 1000, // initial supply of 1000 fungible tokens
    decimals: 18,
  });

  const signedTxn = txn.signTxn(deployer.sk);
  const result = await submitToNetwork(signedTxn);

  // Get asset index returned from tx
  const assetIndex = result['asset-index'];
  console.log(`Asset ID created: ${assetIndex}`);
})();
