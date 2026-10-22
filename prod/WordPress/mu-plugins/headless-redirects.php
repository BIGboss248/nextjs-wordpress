<?php
/**
 * Plugin Name: Headless Auth & Redirects
 * Description: Synchronizes Next.js cart items (simple & variable products) into native WooCommerce checkout via fill_cart, and redirects WooCommerce customer login, registration, and account pages back to Next.js while keeping admin dashboard access intact.
 * Version: 1.3.0
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 0. Headless Cart Bridge (fill_cart):
 * Synchronizes items (Simple & Variable products) and optional customer billing info
 * from the Next.js cart into the native WooCommerce PHP session before checkout renders.
 */
add_action('wp_loaded', function () {
    if (!empty($_GET['fill_cart'])) {
        unset($_GET['add-to-cart'], $_REQUEST['add-to-cart']);
    }
}, 1);

add_action('template_redirect', function () {
    if (empty($_GET['fill_cart']) || !function_exists('WC') || !WC()->cart) {
        return;
    }

    if (WC()->session && !WC()->session->has_session()) {
        WC()->session->set_customer_session_cookie(true);
    }

    WC()->cart->empty_cart();

    $raw_fill = sanitize_text_field(wp_unslash($_GET['fill_cart']));
    $items = explode(',', $raw_fill);

    foreach ($items as $item) {
        $parts = explode(':', trim($item));
        $product_id   = isset($parts[0]) ? absint($parts[0]) : 0;
        $quantity     = isset($parts[1]) ? max(1, absint($parts[1])) : 1;
        $variation_id = isset($parts[2]) ? absint($parts[2]) : 0;

        if ($product_id <= 0) {
            continue;
        }

        $variation_attributes = [];

        if ($variation_id > 0) {
            $variation = wc_get_product($variation_id);
            if ($variation && is_callable([$variation, 'get_variation_attributes'])) {
                $variation_attributes = $variation->get_variation_attributes();
            }
            WC()->cart->add_to_cart($product_id, $quantity, $variation_id, $variation_attributes);
        } else {
            $product = wc_get_product($product_id);
            if ($product && $product->is_type('variable')) {
                $children = $product->get_children();
                if (!empty($children)) {
                    $first_var_id = absint($children[0]);
                    foreach ($children as $child_id) {
                        $child_obj = wc_get_product($child_id);
                        if ($child_obj && $child_obj->is_in_stock() && $child_obj->is_purchasable()) {
                            $first_var_id = absint($child_id);
                            $variation_attributes = $child_obj->get_variation_attributes();
                            break;
                        }
                    }
                    if (empty($variation_attributes)) {
                        $first_var = wc_get_product($first_var_id);
                        if ($first_var && is_callable([$first_var, 'get_variation_attributes'])) {
                            $variation_attributes = $first_var->get_variation_attributes();
                        }
                    }
                    WC()->cart->add_to_cart($product_id, $quantity, $first_var_id, $variation_attributes);
                }
            } else {
                WC()->cart->add_to_cart($product_id, $quantity);
            }
        }
    }

    if (WC()->customer) {
        $billing_fields = [
            'billing_first_name' => 'set_billing_first_name',
            'billing_last_name'  => 'set_billing_last_name',
            'billing_email'      => 'set_billing_email',
            'billing_phone'      => 'set_billing_phone',
            'billing_address_1'  => 'set_billing_address_1',
            'billing_city'       => 'set_billing_city',
        ];
        $updated_customer = false;
        foreach ($billing_fields as $param => $setter) {
            if (!empty($_GET[$param]) && is_callable([WC()->customer, $setter])) {
                $val = $param === 'billing_email'
                    ? sanitize_email(wp_unslash($_GET[$param]))
                    : sanitize_text_field(wp_unslash($_GET[$param]));
                if (!empty($val)) {
                    WC()->customer->{$setter}($val);
                    $updated_customer = true;
                }
            }
        }
        if ($updated_customer) {
            WC()->customer->save();
        }
    }

    WC()->cart->calculate_totals();
    WC()->cart->maybe_set_cart_cookies();

    if (WC()->session) {
        WC()->session->set_customer_session_cookie(true);
        WC()->session->save_data();
    }

    wc_clear_notices();

    wp_safe_redirect(wc_get_checkout_url());
    exit;
}, 1);

/**
 * Allow cookie authentication for server-to-server GraphQL requests.
 *
 * WPGraphQL 2.5.4+ requires a nonce for cookie-authenticated requests to
 * prevent CSRF. The Next.js server forwards the customer's WordPress cookies
 * to /graphql but cannot generate a WP nonce, so those requests would be
 * downgraded to guest. Browser-originated requests still send an Origin or
 * Referer header and therefore keep the default nonce requirement.
 */
add_filter('graphql_cookie_auth_require_nonce', function ($require_nonce) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';

    if (empty($origin) && empty($referer)) {
        return false;
    }

    return $require_nonce;
}, 10, 1);

// 1. Template redirect: If a logged-in user accesses /my-account, redirect immediately to Next.js /account
add_action('template_redirect', function () {
    if (is_account_page() && is_user_logged_in()) {
        // Allow customer-logout endpoint to proceed normally
        global $wp;
        if (isset($wp->query_vars['customer-logout'])) {
            return;
        }

        $redirect = !empty($_REQUEST['redirect_to']) ? esc_url_raw($_REQUEST['redirect_to']) : home_url('/account');
        wp_safe_redirect($redirect);
        exit;
    }
});

// 2. Inject redirect_to hidden field in WooCommerce login and registration forms
add_action('woocommerce_login_form_end', function () {
    if (!empty($_REQUEST['redirect_to'])) {
        echo '<input type="hidden" name="redirect_to" value="' . esc_attr($_REQUEST['redirect_to']) . '" />' . PHP_EOL;
    }
});

add_action('woocommerce_register_form_end', function () {
    if (!empty($_REQUEST['redirect_to'])) {
        echo '<input type="hidden" name="redirect_to" value="' . esc_attr($_REQUEST['redirect_to']) . '" />' . PHP_EOL;
    }
});

// 3. WooCommerce customer login redirect
add_filter('woocommerce_login_redirect', function ($redirect, $user) {
    if (!empty($_REQUEST['redirect_to'])) {
        return esc_url_raw($_REQUEST['redirect_to']);
    }

    return home_url('/account');
}, 999, 2);

// 4. Standard WordPress login redirect (for /wp-login.php)
add_filter('login_redirect', function ($redirect_to, $requested_redirect_to, $user) {
    if (!empty($requested_redirect_to)) {
        return esc_url_raw($requested_redirect_to);
    }

    if (isset($user->roles) && is_array($user->roles) && in_array('administrator', $user->roles, true)) {
        return admin_url();
    }

    return home_url('/account');
}, 999, 3);

// 5. WooCommerce customer registration redirect
add_filter('woocommerce_registration_redirect', function ($redirect) {
    if (!empty($_REQUEST['redirect_to'])) {
        return esc_url_raw($_REQUEST['redirect_to']);
    }

    return home_url('/account');
}, 999, 1);

// 6. Logout redirect back to Next.js storefront home
add_action('wp_logout', function () {
    $redirect = !empty($_REQUEST['redirect_to']) ? esc_url_raw($_REQUEST['redirect_to']) : home_url('/');
    wp_safe_redirect($redirect);
    exit;
});
