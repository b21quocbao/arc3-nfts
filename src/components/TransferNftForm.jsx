import { useWallet } from "@txnlab/use-wallet";
import { useState } from "react";
import { getAlgodClient } from "../clients";
import Button from "./Button";
import axios from "axios";
import { pinImageFile, signAndSubmit, getCreateNftTxn } from "../algorand";

const network = process.env.NEXT_PUBLIC_NETWORK || "SandNet";
const algod = getAlgodClient(network);

export default function TransferNFTForm() {
  const { activeAddress, signTransactions, sendTransactions } = useWallet();
  const [assetFile, setAssetFile] = useState(null);
  const [txnref, setTxnRef] = useState("");
  const [txnUrl, setTxnUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getTxnRefUrl = (txId) => {
    if (network === "SandNet") {
      return `https://app.dappflow.org/explorer/transaction/${txId}`;
    } else if (network === "TestNet") {
      return `https://testnet.algoexplorer.io/tx/${txId}`;
    }

    return "";
  }

  const handleFileChange = async (e) => {
    setAssetFile(e.target.files[0]);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const assetName = e.target["asset-name"].value;
    const desc = e.target["description"].value;
    console.log(assetName, desc, assetFile);

    // write your code here to mint NFT

    setIsLoading(true);

    // call backend to pin image file and metadata
    const preparedAsset = await pinImageFile(assetName, desc, assetFile);
    
    // deploy asset
    const createNftTxn = await getCreateNftTxn(
      algod,
      activeAddress,
      assetName,
      false,
      "ACSNFT",
      preparedAsset.url
    );
    console.log("Create NFT Transaction: ", createNftTxn);

    // sign and submit atomic transactions
    const res = await signAndSubmit(signTransactions, sendTransactions, [createNftTxn]);
    console.log("Submitted tx result: ", res);

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
