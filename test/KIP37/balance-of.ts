import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';


describe('KIP37Token balanceOf', () => {
  let token: KIP37Token;
  let accounts: SignerWithAddress[];
  
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';
  const mintAmount = 10;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const [mintUser] = accounts;
    
    const Token = await ethers.getContractFactory('KIP37Token');
    token = await Token.deploy(tokenURI);
    await token.deployed();

    await token.mint(mintUser.address, mintAmount);
  });

  it('Calling balanceOf with address 0 should revert', async () => {
    await expect(token.balanceOf('0x0000000000000000000000000000000000000000', 1)).
      to.be.revertedWith('KIP37: balance query for the zero address');
  });

  it('Shoule be calling  balanceOf, return balance by addres', async () => {
    const [mintUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    const balance = await token.balanceOf(mintUser.address, currentTokenId);
    expect(balance).to.equal(mintAmount);
  });
});
