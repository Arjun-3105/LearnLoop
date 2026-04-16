import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // We get the contract to deploy
  const SkillNFT = await hre.ethers.getContractFactory("SkillNFT");
  
  // Update these parameters if you want a different name/symbol
  const skillNFT = await SkillNFT.deploy("LearnLoop Skill", "LSKL");

  await skillNFT.waitForDeployment();

  const address = await skillNFT.getAddress();
  console.log("SkillNFT deployed to:", address);
  
  console.log("\nNext steps:");
  console.log("1. Copy the address above.");
  console.log("2. Open your .env file.");
  console.log("3. Update NEXT_PUBLIC_CONTRACT_ADDRESS with this value.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
