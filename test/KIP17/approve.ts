import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 approve', () => {
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

  it('Calling approve with the same address as owner address must be reverted', async () => {
    const [mintUser] = accounts;
    
    const currentTokenId = await token.getCurrentTokenId();
    await expect(token.approve(mintUser.address, currentTokenId))
      .to.be.revertedWith('KIP17: approval to current owner');
  });

  it('Calling approve with own token or already approved token, it must be reverted', async () => {
    const [, approveUser] = accounts;
    
    const currentTokenId = await token.getCurrentTokenId();
    
    await expect(token.connect(approveUser).approve(approveUser.address, currentTokenId))
      .to.be.revertedWith('KIP17: approve caller is not owner nor approved for all');
  });

  it('If the approve call succeeds, the Approval event should be called', async () => {
    const [mintUser, approveUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();

    await expect(token.approve(approveUser.address, currentTokenId))
      .to.be.emit(token, 'Approval')
      .withArgs(mintUser.address, approveUser.address, currentTokenId);
  });
})
