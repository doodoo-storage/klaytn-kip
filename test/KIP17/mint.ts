import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 mint', () => {
  let token: KIP17Token;
  let accounts: SignerWithAddress[];

  const tokenName = 'Fingerlabs17';
  const tokenSymbol = 'FLB';
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    
    const Token = await ethers.getContractFactory('KIP17Token');
    token = await Token.deploy(tokenName, tokenSymbol);
    await token.deployed();
  });

  it('Calling mint with address zero should revert', async () => {
    await expect(token.mint('0x0000000000000000000000000000000000000000', tokenURI)).
      to.be.revertedWith('KIP17: mint to the zero address');
  });

  it('Should be after mint the token, the Transfer event should be called', async () => {
    const [mintUser] = accounts;

    await expect(token.mint(mintUser.address, tokenURI))
      .to.be.emit(token, 'Transfer')
      .withArgs('0x0000000000000000000000000000000000000000', mintUser.address, 1);
  });
})
