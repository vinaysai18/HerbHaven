const test = require("node:test");
const assert = require("node:assert/strict");
const { getStockStatus } = require("../controllers/inventoryController");
const {
  aggregateItems,
  isNonNegativeInteger,
  paymentReservationExpiry,
} = require("../services/inventoryService");

test("stock status distinguishes out, low, and in-stock quantities", () => {
  assert.equal(
    getStockStatus({ stockQuantity: 0, lowStockThreshold: 5 }),
    "Out of Stock"
  );
  assert.equal(
    getStockStatus({ stockQuantity: 5, lowStockThreshold: 5 }),
    "Low Stock"
  );
  assert.equal(
    getStockStatus({ stockQuantity: 6, lowStockThreshold: 5 }),
    "In Stock"
  );
  assert.equal(
    getStockStatus({ stockQuantity: 1, lowStockThreshold: 0 }),
    "In Stock"
  );
});

test("non-negative integer validation rejects fractions and negative values", () => {
  assert.equal(isNonNegativeInteger(0), true);
  assert.equal(isNonNegativeInteger(3), true);
  assert.equal(isNonNegativeInteger(-1), false);
  assert.equal(isNonNegativeInteger(1.5), false);
  assert.equal(isNonNegativeInteger(Number.MAX_SAFE_INTEGER + 1), false);
});

test("reservation aggregation combines duplicate product lines", () => {
  assert.deepEqual(
    aggregateItems([
      { product: "a", quantity: 2 },
      { product: "b", quantity: 1 },
      { product: "a", quantity: 3 },
    ]),
    [
      { productId: "a", quantity: 5 },
      { productId: "b", quantity: 1 },
    ]
  );
});

test("online payment reservation expires after fifteen minutes", () => {
  const startedAt = Date.now();
  const expiresAt = paymentReservationExpiry().getTime();
  assert.ok(expiresAt >= startedAt + 15 * 60 * 1000);
  assert.ok(expiresAt <= Date.now() + 15 * 60 * 1000);
});
