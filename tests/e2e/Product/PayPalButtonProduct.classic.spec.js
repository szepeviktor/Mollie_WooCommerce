// @ts-check
const { expect } = require('@playwright/test');
const { test } = require('../Shared/base-test');
const {setOrderAPI, markPaidInMollie} = require('../Shared/mollieUtils');
const {wooOrderPaidPage, wooOrderDetailsPageOnPaid} = require('../Shared/testMollieInWooPage');

test.describe('PayPal Transaction in classic product', () => {
    test('Not be seen if not enabled', async ({ page }) => {
        // Go to virtual product product
        await page.goto(process.env.E2E_URL_TESTSITE + '/wp-admin/admin.php?page=wc-settings&tab=checkout&section=mollie_wc_gateway_paypal');
        await page.locator('input[name="mollie_wc_gateway_paypal_mollie_paypal_button_enabled_product"]').uncheck();
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Save changes').click()
        ]);
        await page.goto(process.env.E2E_URL_TESTSITE + '/product/album/');
        await expect(page.locator('#mollie-PayPal-button')).not.toBeVisible();
    });
    test('Not be seen if not virtual', async ({ page }) => {
        // set PayPal visible in product
        await page.goto(process.env.E2E_URL_TESTSITE + '/wp-admin/admin.php?page=wc-settings&tab=checkout&section=mollie_wc_gateway_paypal');
        await page.locator('input[name="mollie_wc_gateway_paypal_mollie_paypal_button_enabled_product"]').check();
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Save changes').click()
        ]);
        // Go to simple product
        await page.goto(process.env.E2E_URL_TESTSITE + '/product/beanie');
        await expect(page.locator('#mollie-PayPal-button')).not.toBeVisible();
    });
    test('Transaction with Order API - virtual product', async ({ page, gateways, products }) => {
        let testedGateway = gateways;
        await setOrderAPI(page);
        // set PayPal visible in product
        await page.goto(process.env.E2E_URL_TESTSITE + '/wp-admin/admin.php?page=wc-settings&tab=checkout&section=mollie_wc_gateway_paypal');
        await page.locator('input[name="mollie_wc_gateway_paypal_mollie_paypal_button_enabled_product"]').check();
        await Promise.all([
            page.waitForNavigation(),
            page.locator('text=Save changes').click()
        ]);
        // Go to virtual product page
        await page.goto(process.env.E2E_URL_TESTSITE + '/product/album/');

        await expect(page.locator('#mollie-PayPal-button')).toBeVisible();
        //Capture WooCommerce total amount
        const totalAmount = products.virtual.price
        await Promise.all([
            page.waitForNavigation(/*{ url: 'https://www.mollie.com/checkout/test-mode?method=paypal&token=3.q6wq1i' }*/),
            page.locator('input[alt="PayPal Button"]').click()
        ]);

        // IN MOLLIE
        // Capture order number in Mollie and mark as paid
        const mollieOrder = await markPaidInMollie(page);

        // WOOCOMMERCE ORDER PAID PAGE
        await wooOrderPaidPage(page, mollieOrder, totalAmount, testedGateway);

        // WOOCOMMERCE ORDER PAGE
        await wooOrderDetailsPageOnPaid(page, mollieOrder, testedGateway);
    });
});
