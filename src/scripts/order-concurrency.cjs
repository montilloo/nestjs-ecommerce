const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const baseUrl = 'http://localhost:3000';

async function send(method, path, body, token) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  return {
    status: res.status,
    body: await res.json(),
  };
}

async function main() {
  const productId = Number(process.env.ORDER_TEST_PRODUCT_ID);
  const username = process.env.SEED_USERNAME;
  const password = process.env.SEED_PASSWORD;

  assert(
    Number.isSafeInteger(productId) && productId > 0,
    '请配置有效的 ORDER_TEST_PRODUCT_ID',
  );
  assert(username && password, '请配置本地测试账号');

  const login = await send('POST', '/auth/login', {
    username,
    password,
  });

  assert.equal(login.status, 200, '登录失败');
  const token = login.body.data?.accessToken;
  assert.equal(typeof token, 'string', '登录响应缺少 accessToken');
  assert(token.length > 0, '令牌不能为空');

  const reset = await send(
    'PATCH',
    `/products/${productId}`,
    { stock: 1, status: 1 },
    token,
  );

  assert.equal(reset.status, 200, '测试商品初始化失败');

  const requestId = randomUUID();
  // 先发出所有请求，再等待结果；没有逐条 await
  // 这里用 Promise.allSettled() 等待所有请求结束，避免某个请求发生网络错误后，其他请求尚未完成就提前得出结论。
  const results = await Promise.allSettled(
    Array.from({ length: 10 }, () =>
      send(
        'POST',
        '/orders',
        {
          productId,
          quantity: 1,
          requestId,
        },
        token,
      ),
    ),
  );

  const rejected = results.filter((r) => r.status === 'rejected');
  assert.equal(rejected.length, 0, '存在网络失败或超时，请核对数据库');

  const statuses = results.map((r) => r.value.status);
  console.log('10 次请求的 HTTP 状态：', statuses);

  const successCount = statuses.filter((s) => s === 201).length;
  const conflictCount = statuses.filter((s) => s === 409).length;

  assert.equal(successCount, 1, '应该恰好成功一次');
  assert.equal(conflictCount, 9, '其余九次应该返回库存不足');

  console.log('响应验收通过，请继续核对数据库库存和订单增量');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
