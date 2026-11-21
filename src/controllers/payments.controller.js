import { supabase } from '../config/supabase.js';
import { createMayaCheckout, getMayaPaymentStatus } from '../services/maya.service.js';
import { ok, fail } from '../utils/http.js';

export async function startMayaPayment(req, res, next) {
  try {
    const { order_id } = req.body;
    if (!order_id) return fail(res, 422, 'VALIDATION_ERROR', 'order_id is required.');

    const { data: order, error } = await supabase.from('orders')
      .select('*, order_items(*)').eq('id', order_id)
      .eq('user_id', req.user.id).single();
    if (error || !order) return fail(res, 404, 'ORDER_NOT_FOUND', 'Order was not found.');
    if (order.status !== 'pending_payment') return fail(res, 409, 'ORDER_NOT_PAYABLE', 'This order is not awaiting payment.');

    const { data: profile } = await supabase.from('profiles').select('full_name')
      .eq('id', req.user.id).maybeSingle();
    const [first_name = 'Customer', ...rest] = (profile?.full_name || '').split(' ');
    const buyer = { first_name, last_name: rest.join(' '), email: req.user.email };

    const checkout = await createMayaCheckout({ order, items: order.order_items, buyer });
    const { data: payment, error: paymentError } = await supabase.from('payments').insert({
      order_id: order.id, provider: 'maya', provider_checkout_id: checkout.checkout_id,
      request_reference_number: checkout.request_reference_number,
      status: 'pending', checkout_url: checkout.redirect_url
    }).select().single();
    if (paymentError) throw paymentError;

    return ok(res, { payment, checkout_url: checkout.redirect_url }, 201);
  } catch (error) { next(error); }
}

export async function checkMayaPayment(req, res, next) {
  try {
    const { data: payment, error } = await supabase.from('payments')
      .select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!payment) return fail(res, 404, 'PAYMENT_NOT_FOUND', 'Payment was not found.');

    const { data: order } = await supabase.from('orders').select('user_id')
      .eq('id', payment.order_id).single();
    if (order?.user_id !== req.user.id) return fail(res, 404, 'PAYMENT_NOT_FOUND', 'Payment was not found.');

    const status = await getMayaPaymentStatus(payment.provider_checkout_id);
    return ok(res, { payment, maya_status: status });
  } catch (error) { next(error); }
}
