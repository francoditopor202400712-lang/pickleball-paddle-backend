import { supabase } from '../config/supabase.js';
import { ok } from '../utils/http.js';

export async function listAllOrders(req, res, next) {
  try {
    const { data, error } = await supabase.from('orders')
      .select('*, order_items(*)').order('created_at', { ascending: false });
    if (error) throw error;
    return ok(res, data);
  } catch (error) { next(error); }
}

export async function dashboard(req, res, next) {
  try {
    const [{ data: paid }, { data: pending }, { data: lowStock }] = await Promise.all([
      supabase.from('orders').select('total_amount').eq('status', 'paid'),
      supabase.from('orders').select('id').eq('status', 'pending_payment'),
      supabase.from('products').select('id,name,stock').eq('is_active', true).lte('stock', 5)
    ]);
    return ok(res, {
      paid_orders: paid?.length || 0,
      gross_sales: (paid || []).reduce((sum, row) => sum + Number(row.total_amount), 0),
      pending_orders: pending?.length || 0,
      low_stock_products: lowStock || []
    });
  } catch (error) { next(error); }
}
