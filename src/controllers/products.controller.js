import { supabase } from '../config/supabase.js';
import { ok, fail } from '../utils/http.js';

export async function listProducts(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '12', 10)));
    const from = (page - 1) * limit;
    let query = supabase.from('products').select('*', { count: 'exact' }).eq('is_active', true);

    if (req.query.search) query = query.ilike('name', `%${req.query.search}%`);
    if (req.query.min_price) query = query.gte('price', Number(req.query.min_price));
    if (req.query.max_price) query = query.lte('price', Number(req.query.max_price));
    if (req.query.sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (req.query.sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw error;
    return ok(res, data, 200, { page, limit, total: count || 0 });
  } catch (error) { next(error); }
}

export async function getProduct(req, res, next) {
  try {
    const { data, error } = await supabase.from('products')
      .select('*').eq('id', req.params.id).eq('is_active', true).maybeSingle();
    if (error) throw error;
    if (!data) return fail(res, 404, 'PRODUCT_NOT_FOUND', 'Product was not found.');
    return ok(res, data);
  } catch (error) { next(error); }
}

export async function createProduct(req, res, next) {
  try {
    const { name, description, price, stock, image_url } = req.body;
    if (!name || !Number.isFinite(Number(price)) || Number(price) < 0 ||
        !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      return fail(res, 422, 'VALIDATION_ERROR', 'Name, non-negative price, and non-negative whole-number stock are required.');
    }
    const { data, error } = await supabase.from('products').insert({
      name, description: description || '', price: Number(price),
      stock: Number(stock), image_url: image_url || null
    }).select().single();
    if (error) throw error;
    return ok(res, data, 201);
  } catch (error) { next(error); }
}

export async function updateProduct(req, res, next) {
  try {
    const allowed = ['name', 'description', 'price', 'stock', 'image_url', 'is_active'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (!Object.keys(update).length) return fail(res, 422, 'VALIDATION_ERROR', 'No valid product fields supplied.');
    if (update.price !== undefined && Number(update.price) < 0) return fail(res, 422, 'VALIDATION_ERROR', 'Price cannot be negative.');
    if (update.stock !== undefined && (!Number.isInteger(Number(update.stock)) || Number(update.stock) < 0)) return fail(res, 422, 'VALIDATION_ERROR', 'Stock must be a non-negative whole number.');
    if (update.price !== undefined) update.price = Number(update.price);
    if (update.stock !== undefined) update.stock = Number(update.stock);

    const { data, error } = await supabase.from('products').update(update).eq('id', req.params.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return fail(res, 404, 'PRODUCT_NOT_FOUND', 'Product was not found.');
    return ok(res, data);
  } catch (error) { next(error); }
}

export async function deactivateProduct(req, res, next) {
  try {
    const { data, error } = await supabase.from('products')
      .update({ is_active: false }).eq('id', req.params.id).select().maybeSingle();
    if (error) throw error;
    if (!data) return fail(res, 404, 'PRODUCT_NOT_FOUND', 'Product was not found.');
    return ok(res, data);
  } catch (error) { next(error); }
}
