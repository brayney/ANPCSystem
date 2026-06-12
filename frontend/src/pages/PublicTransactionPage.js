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
    <div ref={ref} className="p-6 bg-white text-gray-900 font-sans max-w-4xl mx-auto" style={{ width: '210mm', height: '297mm', margin: '0 auto', overflow: 'hidden' }}>
      {/* QR Code at Top Center */}
      <div className="flex justify-center mb-4">
        <QRCodeSVG value={publicUrl} size={70} />
      </div>

      {/* Header */}
      <div className="border-b-2 border-blue-900 pb-3 mb-4 text-center">
        <h1 className="text-xl font-bold text-blue-900">ANPC YARD</h1>
        <p className="text-xs text-gray-600">Internal Tracking System</p>
        <p className="text-xs text-gray-500">EQUIPMENT PULL-OUT / RENTAL FORM</p>
      </div>

      {/* Transaction Header Info */}
      <div className="flex justify-between mb-4 text-xs">
        <div>
          <p className="font-bold text-blue-900">TXN No: {txn.transactionNo}</p>
          <p className="text-gray-600">{fmt(txn.transactionDate)}</p>
          {txn.transactionTime && <p className="text-gray-600">{txn.transactionTime}</p>}
        </div>
        <div className="text-right">
          <p className="font-bold">Status: {txn.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Transaction Information</h3>
          <table className="w-full text-xs">
            <tbody>
              {[
                ['Type', txn.type],
                ['Purpose', txn.purpose],
                ['Expected Return', fmt(txn.expectedReturnDate)],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5 text-xs">{l}:</td><td className="font-medium text-xs">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Company Information</h3>
          <table className="w-full text-xs">
            <tbody>
              {[
                ['Company', txn.companyName],
                ['Address', txn.companyAddress],
                ['Contact Person', txn.contactPerson],
                ['Contact Number', txn.contactNumber],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5 text-xs">{l}:</td><td className="font-medium text-xs">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicle & Driver */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Vehicle & Driver</h3>
          <table className="w-full text-xs">
            <tbody>
              {[
                ['Driver', txn.driverName],
                ['Vehicle Type', txn.vehicleType],
                ['Plate No.', txn.vehiclePlateNo],
                ['Pull-Out Location', txn.pullOutLocation],
                ['Delivery Location', txn.deliveryLocation],
              ].map(([l, v]) => (
                <tr key={l}><td className="text-gray-500 pr-2 py-0.5 text-xs">{l}:</td><td className="font-medium text-xs">{v || '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crane */}
      <div className="mb-3">
        <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Crane Details</h3>
        <table className="w-full text-xs border border-gray-300">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="px-2 py-1 text-left">Equipment No.</th>
              <th className="px-2 py-1 text-left">Model</th>
              <th className="px-2 py-1 text-left">Capacity</th>
              <th className="px-2 py-1 text-left">Weight (KG)</th>
              <th className="px-2 py-1 text-left">Expected Return</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-300">
              <td className="px-2 py-1 font-mono font-bold text-xs">{txn.crane}</td>
              <td className="px-2 py-1 text-xs">{txn.craneModel || '—'}</td>
              <td className="px-2 py-1 text-xs">{txn.capacity || '—'}</td>
              <td className="px-2 py-1 text-xs">{txn.weightKg || '—'}</td>
              <td className="px-2 py-1 text-xs">{fmt(txn.expectedReturnDate)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Attachments */}
      {(txn.counterweights?.length > 0 || txn.boomSections?.length > 0 || txn.hooks?.length > 0) && (
        <div className="mb-2">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 border-b pb-0.5">Included Attachments</h3>
          <table className="w-full text-xs border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-0.5 text-left text-xs">Type</th>
                <th className="px-2 py-0.5 text-left text-xs">Item Name</th>
                <th className="px-2 py-0.5 text-left text-xs">Code / Serial</th>
                <th className="px-2 py-0.5 text-left text-xs">Length</th>
                <th className="px-2 py-0.5 text-left text-xs">Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {txn.counterweights?.map((cw, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-2 py-0.5 text-gray-500 text-xs">Counterweight</td>
                  <td className="px-2 py-0.5 text-xs">{cw.itemName}</td>
                  <td className="px-2 py-0.5 font-mono text-xs">{cw.serialNo}</td>
                  <td className="px-2 py-0.5 text-xs">—</td>
                  <td className="px-2 py-0.5 text-xs">{cw.weightKg || '—'}</td>
                </tr>
              ))}
              {txn.boomSections?.map((bs, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-2 py-0.5 text-gray-500 text-xs">Boom Section</td>
                  <td className="px-2 py-0.5 text-xs">{bs.itemName}</td>
                  <td className="px-2 py-0.5 font-mono text-xs">{bs.boomCode}</td>
                  <td className="px-2 py-0.5 text-xs">{bs.length || '—'}</td>
                  <td className="px-2 py-0.5 text-xs">{bs.weightKg || '—'}</td>
                </tr>
              ))}
              {txn.hooks?.map((h, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="px-2 py-0.5 text-gray-500 text-xs">Hook</td>
                  <td className="px-2 py-0.5 text-xs">{h.itemName}</td>
                  <td className="px-2 py-0.5 font-mono text-xs">{h.hookSerialNo}</td>
                  <td className="px-2 py-0.5 text-xs">—</td>
                  <td className="px-2 py-0.5 text-xs">{h.weightKg || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {txn.remarks && (
        <div className="mb-2 p-2 bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">Remarks</p>
          <p className="text-xs">{txn.remarks}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {['Released By', 'Received By', 'Authorized By'].map(label => (
          <div key={label} className="text-center">
            <div className="border-b border-gray-400 h-8 mb-1" />
            <p className="text-xs font-semibold text-gray-600 uppercase">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">Signature</p>
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
