const fs = require('node:fs');
const path = require('node:path');

const network = process.argv[2] || process.env.DEPLOYMENT_NETWORK || 'monad-mainnet';
const deploymentPath = path.join(__dirname, '..', 'deployments', `${network}.json`);
const indexPath = path.join(__dirname, '..', 'index.html');

if (!fs.existsSync(deploymentPath)) {
  console.error(`Missing deployments/${network}.json`);
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
const address = deployment.address;

if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
  console.error(`Invalid contract address in deployments/${network}.json`);
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const next = html.replace(
  /const OLYMPUS_CONTRACT_ADDRESS = '[^']*';/,
  `const OLYMPUS_CONTRACT_ADDRESS = '${address}';`
);

if (next === html) {
  console.error('Could not find OLYMPUS_CONTRACT_ADDRESS in index.html');
  process.exit(1);
}

fs.writeFileSync(indexPath, next);
console.log(`Set OLYMPUS_CONTRACT_ADDRESS=${address}`);
