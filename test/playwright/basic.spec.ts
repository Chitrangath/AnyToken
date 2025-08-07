
import  basicSetup from "../wallet-setup/basic.setup";
import { testWithSynpress } from '@synthetixio/synpress';
import {  MetaMask, metaMaskFixtures } from '@synthetixio/synpress/playwright';
import { Context } from "wagmi";

const test = testWithSynpress(metaMaskFixtures(basicSetup))
const { expect } = test

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle("AnyToken");
});

test("should show the airdropform when connected , otherwise not", async ({page, context, metamaskPage, extensionId}) => {
  // to check we zee please connect wallet
  await page.goto('/');
  await expect(page.getByText('Please connect')).toBeVisible();

  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId)
  await page.getByTestId('rk-connect-button').click();
  await page.getByTestId('rk-wallet-option-io.metamask').waitFor({
    state: 'visible',
    timeout: 300000
  })
  await page.getByTestId('rk-wallet-option-io.metamask').click();
  await metamask.connectToDapp()

  const customNetwork = {
    name: 'Anvil',
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 31337,
    symbol: 'ETH',
  }

  await expect(page.getByText("Token Address")).toBeVisible();

}) 