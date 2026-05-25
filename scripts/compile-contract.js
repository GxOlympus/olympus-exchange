const fs = require('node:fs');
const path = require('node:path');
const solc = require('solc');

const contractPath = path.join(__dirname, '..', 'contracts', 'OlympusExchange.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'OlympusExchange.sol': { content: source }
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors || [];
const fatal = errors.filter(error => error.severity === 'error');

for (const error of errors) {
  console.log(error.formattedMessage.trim());
}

if (fatal.length) {
  process.exit(1);
}

const contract = output.contracts['OlympusExchange.sol'].OlympusExchange;
const buildDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(
  path.join(buildDir, 'OlympusExchange.json'),
  JSON.stringify(
    {
      contractName: 'OlympusExchange',
      abi: contract.abi,
      bytecode: `0x${contract.evm.bytecode.object}`
    },
    null,
    2
  )
);

console.log('Compiled OlympusExchange.sol');
