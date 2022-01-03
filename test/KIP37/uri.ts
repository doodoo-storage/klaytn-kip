import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP37Token } from '../../../typechain';

describe('KIP37Token uri', () => {
  let token: KIP37Token;
  let accounts: SignerWithAddress[];
  
  const tokenURI = 'http://ipfs.devhand.net/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc';

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    const Token = await ethers.getContractFactory('KIP37Token');
    token = await Token.deploy(tokenURI);
    await token.deployed();
  });

  it('Should return the new token, the uri function return data must be tokenURI variable', async () => {
    const uri = await token.uri(10);
    expect(uri).to.equal(tokenURI);
  });
});