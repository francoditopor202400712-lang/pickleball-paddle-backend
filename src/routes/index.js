import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { listProducts, getProduct, createProduct, updateProduct, deactivateProduct } from '../controllers/products.controller.js';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cart.controller.js';
import { createOrder, listMyOrders, getMyOrder } from '../controllers/orders.controller.js';
import { startMayaPayment, checkMayaPayment } from '../controllers/payments.controller.js';
import { listAllOrders, dashboard } from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, message: 'Pickleball Paddle API is running.' }));

router.post('/auth/register', register);
router.post('/auth/login', login);

router.get('/products', listProducts);
router.get('/products/:id', getProduct);

router.get('/cart', requireAuth, getCart);
router.post('/cart', requireAuth, addToCart);
router.patch('/cart/:id', requireAuth, updateCartItem);
router.delete('/cart/:id', requireAuth, removeCartItem);

router.post('/orders', requireAuth, createOrder);
router.get('/orders', requireAuth, listMyOrders);
router.get('/orders/:id', requireAuth, getMyOrder);

router.post('/payments/maya/checkout', requireAuth, startMayaPayment);
router.get('/payments/:id/status', requireAuth, checkMayaPayment);

router.get('/admin/dashboard', requireAuth, requireAdmin, dashboard);
router.get('/admin/orders', requireAuth, requireAdmin, listAllOrders);
router.post('/admin/products', requireAuth, requireAdmin, createProduct);
router.patch('/admin/products/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/admin/products/:id', requireAuth, requireAdmin, deactivateProduct);

export default router;
