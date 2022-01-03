import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';

describe('KIP37Token mint', () => {
  let token: KIP37Token;
  let accounts: SignerWithAddress[];
  
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';
  const firstTokenAmount = 100;
  const secondTokenAmount = 200;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory('KIP37Token');
    token = await Token.deploy(tokenURI);
    await token.deployed();
  });

  it('Calling mint with address zero should revert', async () => {
    await expect(token.mint('0x0000000000000000000000000000000000000000', firstTokenAmount))
      .to.be.revertedWith('KIP37: mint to the zero address');
  });

  it('If the lengths of toList and values do not match when calling mintToList, they must be reverted', async () => {
    const [firstMintUser] = accounts;

    await expect(token.mintToList([firstMintUser.address], [1, 1]))
      .to.be.revertedWith('KIP37: toList and values length mismatch');
  });

  it('When mint is called, the TransferSingle event must be called after mint', async () => {
    const [mintUser] = accounts;
    await expect(token.mint(mintUser.address, firstTokenAmount))
      .to.be.emit(token, 'TransferSingle')
      .withArgs(mintUser.address, '0x0000000000000000000000000000000000000000', mintUser.address, 1, firstTokenAmount);

    const balance = await token.balanceOf(mintUser.address, 1);
    expect(balance).to.equal(firstTokenAmount);
  });
});