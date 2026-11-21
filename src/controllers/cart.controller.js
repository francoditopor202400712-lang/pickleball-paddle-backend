import { supabase } from '../config/supabase.js';
import { ok, fail } from '../utils/http.js';

export async function getCart(req, res, next) {
  try {
    const { data, error } = await supabase.from('cart_items')
      .select('id, quantity, product:products(id,name,price,stock,image_url,is_active)')
      .eq('user_id', req.user.id);
    if (error) throw error;
    const items = (data || []).filter(x => x.product?.is_active).map(x => ({
      ...x,
      line_total: Number(x.product.price) * x.quantity
    }));
    return ok(res, { items, total: items.reduce((sum, x) => sum + x.line_total, 0) });
  } catch (error) { next(error); }
}

export async function addToCart(req, res, next) {
  try {
    const productId = req.body.product_id;
    const quantity = Number(req.body.quantity || 1);
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return fail(res, 422, 'VALIDATION_ERROR', 'A product_id and positive whole-number quantity are required.');
    }
    const { data: product, error: productError } = await supabase.from('products')
      .select('id,stock,is_active').eq('id', productId).single();
    if (productError || !product?.is_active) return fail(res, 404, 'PRODUCT_NOT_FOUND', 'Product was not found.');
    const { data: existing } = await supabase.from('cart_items').select('*')
      .eq('user_id', req.user.id).eq('product_id', productId).maybeSingle();
    const newQty = quantity + (existing?.quantity || 0);
    if (newQty > product.stock) return fail(res, 409, 'INSUFFICIENT_STOCK', 'Requested quantity exceeds available stock.');

    const operation = existing
      ? supabase.from('cart_items').update({ quantity: newQty }).eq('id', existing.id)
      : supabase.from('cart_items').insert({ user_id: req.user.id, product_id: productId, quantity });
    const { data, error } = await operation.select().single();
    if (error) throw error;
    return ok(res, data, 201);
  } catch (error) { next(error); }
}

export async function updateCartItem(req, res, next) {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return fail(res, 422, 'VALIDATION_ERROR', 'Quantity must be a positive whole number.');
    const { data: item, error: itemError } = await supabase.from('cart_items')
      .select('id,product_id').eq('id', req.params.id).eq('user_id', req.user.id).single();
    if (itemError || !item) return fail(res, 404, 'CART_ITEM_NOT_FOUND', 'Cart item was not found.');
    const { data: product } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
    if (quantity > product.stock) return fail(res, 409, 'INSUFFICIENT_STOCK', 'Requested quantity exceeds available stock.');
    const { data, error } = await supabase.from('cart_items').update({ quantity }).eq('id', item.id).select().single();
    if (error) throw error;
    return ok(res, data);
  } catch (error) { next(error); }
}

export async function removeCartItem(req, res, next) {
  try {
    const { error, count } = await supabase.from('cart_items').delete({ count: 'exact' })
      .eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    return res.status(204).end();
  } catch (error) { next(error); }
}
