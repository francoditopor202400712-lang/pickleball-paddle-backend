import { supabase } from '../config/supabase.js';
import { ok, fail } from '../utils/http.js';

export async function createOrder(req, res, next) {
  try {
    const { shipping_address, contact_number } = req.body;
    if (!shipping_address || !contact_number) {
      return fail(res, 422, 'VALIDATION_ERROR', 'Shipping address and contact number are required.');
    }

    const { data: cart, error: cartError } = await supabase.from('cart_items')
      .select('quantity, product:products(id,name,price,stock,is_active)')
      .eq('user_id', req.user.id);
    if (cartError) throw cartError;
    const items = (cart || []).filter(row => row.product?.is_active);
    if (!items.length) return fail(res, 422, 'EMPTY_CART', 'Your cart is empty.');

    for (const row of items) {
      if (row.quantity > row.product.stock) {
        return fail(res, 409, 'INSUFFICIENT_STOCK', `${row.product.name} does not have enough stock.`);
      }
    }

    const total = items.reduce((sum, row) => sum + Number(row.product.price) * row.quantity, 0);
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      user_id: req.user.id, shipping_address, contact_number,
      subtotal: total, total_amount: total, status: 'pending_payment'
    }).select().single();
    if (orderError) throw orderError;

    const orderItems = items.map(row => ({
      order_id: order.id, product_id: row.product.id,
      product_name: row.product.name, quantity: row.quantity,
      unit_price: Number(row.product.price)
    }));
    const { error: linesError } = await supabase.from('order_items').insert(orderItems);
    if (linesError) throw linesError;

    // This starter checks stock before order creation. For production-grade concurrent
    // checkout, move order creation and stock reservation into one PostgreSQL RPC transaction.
    await supabase.from('cart_items').delete().eq('user_id', req.user.id);

    return ok(res, { order, items: orderItems }, 201);
  } catch (error) { next(error); }
}

export async function listMyOrders(req, res, next) {
  try {
    const { data, error } = await supabase.from('orders')
      .select('*, order_items(*)').eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ok(res, data);
  } catch (error) { next(error); }
}

export async function getMyOrder(req, res, next) {
  try {
    const { data, error } = await supabase.from('orders')
      .select('*, order_items(*)').eq('id', req.params.id)
      .eq('user_id', req.user.id).maybeSingle();
    if (error) throw error;
    if (!data) return fail(res, 404, 'ORDER_NOT_FOUND', 'Order was not found.');
    return ok(res, data);
  } catch (error) { next(error); }
}
