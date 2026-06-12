import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { StatusBadge, Spinner } from '../components/common';
import { QRCodeSVG } from 'qrcode.react';
import api from '../utils/api';
import { format } from 'date-fns';

const PrintView = React.forwardRef(({ txn }, ref) => {
  if (!txn) return null;
  const fmt = (d) => d ? format(new Date(d), 'MMMM d, yyyy') : '—';
  const publicUrl = `${window.location.origin}/public/transactions/${txn._id}`;

  return (
    <div ref={ref} className="p-8 bg-white text-gray-900 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">ANPC YARD</h1>
          <p className="text-sm text-gray-600">Internal Tracking System</p>
          <p className="text-xs text-gray-500 mt-1">EQUIPMENT PULL-OUT / RENTAL FORM</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-blue-900">{txn.transactionNo}</p>
          <p className="text-sm text-gray-600">{fmt(txn.transactionDate)}</p>
          {txn.transactionTime && <p className="text-sm text-gray-600">{txn.transactionTime}</p>}
          <QRCodeSVG value={publicUrl} size={80} className="mt-2 ml-auto" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Transaction Information</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Transaction No.', txn.transactionNo],
                ['Status', txn.status],
                ['Type', txn.type],
                ['Purpose', txn.purpose],
                ['Expected Return', fmt(txn.expectedReturnDate)],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5">{l}:</td><td className="font-medium">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Company Information</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Company', txn.companyName],
                ['Address', txn.companyAddress],
                ['Contact Person', txn.contactPerson],
                ['Contact Number', txn.contactNumber],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5">{l}:</td><td className="font-medium">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle & Driver */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Company Information</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Company', txn.companyName],
                ['Address', txn.companyAddress],
                ['Contact Person', txn.contactPerson],
                ['Contact Number', txn.contactNumber],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5">{l}:</td><td className="font-medium">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Vehicle & Driver</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Driver', txn.driverName],
                ['Vehicle Type', txn.vehicleType],
                ['Plate No.', txn.vehiclePlateNo],
                ['Pull-Out Location', txn.pullOutLocation],
                ['Delivery Location', txn.deliveryLocation],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5">{l}:</td><td className="font-medium">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crane */}
      <div className="mb-6">
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Crane Details</h3>
        <table className="w-full text-sm border border-gray-300">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left">Equipment No.</th>
              <th className="px-3 py-2 text-left">Model</th>
              <th className="px-3 py-2 text-left">Purpose</th>
              <th className="px-3 py-2 text-left">Expected Return</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-300">
              <td className="px-3 py-2 font-mono font-bold">{txn.crane}</td>
              <td className="px-3 py-2">{txn.craneModel || '—'}</td>
              <td className="px-3 py-2">{txn.purpose || '—'}</td>
              <td className="px-3 py-2">{fmt(txn.expectedReturnDate)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Attachments */}
      {(txn.counterweights?.length > 0 || txn.boomSections?.length > 0 || txn.hooks?.length > 0) && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-2 border-b pb-1">Included Attachments</h3>
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Item Name</th>
                <th className="px-3 py-2 text-left">Code / Serial</th>
                <th className="px-3 py-2 text-left">Length</th>
                <th className="px-3 py-2 text-left">Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {txn.counterweights?.map((cw, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-3 py-1.5 text-gray-500">Counterweight</td>
                  <td className="px-3 py-1.5">{cw.itemName}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{cw.serialNo}</td>
                  <td className="px-3 py-1.5">—</td>
                  <td className="px-3 py-1.5">{cw.weightKg || '—'}</td>
                </tr>
              ))}
              {txn.boomSections?.map((bs, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-3 py-1.5 text-gray-500">Boom Section</td>
                  <td className="px-3 py-1.5">{bs.itemName}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{bs.boomCode}</td>
                  <td className="px-3 py-1.5">{bs.length || '—'}</td>
                  <td className="px-3 py-1.5">{bs.weightKg || '—'}</td>
                </tr>
              ))}
              {txn.hooks?.map((h, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-3 py-1.5 text-gray-500">Hook</td>
                  <td className="px-3 py-1.5">{h.itemName}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{h.hookSerialNo}</td>
                  <td className="px-3 py-1.5">—</td>
                  <td className="px-3 py-1.5">{h.weightKg || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {txn.remarks && (
        <div className="mb-6 p-3 bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Remarks</p>
          <p className="text-sm">{txn.remarks}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-10 grid grid-cols-3 gap-8">
        {['Released By', 'Received By', 'Authorized By'].map(label => (
          <div key={label} className="text-center">
            <div className="border-b-2 border-gray-400 h-12 mb-2" />
            <p className="text-xs font-semibold text-gray-600 uppercase">{label}</p>
            <p className="text-xs text-gray-400 mt-1">Signature over printed name</p>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function PublicTransactionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    // Fetch from public endpoint
    api.get(`/transactions/public/${id}`)
      .then(r => setTxn(r.data.data))
      .catch(() => {
        toast.error('Transaction not found');
        setTimeout(() => navigate('/'), 2000);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Spinner size="lg" />
    </div>
  );
  
  if (!txn) return null;

  const fmt = (d) => d ? format(new Date(d), 'MMMM d, yyyy') : '—';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 no-print">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2">
              <ArrowLeftIcon className="w-4 h-4" /> Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-mono">{txn.transactionNo}</h1>
              <p className="text-sm text-gray-500">{txn.companyName}</p>
            </div>
            <StatusBadge status={txn.status} />
          </div>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
            <PrinterIcon className="w-4 h-4" /> Print Transaction
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-8">
        {/* Print View */}
        <div className="bg-white p-4">
          <PrintView ref={printRef} txn={txn} />
        </div>

        {/* Screen View Summary */}
        <div className="mt-8 no-print bg-white rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Transaction Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Transaction Number</p>
              <p className="font-mono font-bold text-lg text-blue-600">{txn.transactionNo}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium"><StatusBadge status={txn.status} /></p>
            </div>
            <div>
              <p className="text-gray-500">Company</p>
              <p className="font-medium">{txn.companyName}</p>
            </div>
            <div>
              <p className="text-gray-500">Crane</p>
              <p className="font-mono font-bold text-blue-600">{txn.crane}</p>
            </div>
            <div>
              <p className="text-gray-500">Transaction Date</p>
              <p className="font-medium">{fmt(txn.transactionDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Expected Return</p>
              <p className="font-medium">{fmt(txn.expectedReturnDate)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
