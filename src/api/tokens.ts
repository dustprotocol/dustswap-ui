import { Signer } from '@reef-defi/evm-provider';
import { calculateAmount } from '../utils/math';
import { defaultGasLimit, getContract, getReefswapRouter } from './api';

export interface Token {
  name: string;
  address: string;
  balance: string;
  decimals: number;
}

export interface TokenWithAmount extends Token {
  amount: string;
}

const defaultTokenAddresses = [
  '0x0000000000000000000000000000000001000000', // Reef
  '0x0000000000000000000000000000000001000001', // RUSD
  '0x3C4Bf01eb3bd2B88E1aCE7fd76Ccb4F12d2867a8', // Reef copy ?
];

// TODO add api call on reef explore
export const loadVerifiedERC20TokenAddresses = async (): Promise<string[]> => Promise.resolve([...defaultTokenAddresses]);

const loadToken = async (address: string, signer: Signer): Promise<Token> => {
  const signerAddress = await signer.getAddress();
  const contract = await getContract(address, signer);
  const balance = await contract.balanceOf(signerAddress);
  const decimals = await contract.decimals();
  const symbol = await contract.symbol();

  return {
    decimals,
    name: symbol,
    address: contract.address,
    balance: balance.toString(),
  };
};

export const loadTokens = async (addresses: string[], signer: Signer): Promise<Token[]> => {
  const tokens = Promise.all(
    addresses.map((address) => loadToken(address, signer)),
  );
  return tokens;
};

export const approveTokenAmount = async (token: TokenWithAmount, signer: Signer): Promise<void> => {
  const { address } = token;
  const reefswapContrctAddress = getReefswapRouter(signer).address;
  const contract = await getContract(address, signer);
  const bnAmount = calculateAmount(token);

  await contract.approve(reefswapContrctAddress, bnAmount);
};

export const swapTokens = async (sellToken: TokenWithAmount, buyToken: TokenWithAmount, signer: Signer): Promise<void> => {
  const signerAddress = await signer.getAddress();

  const buyAmount = calculateAmount(buyToken);
  const sellAmount = calculateAmount(sellToken);
  const reefswapRouter = getReefswapRouter(signer);

  await approveTokenAmount(sellToken, signer);
  await reefswapRouter.swapExactTokensForTokens(
    sellAmount,
    buyAmount,
    [sellToken.address, buyToken.address],
    signerAddress,
    10000000000,
    defaultGasLimit(),
  );
};