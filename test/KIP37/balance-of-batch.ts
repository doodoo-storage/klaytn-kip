import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';


describe('KIP37Token balanceOfBatch', () => {
  let token: KIP37Token;
  let accounts: SignerWithAddress[];
  
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';
  const firstMintAmount = 10;
  const secondMintAmount = 20;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const [firstUser, secondUser] = accounts;
    
    const Token = await ethers.getContractFactory('KIP37Token');
    token = await Token.deploy(tokenURI);
    await token.deployed();

    await token.mint(firstUser.address, firstMintAmount);
    await token.mint(secondUser.address, secondMintAmount);
  });

  it('Calling balanceOfBatch with address 0 should revert', async () => {
    await expect(token.balanceOf('0x0000000000000000000000000000000000000000', 1)).
      to.be.revertedWith('KIP37: balance query for the zero address');
  });

  it('Shoule be calling  balanceOfBatch, return balance by addresses', async () => {
    const [firstUser, secondUser] = accounts;
    
    const [firstUserBalance, secondUserBalance] = await token.balanceOfBatch(
      [firstUser.address, secondUser.address],
      [1, 2]
    );

    expect(firstUserBalance).to.equal(firstMintAmount);
    expect(secondUserBalance).to.equal(secondMintAmount);
  });
});
