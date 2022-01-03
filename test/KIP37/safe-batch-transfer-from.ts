import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';

describe('KIP37Token safeBatchTransferFrom', () => {
  let token: KIP37Token;
  let accounts: SignerWithAddress[];
  
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';
  const firstTokenAmount = 100;
  const secondTokenAmount = 200;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const [mintUser] = accounts;
    
    const Token = await ethers.getContractFactory('KIP37Token');
    token = await Token.deploy(tokenURI);
    await token.deployed();

    await token.mint(mintUser.address, firstTokenAmount);
    await token.mint(mintUser.address, secondTokenAmount);
  });

  it('If the lengths of ids and amounts do not match when calling safeBatchTransferFrom, they must be reverted', async () => {
    const [mintUser, transferUser] = accounts;

    await expect(token.safeBatchTransferFrom(mintUser.address, transferUser.address, [1, 2], [firstTokenAmount], []))
      .to.be.revertedWith('KIP37: ids and amounts length mismatch');
  });

  it('Must be reverted if zero address when safeBatchTransferFrom call', async () => {
    const [mintUser] = accounts;

    await expect(token.safeBatchTransferFrom(mintUser.address, '0x0000000000000000000000000000000000000000', [1, 2], [firstTokenAmount, secondTokenAmount], []))
      .to.be.revertedWith('KIP37: transfer to the zero address');
  });

  it('Must be reverted if from and message sender are not the same when calling safeBatchTransferFrom', async () => {
    const [mintUser, transferUser] = accounts;

    await expect(token.safeBatchTransferFrom(transferUser.address, transferUser.address, [1, 2], [firstTokenAmount, secondTokenAmount], []))
      .to.be.revertedWith('KIP37: transfer caller is not owner nor approved');
  });

  it('Must be reverted if from and not approval user when calling safeBatchTransferFrom', async () => {
    const [mintUser, transferUser] = accounts;

    await expect(token.connect(transferUser).safeBatchTransferFrom(mintUser.address, transferUser.address, [1, 2], [firstTokenAmount, secondTokenAmount], []))
      .to.be.revertedWith('KIP37: transfer caller is not owner nor approved');
  });

  it('When calling safeBatchTransferFrom, it must be reverted if the amount to be transferred is less than balance', async () => {
    const [mintUser, transferUser] = accounts;

    await expect(token.safeBatchTransferFrom(mintUser.address, transferUser.address, [1, 2], [firstTokenAmount, 5000], []))
      .to.be.revertedWith('KIP37: insufficient balance for transfer');
  });

  it('If the safeTransferFrom call succeeds, the token is moved and the TransferSingle event should be called', async () => {
    const [mintUser, transferUser] = accounts;

    await expect(token.safeBatchTransferFrom(mintUser.address, transferUser.address, [1, 2], [firstTokenAmount, secondTokenAmount], []))
      .to.be.emit(token, 'TransferBatch')
      .withArgs(mintUser.address, mintUser.address, transferUser.address, [1, 2], [firstTokenAmount, secondTokenAmount]);

    const transferUserFirstTokenBalance = await token.balanceOf(transferUser.address, 1);
    const transferUserSecondTokenBalance = await token.balanceOf(transferUser.address, 2);
    
    expect(transferUserFirstTokenBalance).to.equal(firstTokenAmount);
    expect(transferUserSecondTokenBalance).to.equal(secondTokenAmount);
  });
});