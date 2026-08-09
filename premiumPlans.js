/**
 * Fashionist Premium & Payment Integration Configuration
 * ======================================================
 * All prices, plan details, payment options, and Lemon Squeezy integration
 * configuration settings are extracted into this editable config file.
 */

window.PREMIUM_PLANS_CONFIG = {
    // Section Header
    headerTitle: "Fashionist Premium",

    // Featured Pro Tier Card
    tier: {
        id: "pro-tier",
        name: "Pro Tier",
        iconClass: "fa-solid fa-crown text-gold mb-2",
        iconStyle: "font-size:2rem; color:var(--accent-gold);",
        description: "Unlimited AI insights, custom event styling, and removed blur blocks."
    },

    // Available Subscription Billing Plans
    plans: [
        {
            id: "monthly",
            name: "Monthly",
            price: "$9.99",
            priceValue: 9.99,
            currency: "USD",
            billingInterval: "month",
            selectedByDefault: true,
            cardStyle: "flex:1; text-align:center; padding:16px; border:2px solid var(--accent-rose-gold); cursor:pointer;",
            savingsText: null,
            // Lemon Squeezy Variant ID for Monthly Plan (To be replaced with real Lemon Squeezy Checkout URL / Variant ID)
            lemonSqueezyVariantId: "YOUR_MONTHLY_VARIANT_ID"
        },
        {
            id: "yearly",
            name: "Yearly",
            price: "$79.00",
            priceValue: 79.00,
            currency: "USD",
            billingInterval: "year",
            selectedByDefault: false,
            cardStyle: "flex:1; text-align:center; padding:16px; cursor:pointer;",
            savingsText: "Save 34%",
            savingsStyle: "margin:0; font-size:0.8rem; color:var(--accent-success);",
            // Lemon Squeezy Variant ID for Yearly Plan (To be replaced with real Lemon Squeezy Checkout URL / Variant ID)
            lemonSqueezyVariantId: "YOUR_YEARLY_VARIANT_ID"
        }
    ],

    // Payment Method Options
    // Note: These buttons are UI placeholders until live Lemon Squeezy / Payment Gateway is linked
    paymentMethods: [
        {
            id: "apple-pay",
            name: "Apple Pay",
            iconHtml: '<i class="fa-brands fa-apple" style="font-size:1.5rem;"></i>',
            extraClass: "",
            isPlaceholder: true // Placeholder - non-functional until Lemon Squeezy checkout is wired
        },
        {
            id: "google-pay",
            name: "Google Pay",
            iconHtml: '<i class="fa-brands fa-google text-rose" style="font-size:1.5rem;"></i>',
            extraClass: "",
            isPlaceholder: true // Placeholder - non-functional until Lemon Squeezy checkout is wired
        },
        {
            id: "paypal",
            name: "PayPal",
            iconHtml: '<i class="fa-brands fa-paypal" style="font-size:1.5rem; color:#003087;"></i>',
            extraClass: "",
            isPlaceholder: true // Placeholder - non-functional until Lemon Squeezy checkout is wired
        },
        {
            id: "upi",
            name: "UPI Bank Transfer",
            iconHtml: '<i class="fa-solid fa-building-columns text-muted" style="font-size:1.5rem;"></i>',
            extraClass: "",
            isPlaceholder: true // Placeholder - non-functional until Lemon Squeezy checkout is wired
        },
        {
            id: "card",
            name: "Credit / Debit Card",
            iconHtml: '<i class="fa-solid fa-credit-card text-muted" style="font-size:1.5rem;"></i>',
            extraClass: "mb-8",
            isPlaceholder: true // Placeholder - non-functional until Lemon Squeezy checkout is wired
        }
    ],

    // =========================================================================
    // LEMON SQUEEZY CHECKOUT INTEGRATION PLACEHOLDER
    // =========================================================================
    // When ready to launch live billing:
    // 1. Set enabled to true
    // 2. Add your Lemon Squeezy Store ID and Variant IDs above
    // 3. Include Lemon Squeezy JS library (<script src="https://assets.lemonsqueezy.com/lemon.js" defer></script>)
    // =========================================================================
    lemonSqueezy: {
        enabled: false,
        storeId: "YOUR_LEMON_SQUEEZY_STORE_ID",
        storeUrl: "https://your-store.lemonsqueezy.com"
    }
};
