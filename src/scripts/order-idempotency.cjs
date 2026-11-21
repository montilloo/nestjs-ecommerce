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

  console.log('本轮 requestId：', requestId);

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

  const responses = results.map((r) => r.value);
  const statuses = responses.map((r) => r.status);

  console.log('10 次请求的 HTTP 状态：', statuses);

  assert(
    statuses.every((status) => status === 201),
    '相同请求的重试应全部成功返回原订单',
  );

  const orderIds = responses.map((r) => r.body.data?.id);

  assert(
    orderIds.every((id) => Number.isSafeInteger(id) && id > 0),
    '响应中缺少有效的订单 ID',
  );

  assert.equal(new Set(orderIds).size, 1, '相同请求不能产生不同订单');

  const orderId = orderIds[0];
  console.log('所有请求返回同一订单 ID：', orderId);

  // 此时库存应为 0，但成功请求的重试仍应返回原订单
  const replay = await send(
    'POST',
    '/orders',
    { productId, quantity: 1, requestId },
    token,
  );

  assert.equal(replay.status, 201);
  assert.equal(replay.body.data?.id, orderId);

  // 同一标识不能更换下单参数
  const conflict = await send(
    'POST',
    '/orders',
    { productId, quantity: 2, requestId },
    token,
  );

  assert.equal(conflict.status, 409);
  assert.match(
    conflict.body.message,
    /requestId/,
    '应该因标识复用冲突而拒绝，而不是仅因库存不足',
  );

  console.log('响应验收通过，请核对数据库库存和订单增量');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
