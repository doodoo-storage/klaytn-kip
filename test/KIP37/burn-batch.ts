import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';

describe('KIP37Token mint', () => {
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

    await token.mintBatch(mintUser.address, [firstTokenAmount, secondTokenAmount]);
  });

  it('Must be reverted if from and message sender are not the same when calling burnBatch', async () => {
    const [, anotherUser] = accounts;
    await expect(token.burnBatch(anotherUser.address, [1, 2], [firstTokenAmount, secondTokenAmount]))
      .to.be.revertedWith('KIP37: caller is not owner nor approved')
  });

  it('If the lengths of ids and amounts do not match when calling burnBatch, they must be reverted', async () => {
    const [mintUser] = accounts;

    await expect(token.burnBatch(mintUser.address, [1, 2], [firstTokenAmount]))
      .to.be.revertedWith('KIP37: ids and amounts length mismatch');
  });

  it('When burnBatch is called, the TransferBatch event must be called after burnBatch', async () => {
    const [mintUser] = accounts;

    await expect(token.burnBatch(mintUser.address, [1, 2], [firstTokenAmount, secondTokenAmount]))
      .to.be.emit(token, 'TransferBatch')
      .withArgs(mintUser.address, mintUser.address, '0x0000000000000000000000000000000000000000', [1, 2], [firstTokenAmount, secondTokenAmount]);

    const [firstTokenBalance, secondTokenBalance] = await token.balanceOfBatch([mintUser.address, mintUser.address], [1, 2]);

    expect(firstTokenBalance).to.equal(0);
    expect(secondTokenBalance).to.equal(0);
  })
});