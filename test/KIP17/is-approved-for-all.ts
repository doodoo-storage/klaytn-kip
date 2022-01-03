import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 isApprovedForAll', () => {
  let token: KIP17Token;
  let accounts: SignerWithAddress[];

  const tokenName = 'Fingerlabs17';
  const tokenSymbol = 'FLB';

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory('KIP17Token');
    token = await Token.deploy(tokenName, tokenSymbol);
    await token.deployed();
  });

  it('Calling isApprovedForAll should return the approval flag', async () => {
    const [mintUser, approveUser] = accounts;

    const setApprovalForAllTx = await token.setApprovalForAll(approveUser.address, true);
    await setApprovalForAllTx.wait();

    const isApprovedForAll = await token.isApprovedForAll(mintUser.address, approveUser.address);
    expect(isApprovedForAll).to.equal(true);
  });
})
