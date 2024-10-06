import { useWallet } from "@txnlab/use-wallet";
import { useState, useEffect } from "react";
import { getAlgodClient } from "../clients";
import Button from "./Button";
import axios from "axios";
import { pinImageFile, signAndSubmit, getCreateNftTxn, fetchFungibleToken, getTransferFungibleTxn } from "../algorand";

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algod = getAlgodClient(network);

export default function TransferNFTForm() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [assetFile, setAssetFile] = useState(null);
  const [txnref, setTxnRef] = useState("");
  const [txnUrl, setTxnUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assetIndex, setAssetIndex] = useState(null);

  const getTxnRefUrl = (txId) => {
    if (network === "SandNet") {
      return `https://app.dappflow.org/explorer/transaction/${txId}`;
    } else if (network === "TestNet") {
      return `https://lora.algokit.io/testnet/transaction/${txId}`;
    }

    return "";
  }

  const handleFileChange = async (e) => {
    setAssetFile(e.target.files[0]);
  }

  useEffect(() => {
    if (!activeAddress) return;
    fetchFungibleToken(algod, activeAddress).then(assetIndex => {
      setAssetIndex(assetIndex);
    });
  }, [activeAddress]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const assetName = e.target["asset-name"].value;
    const desc = e.target["description"].value;
    console.log(assetName, desc, assetFile);

    // write your code here to mint NFT

    setIsLoading(true);

    // call backend to pin image file and metadata
    const preparedAsset = await pinImageFile(assetName, desc, assetFile);
    
    // deploy nft asset
    const createNftTxn = await getCreateNftTxn(
      algod,
      activeAddress,
      assetName,
      false,
      "ACSNFT",
      preparedAsset.url
    );
    console.log("Create NFT Transaction: ", createNftTxn);

    // transfer fungible tokens to deployer
    const xferTxn = await getTransferFungibleTxn(
      algod,
      activeAddress,
      process.env.NEXT_PUBLIC_DEPLOYER_ADDR,
      assetIndex,
      5 * 10**6
    );

    console.log("Transfer Fungible Transaction: ", xferTxn);

    // sign and submit atomic transactions
    const response = await signAndSubmit(signTransactions, sendTransactions, [createNftTxn, xferTxn]);
    console.log("Submitted tx result: ", response);
    setTxnRef(response.txId);
    const txnUrl = getTxnRefUrl(response.txId);
    setTxnUrl(txnUrl);

    setIsLoading(false);
  };

  return (
    <div className="w-full">
      {activeAddress && txnref && (
        <p className="mb-4 text-left">
          <a href={txnUrl} target="_blank" className="text-blue-500">
            Tx ID: {txnref}
          </a>
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4 w-full">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="asset-name">
            Asset Name:
          </label>
          <input type="text" id="asset-name" className="w-full text-black" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description:
          </label>
          <textarea id="description" className="w-full text-black" required></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Upload Image:
          </label>
          <input type="file" id="file-upload" accept="image/*" onChange={handleFileChange} required />
        </div>
        <Button isLoading={isLoading} disabled={isLoading} label="Mint NFT" type="submit" />
      </form>
    </div>
  );
}
