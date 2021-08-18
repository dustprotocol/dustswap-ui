import { Signer } from '@reef-defi/evm-provider';
import { Contract, BigNumber } from 'ethers';
import { ERC20 } from '../../assets/abi/ERC20';
import ReefswapFactory from '../../assets/abi/ReefswapFactory';
import ReefswapRouter from '../../assets/abi/ReefswapRouter';
import { Token } from './tokens';

export enum ReefChains {
  Testnet='wss://rpc-testnet.reefscan.com/ws',
  Mainnet='wss://rpc.reefscan.com/ws',
}

export const checkIfERC20ContractExist = async (address: string, signer: Signer): Promise<void> => {
  try {
    const contract = new Contract(address, ERC20, signer);

    // TODO add additional checkers to be surtent of Contract existance
    await contract.name();
    await contract.symbol();
    await contract.decimals();
  } catch (error) {
    console.error(error);
    throw new Error('Unknown address');
  }
};

export const getContract = async (address: string, signer: Signer): Promise<Contract> => {
  await checkIfERC20ContractExist(address, signer);
  return new Contract(address, ERC20, signer);
};

export const balanceOf = async (address: string, balanceAddress: string, signer: Signer): Promise<BigNumber> => {
  const contract = await getContract(address, signer);
  const balance = await contract.balanceOf(balanceAddress);
  return balance;
};

export const getReefswapRouter = (signer: Signer): Contract => new Contract('0x0A2906130B1EcBffbE1Edb63D5417002956dFd41', ReefswapRouter, signer);
export const getReefswapFactory = (signer: Signer): Contract => new Contract('0xcA36bA38f2776184242d3652b17bA4A77842707e', ReefswapFactory, signer);

export const calculateFee = (token: Token, feeRation = 0.03): Token => {
  const mm = Math.min(Math.max(feeRation, 0), 100);
  const fee = Math.round(mm * 100);
  const fullAmount = BigNumber.from(token.balance);
  const feeAmount = fullAmount
    .div(BigNumber.from(100))
    .sub(BigNumber.from(fee));
  const balance = fullAmount.add(feeAmount).toString();
  return { ...token, balance };
};