// flows/read-product.js
import { check } from 'k6';
import { Rate } from 'k6/metrics';
import { selectProduct } from '../data/products.js';
import { getProduct } from '../clients/product-client.js';

const businessSuccess = new Rate('business_success');
const metricTags = { endpoint: 'product_detail' };

export function runReadProduct() {
  const product = selectProduct();
  let response = null;
  let body = null;

  try {
    response = getProduct(product.id);

    if (response.status === 200) {
      try {
        body = response.json();
      } catch (error) {
        // Giữ body=null để các check phản ánh JSON không hợp lệ.
      }
    }
  } catch (error) {
    // Không che lỗi thành công: response/body vẫn thiếu và check sẽ fail.
    // Không in token hoặc toàn bộ response trong vòng lặp tải.
  }

  const result = { response, body, expectedId: product.id };

  const ok = check(
    result,
    {
      'HTTP 200': (r) => r.response !== null && r.response.status === 200,
      'JSON object hợp lệ': (r) =>
        r.body !== null &&
        typeof r.body === 'object' &&
        !Array.isArray(r.body),
      'id đúng sản phẩm': (r) =>
        r.body !== null && r.body.id === r.expectedId,
      'name có nội dung': (r) =>
        r.body !== null &&
        typeof r.body.name === 'string' &&
        r.body.name.trim().length > 0,
    },
    metricTags,
  );

  // Một mẫu success/failure cho một lần đánh giá nghiệp vụ.
  businessSuccess.add(ok, metricTags);
}
