import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';


describe('KIP37Token safeTransferFrom', () => {
  let token: KIP37Token;
  let accounts: SignerWithAddress[];
  
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';
  const tokenAmount = 10;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const [mintUser] = accounts;
    
    const Token = await ethers.getContractFactory('KIP37Token');
    token = await Token.deploy(tokenURI);
    await token.deployed();

    await token.mint(mintUser.address, tokenAmount);
  });

  it('Must be reverted if zero address when safeTransferFrom call', async () => {
    const [mintUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    await expect(token.safeTransferFrom(mintUser.address, '0x0000000000000000000000000000000000000000', currentTokenId, 10, []))
      .to.be.revertedWith('KIP37: transfer to the zero address');
  });

  it('Must be reverted if from and message sender are not the same when calling safeTransferFrom', async () => {
    const [mintUser, transferUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    await expect(token.safeTransferFrom(transferUser.address, transferUser.address, currentTokenId, 10, []))
      .to.be.revertedWith('KIP37: caller is not owner nor approved');
  });

  it('Must be reverted if from and not approval user when calling safeTransferFrom', async () => {
    const [mintUser, transferUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    await expect(token.connect(transferUser).safeTransferFrom(mintUser.address, transferUser.address, currentTokenId, 10, []))
      .to.be.revertedWith('KIP37: caller is not owner nor approved');
  });

  it('When calling safeTransferFrom, it must be reverted if the amount to be transferred is less than balance', async () => {
    const [mintUser, transferUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    await expect(token.safeTransferFrom(mintUser.address, transferUser.address, currentTokenId, 1000, []))
      .to.be.revertedWith('KIP37: insufficient balance for transfer');
  });

  it('If the safeTransferFrom call succeeds, the token is moved and the TransferSingle event should be called', async () => {
    const [mintUser, transferUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    await expect(token.safeTransferFrom(mintUser.address, transferUser.address, currentTokenId, tokenAmount, []))
      .to.be.emit(token, 'TransferSingle')
      .withArgs(mintUser.address, mintUser.address, transferUser.address, currentTokenId, tokenAmount);

    const transferUserBalance = await token.balanceOf(transferUser.address, currentTokenId);
    expect(transferUserBalance).to.equal(tokenAmount);
  });
});