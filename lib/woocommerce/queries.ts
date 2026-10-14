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
        }
      }
    }
  }
`;
