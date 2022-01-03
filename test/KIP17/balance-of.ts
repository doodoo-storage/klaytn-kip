import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 balanceOf', () => {
  let token: KIP17Token;
  let accounts: SignerWithAddress[];

  const tokenName = 'Fingerlabs17';
  const tokenSymbol = 'FLB';
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const [mintUser] = accounts;
    
    const Token = await ethers.getContractFactory('KIP17Token');
    token = await Token.deploy(tokenName, tokenSymbol);
    await token.deployed();

    await token.mint(mintUser.address, tokenURI);
  });

  it('Calling balanceOf with address 0 should revert', async () => {
    await expect(token.balanceOf('0x0000000000000000000000000000000000000000')).
      to.be.revertedWith('KIP17: balance query for the zero address');
  });

  it('Shoule be calling  balanceOf, return balance by addres', async () => {
    const [mintUser] = accounts;
    expect(await token.balanceOf(mintUser.address)).to.equal(1);
  });
})
