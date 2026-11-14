// clients/product-client.js
import http from 'k6/http';
import { config } from '../config/settings.js';

const expectedProductStatus = http.expectedStatuses(200);

export function getProduct(productId) {
  return http.get(
    `${config.baseUrl}/products/${encodeURIComponent(productId)}`,
    {
      headers: { Accept: 'application/json' },
      timeout: `${config.requestTimeoutSeconds}s`,
      redirects: 0,
      responseCallback: expectedProductStatus,
      tags: {
        name: 'GET /products/:id',
        endpoint: 'product_detail',
      },
    },
  );
}
