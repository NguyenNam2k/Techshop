import React, { useCallback, useEffect, useState } from 'react';

export default function ReturnsView() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/returns');
      const data = await response.json();
      if (data.success) setRequests(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const review = async (id, status) => {
    await fetch(`/api/returns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    await loadRequests();
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100">Return / Refund</h1>
        <p className="text-sm text-slate-400">Duyệt yêu cầu trả hàng và ghi nhận hoàn tiền.</p>
      </div>
      {loading ? (
        <p className="text-slate-400">Đang tải yêu cầu...</p>
      ) : requests.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
          Chưa có yêu cầu return/refund.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-100">{request.order_code}</p>
                  <p className="text-xs text-slate-400">{request.reason}</p>
                </div>
                <span className="text-xs font-bold text-amber-300 uppercase">{request.status}</span>
              </div>
              {request.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => review(request.id, 'approved')}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    Duyệt &amp; Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => review(request.id, 'rejected')}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
