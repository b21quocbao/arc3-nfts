import pinataSDK from '@pinata/sdk';
import { Readable } from 'stream';
import { createReadStream } from "fs";
import { writeFile } from "fs/promises";

// Initialize Pinata SDK
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

export default async function handler(req, res) {
  const { asset, image } = req.body;
  // convert image base64 to buffer
  const buffer = Buffer.from(image.split(',')[1], "base64");
  const mimeType = image.split(';')[0].split(":")[1];

  console.log("Mimetype: ", mimeType);

  // pin content directory
  const folderOptions = {
    pinataMetadata: {
      name: "nfts",
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };

  // create readstream from buffer
  await writeFile("image", buffer)
  const result = await pinata.pinFileToIPFS(createReadStream("image"), folderOptions);
  console.log("Digital content pinned: ", result);

  // pin metadata
  const jsonOptions = {
    pinataMetadata: {
      name: `metadata.json`,
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };

  const metadata = {
    name: asset.name,
    description: asset.description,
    image: `ipfs://${result.IpfsHash}`,
    image_mimetype: mimeType,
    properties: {
      file_url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      file_url_mimetype: mimeType,
    },
  };

  const resultMeta = await pinata.pinJSONToIPFS(metadata, jsonOptions);
  console.log("JSON Metadata pinned: ", resultMeta);

  // ARC3 asset url should end with #arc3 - https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md
  const preparedAsset = {
    name: asset.name,
    url: `ipfs://${resultMeta.IpfsHash}#arc3`,
  };

  res.status(200).json(preparedAsset);
}
