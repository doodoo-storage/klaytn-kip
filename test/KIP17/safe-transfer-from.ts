import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KIP17Token } from '../../../typechain';

describe('KIP17 safeTransferFrom', () => {
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

  it('Must be reverted if not owner when safeTransferFrom call', async () => {
    const [mintUser, transferUser] = accounts;

    const currentTokenId = await token.getCurrentTokenId();
    
    await expect(token.connect(transferUser)
      ['safeTransferFrom(address,address,uint256)'](mintUser.address, transferUser.address, currentTokenId))
      .to.be.revertedWith('KIP17: transfer caller is not owner nor approved');
  });

  it('If the safeTransferFrom call succeeds, the token is moved and the TransferSingle event should be called', async () => {
    const [mintUser, transferUser] = accounts;
    const currentTokenId = await token.getCurrentTokenId();

    await expect(token['safeTransferFrom(address,address,uint256)'](mintUser.address, transferUser.address, currentTokenId))
      .to.be.emit(token, 'Transfer')
      .withArgs(mintUser.address, transferUser.address, currentTokenId);
  });
});
