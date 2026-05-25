require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { ethers } = require('ethers');

const buildPath = path.join(__dirname, '..', 'build', 'OlympusExchange.json');

if (!fs.existsSync(buildPath)) {
  console.error('Missing build/OlympusExchange.json. Run npm run contract:compile first.');
  process.exit(1);
}

const {
  MONAD_PRIVATE_KEY,
  MONAD_RPC_URL = 'https://rpc.monad.xyz',
  TREASURY_ADDRESS = '0x19a863aeC37C83C7Cb34548c29f1F7e41BCB51Ca',
  CONTINUE_FEE_MON = '10',
  DEPLOYMENT_NETWORK = 'monad-mainnet'
} = process.env;

if (!MONAD_PRIVATE_KEY) {
  console.error('Set MONAD_PRIVATE_KEY in .env before deploying.');
  process.exit(1);
}

async function main() {
  const artifact = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
  const provider = new ethers.JsonRpcProvider(MONAD_RPC_URL);
  const wallet = new ethers.Wallet(MONAD_PRIVATE_KEY, provider);
  const fee = ethers.parseEther(CONTINUE_FEE_MON);

  console.log(`Deploying from ${wallet.address}`);
  console.log(`Treasury: ${TREASURY_ADDRESS}`);
  console.log(`Continue fee: ${CONTINUE_FEE_MON} MON`);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(wallet.address);
  console.log(`Network chainId: ${network.chainId.toString()}`);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} MON`);

  const deployTx = await factory.getDeployTransaction(TREASURY_ADDRESS, fee);
  const estimatedGas = await provider.estimateGas({ ...deployTx, from: wallet.address });
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas || feeData.gasPrice;

  if (gasPrice) {
    const estimatedCost = estimatedGas * gasPrice;
    console.log(`Estimated deploy gas: ${estimatedGas.toString()}`);
    console.log(`Estimated deploy cost: ${ethers.formatEther(estimatedCost)} MON`);

    if (balance < estimatedCost) {
      console.error('');
      console.error('Deploy wallet has insufficient MON for gas.');
      console.error(`Send MON to: ${wallet.address}`);
      console.error(`Balance: ${ethers.formatEther(balance)} MON`);
      console.error(`Estimated needed: ${ethers.formatEther(estimatedCost)} MON`);
      process.exit(1);
    }
  }

  const contract = await factory.deploy(TREASURY_ADDRESS, fee);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployment = {
    network: DEPLOYMENT_NETWORK,
    address,
    treasury: TREASURY_ADDRESS,
    continueFeeMon: CONTINUE_FEE_MON,
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, `${DEPLOYMENT_NETWORK}.json`),
    JSON.stringify(deployment, null, 2)
  );

  console.log(`OlympusExchange deployed: ${address}`);
  console.log(`Saved deployments/${DEPLOYMENT_NETWORK}.json`);
}

main().catch(error => {
  const message =
    error && error.error && error.error.message
      ? error.error.message
      : error && error.shortMessage
        ? error.shortMessage
        : error && error.message
          ? error.message
          : String(error);

  console.error(`Deploy failed: ${message}`);
  if (/insufficient balance/i.test(message)) {
    console.error('Send MON to the deployer wallet and run npm.cmd run contract:deploy again.');
  }
  process.exit(1);
});
