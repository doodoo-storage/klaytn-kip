import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 getApproved', () => {
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

  it('Calling getApproved with a not exist tokenId should revert', async () => {
    const notExistTokenId = 100;
    
    await expect(token.getApproved(notExistTokenId))
      .to.be.revertedWith('KIP17: approved query for nonexistent token');
  });

  it('Calling getApproved should return the address with the token approval', async () => {
    const [, approveUser] = accounts;
    const currentTokenId = await token.getCurrentTokenId();

    const approvedTx = await token.approve(approveUser.address, currentTokenId);
    await approvedTx.wait();

    const approvalUserAddress = await token.getApproved(currentTokenId);
    expect(approvalUserAddress).to.equal(approveUser.address);
  });
})
