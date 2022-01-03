import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 burn', () => {
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

    await token.mint(mintUser.address, tokenURI);
  });

  it('Should be after mint the token, the Transfer event should be called', async () => {
    const [mintUser] = accounts;
    const currentTokenId = await token.getCurrentTokenId();

    await expect(token.burn(currentTokenId))
      .to.be.emit(token, 'Transfer')
      .withArgs(mintUser.address, '0x0000000000000000000000000000000000000000', currentTokenId);
    
    const balance = await token.balanceOf(mintUser.address);
    expect(balance).to.equal(0);
  });
})
