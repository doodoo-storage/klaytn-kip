import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 transferFrom', () => {
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

    await token.mint(mintUser.address, tokenURI)
  });

  it('Must be reverted if not owner when transferFrom call', async () => {
    const [mintUser, transferUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    
    await expect(token.connect(transferUser)
      .transferFrom(mintUser.address, transferUser.address, currentTokenId))
      .to.be.revertedWith('KIP17: transfer caller is not owner nor approved');
  });

  it('Must be reverted If the address of owner and from are the same when transferFrom call', async () => {
    const [, transferUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    
    await expect(token.transferFrom(transferUser.address, transferUser.address, currentTokenId))
      .to.be.revertedWith('KIP17: transfer of token that is not own');
  });

  it('Must be reverted If the zero address when transferFrom call', async () => {
    const [mintUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    
    await expect(token.transferFrom(mintUser.address, '0x0000000000000000000000000000000000000000', currentTokenId))
      .to.be.revertedWith('KIP17: transfer to the zero address');
  });

  it('Approvals should be initialized when transferFrom is called', async () => {
    const [mintUser, transferUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();

    const approveTx = await token.approve(transferUser.address, currentTokenId);
    await approveTx.wait();

    const transferFromTx = await token.transferFrom(mintUser.address, transferUser.address, currentTokenId);
    await transferFromTx.wait();

    const approvedAddress = await token.getApproved(currentTokenId);
    expect(approvedAddress).to.equal('0x0000000000000000000000000000000000000000');
  });

  it('If the transferFrom call is successful, the token owner is changed and the Transfer event should be called', async () => {
    const [mintUser, transferUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();

    await expect(token.transferFrom(mintUser.address, transferUser.address, currentTokenId))
      .to.be.emit(token, 'Transfer')
      .withArgs(mintUser.address, transferUser.address, currentTokenId);

    const ownerAddress = await token.ownerOf(currentTokenId);
    expect(ownerAddress).to.equal(transferUser.address);
  });
});
