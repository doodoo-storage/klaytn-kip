import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';

describe('KIP37Token mint', () => {
  let token: KIP37Token;
  let accounts: SignerWithAddress[];
  
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';
  const tokenAmount = 100;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const [mintUser] = accounts;
    
    const Token = await ethers.getContractFactory('KIP37Token');
    token = await Token.deploy(tokenURI);
    await token.deployed();

    await token.mint(mintUser.address, tokenAmount);
  });

  it('Must be reverted if from and message sender are not the same when calling burn', async () => {
    const [, anotherUser] = accounts;
    await expect(token.burn(anotherUser.address, 1, tokenAmount))
      .to.be.revertedWith('KIP37: caller is not owner nor approved')
  });

  it('When calling burn, it must be reverted if the amount to be transferred is less than balance', async () => {
    const [mintUser] = accounts;
    await expect(token.burn(mintUser.address, 1, 10000))
      .to.be.revertedWith('KIP37: burn amount exceeds balance');
  });

  it('When burn is called, the TransferSingle event must be called after burn', async () => {
    const [mintUser] = accounts;
    
    await expect(token.burn(mintUser.address, 1, tokenAmount))
      .to.be.emit(token, 'TransferSingle')
      .withArgs(mintUser.address, mintUser.address, '0x0000000000000000000000000000000000000000', 1, tokenAmount);

    const balance = await token.balanceOf(mintUser.address, 1);
    expect(balance).to.equal(0);
  })
});