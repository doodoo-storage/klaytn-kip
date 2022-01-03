import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';


describe('KIP37Token setApprovalForAll', () => {
  let token: KIP37Token;
  let accounts: SignerWithAddress[];
  
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const [mintUser] = accounts;
    
    const Token = await ethers.getContractFactory('KIP37Token');
    token = await Token.deploy(tokenURI);
    await token.deployed();

    await token.mint(mintUser.address, 10);
  });

  it('Calling setApprovalForAll with the same address as to address must be reverted', async () => {
    const [mintUser] = accounts;
    await expect(token.setApprovalForAll(mintUser.address, true))
      .to.be.revertedWith('KIP37: setting approval status for self');
  });

  it('If the setApprovalForAll call succeeds, the ApprovalForAll event should be called', async () => {
    const [mintUser, approveUser] = accounts;

    await expect(token.setApprovalForAll(approveUser.address, true))
      .to.be.emit(token,'ApprovalForAll')
      .withArgs(mintUser.address, approveUser.address, true);
  });
});