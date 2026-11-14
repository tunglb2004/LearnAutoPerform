// tests/product.test.js
import { sleep } from 'k6';
import { config, createOptions } from '../config/settings.js';
import { runReadProduct } from '../flows/read-product.js';

export const options = createOptions(config);

export function readProduct() {
  runReadProduct();

  if (config.thinkSeconds > 0) {
    sleep(config.thinkSeconds);
  }
}
