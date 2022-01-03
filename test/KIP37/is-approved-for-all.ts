import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';


describe('KIP37Token isApprovedForAll', () => {
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

  it('Calling isApprovedForAll should return the approval flag', async () => {
    const [mintUser, approveUser] = accounts;

    const setApprovalForAllTx = await token.setApprovalForAll(approveUser.address, true);
    await setApprovalForAllTx.wait();

    const isApprovedForAll = await token.isApprovedForAll(mintUser.address, approveUser.address);
    expect(isApprovedForAll).to.equal(true);
  });

});