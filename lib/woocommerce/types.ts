export interface ProductImage {
  sourceUrl: string;
  altText?: string | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductNode {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
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
