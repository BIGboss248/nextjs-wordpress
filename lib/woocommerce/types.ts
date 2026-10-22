export interface ProductImage {
  sourceUrl: string;
  altText?: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductVariationNode {
  id: string;
  databaseId: number;
  name: string;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string | null;
}

export interface ProductNode {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  __typename?: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: ProductImage | null;
  productCategories?: {
    nodes: ProductCategory[];
  };
  // Polymorphic fields from SimpleProduct and VariableProduct
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string | null;
  variations?: {
    nodes: ProductVariationNode[];
  } | null;
}

export interface ProductsQueryResult {
  products: {
    nodes: ProductNode[];
  };
}

export interface WooCommerceQueryResult<T> {
  data: T | null;
  error?: string | null;
  endpoint: string;
}

export interface WordPressUser {
  id: string;
  databaseId?: number;
  name: string;
  email?: string;
  nicename?: string;
  capabilities?: string[];
}

export interface CustomerSession {
  id: string;
  sessionToken?: string;
}

export interface LoginMutationPayload {
  login: {
    authToken: string;
    refreshToken?: string;
    user: WordPressUser;
    customer?: CustomerSession;
  };
}

export interface ViewerQueryResult {
  viewer: WordPressUser | null;
}

export interface BillingAddress {
  firstName?: string | null;
  lastName?: string | null;
  address1?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total?: string | null;
  date?: string | null;
}

export interface WooCommerceCustomer {
  id: string;
  databaseId?: number | null;
  displayName?: string | null;
  email?: string | null;
  billing?: BillingAddress | null;
  orders?: {
    nodes: CustomerOrder[];
  } | null;
}

export interface UserProfileQueryResult {
  viewer: WordPressUser | null;
  customer: WooCommerceCustomer | null;
}

export interface RegisterCustomerInput {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterCustomerPayload {
  registerCustomer: {
    customer: {
      id: string;
      databaseId?: number | null;
      email?: string | null;
      displayName?: string | null;
    } | null;
  };
}

export interface CartItemProduct {
  id: string;
  databaseId: number;
  name: string;
  slug?: string | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  image?: ProductImage | null;
}

export interface CartItemNode {
  key: string;
  quantity: number;
  total?: string | null;
  subtotal?: string | null;
  product?: {
    node: CartItemProduct;
  } | null;
  variation?: {
    node: ProductVariationNode;
  } | null;
}

export interface CartData {
  contents?: {
    itemCount: number;
    nodes: CartItemNode[];
  } | null;
  subtotal?: string | null;
  total?: string | null;
  shippingTotal?: string | null;
  discountTotal?: string | null;
  isEmpty: boolean;
}

export interface CartQueryResult {
  cart: CartData | null;
}

export interface AddToCartInput {
  productId: number;
  quantity?: number;
  variationId?: number;
  extraData?: string;
  clientMutationId?: string;
}

export interface AddToCartPayload {
  addToCart: {
    cart: {
      total?: string | null;
      subtotal?: string | null;
      contents?: {
        itemCount: number;
      } | null;
    } | null;
    cartItem: {
      key: string;
      quantity: number;
      product?: {
        node: {
          id: string;
          databaseId: number;
          name: string;
        };
      } | null;
    } | null;
  } | null;
}

export interface UpdateItemQuantitiesInput {
  items: Array<{
    key: string;
    quantity: number;
  }>;
}

export interface UpdateItemQuantitiesPayload {
  updateItemQuantities: {
    cart: {
      total?: string | null;
      subtotal?: string | null;
      isEmpty: boolean;
      contents?: {
        itemCount: number;
        nodes: Array<{
          key: string;
          quantity: number;
          total?: string | null;
          subtotal?: string | null;
        }>;
      } | null;
    } | null;
  } | null;
}

export interface RemoveItemsFromCartInput {
  keys: string[];
}

export interface RemoveItemsFromCartPayload {
  removeItemsFromCart: {
    cart: {
      total?: string | null;
      subtotal?: string | null;
      isEmpty: boolean;
      contents?: {
        itemCount: number;
      } | null;
    } | null;
  } | null;
}

export interface EmptyCartPayload {
  emptyCart: {
    cart: {
      isEmpty: boolean;
    } | null;
  } | null;
}

export interface CheckoutBillingInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface CheckoutInput {
  clientMutationId?: string;
  isPaid?: boolean;
  paymentMethod?: string;
  customerNote?: string;
  billing?: CheckoutBillingInput;
  shipping?: CheckoutBillingInput;
  shipToDifferentAddress?: boolean;
}

export interface CheckoutPayload {
  checkout: {
    result?: string | null;
    redirect?: string | null;
    order?: {
      id: string;
      databaseId: number;
      orderNumber: string;
      total?: string | null;
      status?: string | null;
    } | null;
  } | null;
}

export interface OrderLineItem {
  product?: {
    node: {
      id: string;
      name: string;
      image?: ProductImage | null;
    };
  } | null;
  quantity: number;
  total?: string | null;
}

export interface OrderDetails {
  id: string;
  databaseId: number;
  orderNumber: string;
  orderKey?: string | null;
  status: string;
  date: string;
  total?: string | null;
  subtotal?: string | null;
  shippingTotal?: string | null;
  discountTotal?: string | null;
  paymentMethodTitle?: string | null;
  billing?: BillingAddress | null;
  shipping?: BillingAddress | null;
  lineItems?: {
    nodes: OrderLineItem[];
  } | null;
}

export interface OrderDetailsQueryResult {
  order: OrderDetails | null;
}


