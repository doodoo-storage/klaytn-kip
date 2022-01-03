import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';

describe('KIP37Token mintBatch', () => {
  let token: KIP37Token;
  let accounts: SignerWithAddress[];
  
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';
  const firstTokenAmount = 100;
  const secondTokenAmount = 200;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory('KIP37Token');
    token = await Token.deploy(tokenURI);
    await token.deployed();
  });

  it('Calling mintBatch with address zero should revert', async () => {
    await expect(token.mintBatch('0x0000000000000000000000000000000000000000', []))
      .to.be.revertedWith('KIP37: mint to the zero address');
  });

  it('When mintBatch is called, the TransferBatch event must be called after mint', async () => {
    const [mintUser] = accounts;

    await expect(token.mintBatch(mintUser.address, [firstTokenAmount, secondTokenAmount]))
      .to.be.emit(token, 'TransferBatch')
      .withArgs(mintUser.address, '0x0000000000000000000000000000000000000000', mintUser.address, [1, 2], [firstTokenAmount, secondTokenAmount]);

    const [firstTokenBalance, secondTokenBalance] = await token.balanceOfBatch([mintUser.address, mintUser.address], [1, 2]);

    expect(firstTokenBalance).to.equal(firstTokenAmount);
    expect(secondTokenBalance).to.equal(secondTokenAmount);
  });
});