import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 setApprovalForAll', () => {
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

  it('Calling setApprovalForAll with the same address as to address must be reverted', async () => {
    const [mintUser] = accounts;
    await expect(token.setApprovalForAll(mintUser.address, true))
      .to.be.revertedWith('KIP17: approve to caller');
  });

  it('If the setApprovalForAll call succeeds, the ApprovalForAll event should be called', async () => {
    const [mintUser, approveUser] = accounts;

    await expect(token.setApprovalForAll(approveUser.address, true))
      .to.be.emit(token,'ApprovalForAll')
      .withArgs(mintUser.address, approveUser.address, true);
  });
})
