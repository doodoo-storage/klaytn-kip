import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 ownerOf', () => {
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

  it('Calling ownerOf with address 0 should revert', async () => {
    await expect(token.ownerOf('0x0000000000000000000000000000000000000000')).
      to.be.revertedWith('KIP17: owner query for nonexistent token');
  });

  it('Should be after mint the token, return owner id', async () => {
    const [mintUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    expect(await token.ownerOf(currentTokenId)).to.be.equal(mintUser.address);
  });
})
