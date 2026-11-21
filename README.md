# Pickleball Paddle Shop — Backend

Simple Node.js + Express REST API using Supabase (PostgreSQL + Auth) and Maya Checkout Sandbox. This repository contains the backend only. It does not include a React frontend or AI integration.

## 1. Requirements

- Node.js 20 or newer
- A Supabase project
- Maya Checkout Sandbox credentials
- Postman (for API testing)

## 2. Install

```bash
npm install
```

Copy `.env.example` to `.env`, then fill in your credentials. Do not commit `.env`.

```bash
cp .env.example .env
```

Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

## 3. Supabase setup

1. Open Supabase Dashboard → SQL Editor.
2. Run `supabase/schema.sql`.
3. In Authentication settings, choose whether email confirmation is enabled.
4. Register your first account through `POST /api/v1/auth/register`.
5. To make that account an administrator, run this SQL manually, replacing the email:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

Never allow public users to update their own `role`.

## 4. Start server

```bash
npm run dev
```

Health check:
`GET http://localhost:5000/api/v1/health`

## 5. Main endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/products` | Public |
| GET | `/api/v1/products/:id` | Public |
| GET | `/api/v1/cart` | Customer |
| POST | `/api/v1/cart` | Customer |
| PATCH | `/api/v1/cart/:id` | Customer |
| DELETE | `/api/v1/cart/:id` | Customer |
| POST | `/api/v1/orders` | Customer |
| GET | `/api/v1/orders` | Customer |
| GET | `/api/v1/orders/:id` | Customer |
| POST | `/api/v1/payments/maya/checkout` | Customer |
| GET | `/api/v1/payments/:id/status` | Customer |
| GET | `/api/v1/admin/dashboard` | Admin |
| GET | `/api/v1/admin/orders` | Admin |
| POST | `/api/v1/admin/products` | Admin |
| PATCH | `/api/v1/admin/products/:id` | Admin |
| DELETE | `/api/v1/admin/products/:id` | Admin |

For protected routes, send:
`Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN`

## 6. Example requests

Register:
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "full_name": "Sample Customer"
}
```

Login:
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

Add to cart:
```json
{
  "product_id": "PASTE_PRODUCT_UUID",
  "quantity": 1
}
```

Create order:
```json
{
  "shipping_address": "Iligan City, Philippines",
  "contact_number": "09XXXXXXXXX"
}
```

Start Maya checkout:
```json
{
  "order_id": "PASTE_ORDER_UUID"
}
```

The API returns `checkout_url`. Open it in a browser to complete the sandbox payment.

## 7. Maya sandbox

Use the sandbox host:
`https://pg-sandbox.paymaya.com`

The checkout creation endpoint is:
`POST /checkout/v1/checkouts`

The backend uses the Maya public key for creating checkout sessions. The secret key is kept server-side and is used for payment-status retrieval. Use only sandbox keys for testing.

## 8. Important limitations of this starter

- No AI feature is included, as requested for the current development phase.
- This is backend-only; the capstone brief also expects a React frontend.
- The order creation code checks stock, but does not yet reserve/decrement inventory atomically. A PostgreSQL RPC transaction should be added before claiming production-grade checkout.
- Maya status checking is included, but signed webhook verification, idempotent event processing, and automatic order status updates still need to be implemented.
- Add Swagger/OpenAPI, Postman assertions, integration tests, coupon rules, inventory logs, and full order lifecycle before final capstone submission.
- Do not use real customer payments. Keep Maya in sandbox mode.
