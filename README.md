# HerbHaven

HerbHaven is a React/Vite storefront backed by an Express, Mongoose, and MongoDB API.

## Inventory behavior

- Product documents now include `stockQuantity` (defaults to `0`), `lowStockThreshold` (defaults to `5`), `sku` (generated for new products when omitted), and `category` (defaults to `Other`).
- Existing products are treated as having zero available stock until an administrator records their opening balance. This is deliberately fail-closed; no product or order data is deleted or rewritten during deployment. Use **Admin → Inventory → Adjust stock** to set the verified opening count.
- At order creation, stock is atomically decremented with a MongoDB predicate requiring enough stock. Order lines for the same product are combined. This is the reservation that prevents concurrent checkouts from overselling.
- A successful Razorpay verification or signed `payment.captured` webhook marks the existing reservation committed; it does not deduct again. COD reservations remain deducted and are marked committed when an administrator marks the order delivered.
- Cancellation and a verified Razorpay `payment.failed` webhook release only a reservation still marked `Reserved`. Unpaid Razorpay reservations also expire after 15 minutes via an idempotent server sweep, covering checkout dismissal or a missing failure webhook. Retrying a payment first re-reserves stock; a later captured payment must reacquire stock before it can be committed. Order-state compare-and-set updates make duplicate payment verification, webhook delivery, and cancellation requests idempotent.
- An approved return is not restocked automatically. An administrator must confirm physical receipt from **Admin → View Returns**; the order's receipt timestamp prevents repeat restocking.
- Stock movements record quantity delta, previous/resulting quantity, reason, product, related order (when applicable), administrator/user, and timestamp. Movement records have no edit/delete API.

## Inventory API

All routes are under `/api`. Inventory and product writes require a valid bearer JWT with the `admin` role; ordinary product listing and order routes retain their existing authentication rules.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/products/inventory?search=&category=&status=&sort=` | Inventory products, summary cards, and category list. `sort` accepts `name`, `stock-asc`, or `stock-desc`; status accepts `In Stock`, `Low Stock`, or `Out of Stock`. |
| `POST` | `/products/inventory/:id/adjust` | Manual stock change; JSON body `{ "quantityChange": 5, "reason": "Restock" }`. Non-zero signed integer and a reason are required. |
| `PUT` | `/products/inventory/:id/threshold` | Set the threshold; JSON body `{ "lowStockThreshold": 5 }`. |
| `GET` | `/products/inventory/:id/history` | Read the latest 100 immutable inventory movements. |
| `POST` | `/products` | Existing product creation endpoint; now accepts optional `sku`, `category`, `stockQuantity`, and `lowStockThreshold` along with its existing multipart image and product fields. |

Automatic stock handling also uses the existing `POST /orders`, `POST /payments/create-order`, `POST /payments/verify`, `POST /payments/retry/:orderId`, order cancellation/status routes, and `/payments/webhook`; their existing authorization and Razorpay signature checks are retained.

## Local development and tests

Use Node.js 20 or later and a MongoDB deployment. In the backend directory, provide the existing server environment variables through `BACKEND/.env` or your shell; do not commit that file:

```text
MONGO_URI
JWT_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
PORT (optional; defaults to 5000)
```

In PowerShell, start the backend:

```powershell
cd BACKEND
npm.cmd install
npm.cmd test
npm.cmd run dev
```

In a second PowerShell terminal, point Vite at that API and start the frontend:

```powershell
cd FRONTEND
npm.cmd install
$env:VITE_API_URL = "http://localhost:5000"
npm.cmd run dev
```

For the deployed frontend, `VITE_API_URL` may be left unset to use `https://herbhaven.onrender.com`, or set as a Render frontend build environment variable to the backend origin. Do not include `/api` in this variable.

Frontend checks:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Deployment notes and limits

1. Keep the existing Render backend secrets configured. Set the Razorpay webhook secret and subscribe the Razorpay webhook to `payment.failed`, `payment.captured`, `refund.created`, `refund.processed`, and `refund.failed`; webhook requests continue to be verified against the raw body.
2. Deploy the backend before the frontend. On first rollout, enter audited opening stock quantities for existing catalog items using the admin inventory adjustment flow.
3. MongoDB single-product stock changes are atomic and guard against negative stock. The implementation uses a sequence of atomic stock updates with compensating rollback across multiple products; MongoDB multi-document transactions are not required for basic operation. A process/database failure between multi-product updates may require reviewing the immutable movements and reconciling affected orders.
4. Return receipt restocks all items on an approved order; partial-item returns are not represented in the current order model. Refund processing remains governed by the existing Razorpay refund workflow and does not independently add stock.
5. The automated test suite covers stock-status boundaries, quantity validation, and duplicate-line aggregation. Full order/payment concurrency and Razorpay integration tests need a MongoDB test deployment and Razorpay test credentials/webhook delivery and have not been run here.

## Inventory integration test cases

Run these against a disposable MongoDB database and Razorpay test account; never use production customer/payment data for testing:

1. As an admin, create a product with stock `6` and threshold `5`; verify `In Stock`. Change threshold to `6`; verify `Low Stock`.
2. Adjust stock by `-6` with a reason; verify `Out of Stock`. Try `-1` again, a decimal, a missing reason, and threshold `-1`; each must return a validation error without changing stock.
3. Call each `/products/inventory` endpoint with no token, a customer token, and an admin token; expect `401`, `403`, and success respectively.
4. Add an in-stock product to a customer cart, increase to the available quantity, and verify the next increment is disabled/rejected. Attempt to submit a cart that is over available stock directly to both order creation routes; expect `409`.
5. Start two orders concurrently for the final available unit. Exactly one can reserve it; inventory must never become negative.
6. For Razorpay, verify a captured payment and then repeat verification and deliver the signed `payment.captured` webhook more than once. The order is paid and stock remains deducted exactly once.
7. Deliver signed `payment.failed` repeatedly; one active reservation is restored once. Let an unpaid reservation expire and verify its release; retry payment and verify stock is reserved again. Cancellation releases it once, and a repeated cancellation cannot add stock again.
8. Approve a return and verify no stock change occurs until an administrator confirms physical receipt. Repeat the receipt call; only one restock should be recorded.
