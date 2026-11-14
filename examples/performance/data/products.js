// data/products.js
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

const products = new SharedArray('product-input-data', function () {
  const rows = JSON.parse(open(import.meta.resolve('./products.json')));

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('products.json phải là một mảng không rỗng');
  }

  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || row.id.trim() === '') {
      throw new Error('Mỗi dòng products.json cần id kiểu string có nội dung');
    }
  }

  return rows;
});

export function selectProduct() {
  const index = exec.scenario.iterationInTest % products.length;
  return products[index];
}
