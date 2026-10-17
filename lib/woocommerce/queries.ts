/**
 * WooGraphQL Query for Public Catalog Products
 * Note: WooGraphQL treats products polymorphically; price and stockStatus fields
 * MUST be queried within inline fragments (... on SimpleProduct, ... on VariableProduct)
 */
export const GET_PRODUCTS_QUERY = `
  query GetProducts($first: Int = 20) {
    products(first: $first) {
      nodes {
        id
        databaseId
        name
        slug
        shortDescription
        __typename
        image {
          sourceUrl
          altText
        }
        productCategories {
          nodes {
            id
            name
            slug
          }
        }
        ... on SimpleProduct {
          price
          regularPrice
          salePrice
          stockStatus
        }
        ... on VariableProduct {
          price
          regularPrice
          stockStatus
          variations(first: 10) {
            nodes {
              id
              databaseId
              name
              price
              stockStatus
            }
          }
        }
      }
    }
  }
`;

/**
 * WPGraphQL JWT Authentication Login Mutation
 * Provided by wp-graphql-jwt-authentication
 */
export const LOGIN_MUTATION = `
  mutation LoginUser($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
      refreshToken
      user {
        id
        databaseId
        name
        email
        nicename
      }
      customer {
        id
        sessionToken
      }
    }
  }
`;

/**
 * Protected query to verify authenticated session and viewer details
 */
export const GET_VIEWER_QUERY = `
  query GetViewer {
    viewer {
      id
      databaseId
      name
      email
    }
  }
`;

/**
 * Combined profile query: retrieves WordPress viewer identity and WooCommerce customer data
 */
export const GET_USER_PROFILE_QUERY = `
  query GetUserProfile {
    viewer {
      id
      databaseId
      name
      email
    }
    customer {
      id
      databaseId
      displayName
      email
      billing {
        firstName
        lastName
        address1
        city
        country
        phone
        email
      }
      orders(first: 10) {
        nodes {
          id
          orderNumber
          status
          total
          date
        }
      }
    }
  }
`;

/**
 * WooGraphQL Register Customer Mutation
 */
export const REGISTER_CUSTOMER_MUTATION = `
  mutation RegisterCustomer($input: RegisterCustomerInput!) {
    registerCustomer(input: $input) {
      customer {
        id
        databaseId
        email
        displayName
      }
    }
  }
`;

/**
 * WooGraphQL Query for Cart State
 */
export const GET_CART_QUERY = `
  query GetCart {
    cart {
      contents {
        itemCount
        nodes {
          key
          quantity
          total
          subtotal
          product {
            node {
              id
              databaseId
              name
              slug
              image {
                sourceUrl
                altText
              }
              ... on SimpleProduct {
                price
                regularPrice
                salePrice
              }
              ... on VariableProduct {
                price
                regularPrice
              }
            }
          }
        }
      }
      subtotal
      total
      shippingTotal
      discountTotal
      isEmpty
    }
  }
`;

/**
 * WooGraphQL Add to Cart Mutation
 */
export const ADD_TO_CART_MUTATION = `
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      cart {
        total
        subtotal
        contents {
          itemCount
        }
      }
      cartItem {
        key
        quantity
        product {
          node {
            id
            databaseId
            name
          }
        }
      }
    }
  }
`;

/**
 * WooGraphQL Update Item Quantities Mutation
 */
export const UPDATE_CART_QUANTITIES_MUTATION = `
  mutation UpdateItemQuantities($input: UpdateItemQuantitiesInput!) {
    updateItemQuantities(input: $input) {
      cart {
        total
        subtotal
        isEmpty
        contents {
          itemCount
          nodes {
            key
            quantity
            total
            subtotal
          }
        }
      }
    }
  }
`;

/**
 * WooGraphQL Remove Items From Cart Mutation
 */
export const REMOVE_CART_ITEMS_MUTATION = `
  mutation RemoveItemsFromCart($input: RemoveItemsFromCartInput!) {
    removeItemsFromCart(input: $input) {
      cart {
        total
        subtotal
        isEmpty
        contents {
          itemCount
        }
      }
    }
  }
`;

/**
 * WooGraphQL Empty Cart Mutation
 */
export const EMPTY_CART_MUTATION = `
  mutation EmptyCart($input: EmptyCartInput!) {
    emptyCart(input: $input) {
      cart {
        isEmpty
      }
    }
  }
`;

/**
 * WooGraphQL Process Checkout Mutation
 * Takes current GraphQL cart session, generates WooCommerce order, and returns native checkout/order-pay redirect URL
 */
export const CHECKOUT_MUTATION = `
  mutation ProcessCheckout($input: CheckoutInput!) {
    checkout(input: $input) {
      result
      redirect
      order {
        id
        databaseId
        orderNumber
        total
        status
      }
    }
  }
`;

/**
 * WooGraphQL Query for Order Details
 */
export const GET_ORDER_DETAILS_QUERY = `
  query GetOrderDetails($id: ID!) {
    order(id: $id, idType: DATABASE_ID) {
      id
      databaseId
      orderNumber
      orderKey
      status
      date
      total
      subtotal
      shippingTotal
      discountTotal
      paymentMethodTitle
      billing {
        firstName
        lastName
        email
        phone
        address1
        city
        country
      }
      shipping {
        firstName
        lastName
        address1
        city
        country
      }
      lineItems {
        nodes {
          product {
            node {
              id
              name
              image {
                sourceUrl
                altText
              }
            }
          }
          quantity
          total
        }
      }
    }
  }
`;


