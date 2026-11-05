const parseResponse = async (response) => {
  const body = await response.json();
  if (!response.ok || body.success === false) {
    throw new Error(body.message || 'API request failed');
  }
  return body.data;
};

const request = async (url, options) => parseResponse(await fetch(url, options));

const mapOrder = (order, index) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const amount = Number(order.final_amount || order.total || 0);

  return {
    order_id: order.orderId || order.order_code || 1200 + index,
    order_code: order.order_code || order.orderCode || `ORD-DB-${index + 1}`,
    created_at: order.created_at || order.createdAt || '',
    recipient_name: order.recipient_name || order.recipientName,
    recipient_phone: order.recipient_phone || order.recipientPhone,
    shipping_address: order.shipping_address || order.shippingAddress,
    order_notes: order.order_notes || order.orderNotes || '',
    payment_method: order.payment_method || order.paymentMethodCode || 'cod',
    payment_status: order.payment_status || order.paymentStatus || 'unpaid',
    shipping_status: order.shipping_status || order.shippingStatus || 'pending',
    customer_decision: order.customer_decision || order.customerDecision || null,
    phase: Number(order.phase ?? 0),
    total_amount: Number(order.total_amount || order.subtotal || amount),
    shipping_fee: Number(order.shipping_fee || order.shippingFee || 0),
    final_amount: amount,
    processed_by_staff_id: order.processed_by_staff_id || null,
    pick_slip_printed: false,
    is_high_value: amount >= 10000000,
    customer_credibility: '',
    has_rtc_request: Boolean(order.cancel_requested_at || order.order_notes),
    order_items: items.map((item, itemIndex) => ({
      item_id: item.id || itemIndex + 1,
      product_name: item.name || item.product_name,
      variant_name: item.variant || item.variant_name,
      sku: item.sku,
      unit_price: Number(item.unit_price || item.price || 0),
      quantity: Number(item.quantity || 1),
      subtotal: Number(
        item.subtotal ||
          Number(item.unit_price || item.price || 0) * Number(item.quantity || 1)
      ),
      thumbnail: item.image || item.image_url || ''
    }))
  };
};

const mapReturnRequest = (item) => ({
  return_id: item.rma_code || `RMA-${String(item.id).padStart(5, '0')}`,
  created_at: item.created_at
    ? new Date(item.created_at).toISOString().replace('T', ' ').slice(0, 16)
    : '',
  order_id: item.order_code || `ORD-${item.order_id}`,
  customer_id: item.customer_id ? `KH-${String(item.customer_id).padStart(4, '0')}` : '',
  customer_name: item.customer_name || item.recipient_name || 'Khách hàng',
  customer_phone: item.customer_phone || item.recipient_phone || '',
  product_name: item.product_name,
  reason: item.reason,
  refund_amount: Number(item.final_amount || 0),
  status: item.status || 'pending'
});

const mapReview = (item) => ({
  review_id: item.review_id,
  customer_name: item.customer_name,
  product_name: item.product_name,
  sku: item.sku,
  rating: Number(item.rating || 5),
  comment: item.comment,
  is_verified_buyer: Boolean(item.is_verified_buyer),
  created_at: item.created_at
    ? new Date(item.created_at).toISOString().replace('T', ' ').slice(0, 16)
    : '',
  status: item.status || 'approved',
  staff_reply: item.staff_reply || null,
  staff_replied_at: item.staff_replied_at
    ? new Date(item.staff_replied_at).toISOString().replace('T', ' ').slice(0, 16)
    : null
});

const mapTask = (item) => {
  const rawId = item.id || item.task_id || 1;
  return {
    id: rawId,
    task_id: item.task_code || `TSK-${String(rawId).padStart(3, '0')}`,
    title: item.title,
    description: item.description || '',
    priority: item.priority || 'medium',
    status: item.status || 'todo',
    due_date: item.due_date ? new Date(item.due_date).toISOString().slice(0, 10) : '',
    manager_name: item.manager_name,
    manager_code: item.manager_code
  };
};

export async function fetchStaffPortalData() {
  const token = localStorage.getItem('token');
  const profileOptions = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
  const results = await Promise.allSettled([
    request('/api/orders?limit=100'),
    request('/api/returns'),
    request('/api/reviews'),
    request('/api/staffs/tasks'),
    request('/api/staffs/profile', profileOptions)
  ]);
  const [orders, returns, reviews, tasks, profile] = results;

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`Staff Portal API request ${index + 1} failed:`, result.reason);
    }
  });

  return {
    orders: orders.status === 'fulfilled' && Array.isArray(orders.value)
      ? orders.value.map(mapOrder)
      : null,
    returnRequests: returns.status === 'fulfilled' && Array.isArray(returns.value)
      ? returns.value.map(mapReturnRequest)
      : null,
    reviews: reviews.status === 'fulfilled' && Array.isArray(reviews.value)
      ? reviews.value.map(mapReview)
      : null,
    staffTasks: tasks.status === 'fulfilled' && Array.isArray(tasks.value)
      ? tasks.value.map(mapTask)
      : null,
    staffProfile: profile.status === 'fulfilled' ? profile.value : null
  };
}

export function updateOrderStatus(orderCode, shippingStatus) {
  return request(`/api/orders/${orderCode}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shippingStatus })
  });
}

export function subscribeStaffEvents(onEvent) {
  const source = new EventSource('/api/staffs/events');
  const eventTypes = ['order.created', 'order.payment_confirmed', 'order.status_changed', 'order.customer_decision'];
  const handlers = eventTypes.map((type) => {
    const handler = (event) => {
      try {
        onEvent(type, JSON.parse(event.data));
      } catch (error) {
        console.error('Invalid staff realtime event:', error);
      }
    };
    source.addEventListener(type, handler);
    return [type, handler];
  });
  return () => {
    handlers.forEach(([type, handler]) => source.removeEventListener(type, handler));
    source.close();
  };
}

export function updateReturnStatus(returnId, status) {
  return request(`/api/returns/${returnId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

export function replyToReview(reviewId, reply) {
  return request(`/api/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply })
  });
}

export function deleteReviewReply(reviewId) {
  return request(`/api/reviews/${reviewId}/reply`, { method: 'DELETE' });
}

export function updateReviewStatus(reviewId, status) {
  return request(`/api/reviews/${reviewId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}

export function updateStaffTask(taskId, status) {
  const cleanId = String(taskId).replace(/[^0-9]/g, '') || taskId;
  return request(`/api/staffs/tasks/${cleanId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
}
