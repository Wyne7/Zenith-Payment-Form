// src/App.jsx
import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  const [requestBy, setRequestBy] = useState('');
  const [paymentTo, setPaymentTo] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [holderName, setHolderName] = useState('');
  const [verifyBy, setVerifyBy] = useState('');
  const [dateOfRequest, setDateOfRequest] = useState('');
  const [dateRequired, setDateRequired] = useState('');
  const [servicesChecked, setServicesChecked] = useState(true);

  const INITIAL_CLAIMS = [
    { patientId: 'P001', service: 'ECC001', otpToken: '482910', price: 100000 },
    { patientId: 'P002', service: 'EmOC002', otpToken: '750293', price: 120000 },
    { patientId: 'P003', service: 'EmOC-ADD005', otpToken: '129485', price: 130000 },
    { patientId: 'P004', service: 'ECC004', otpToken: '398471', price: 140000 },
    { patientId: 'P005', service: 'ECC-ADD002', otpToken: '129485', price: 130000 },
    { patientId: 'P006', service: 'EmOC-ADD001', otpToken: '398471', price: 140000 },
    { patientId: 'P007', service: 'EmOC-ADD002', otpToken: '398471', price: 140000 },
    ];

  /** One purchase row per claim row (no merging by service/price). */
  const mapClaimsToPurchaseRows = (claims) =>
    claims.map((row) => ({
      patientId: row.patientId,
      manual: false,
      servicePackage: row.service,
      qty: 1,
      unitPrice: row.price,
    }));

  const [claimTable, setClaimTable] = useState(INITIAL_CLAIMS);
  const [items, setItems] = useState(() => mapClaimsToPurchaseRows(INITIAL_CLAIMS));
  const eccCount = claimTable.filter((row) =>
    String(row.service || '').toLowerCase().includes('ecc')
  ).length;
  const emocCount = claimTable.filter((row) =>
    String(row.service || '').toLowerCase().includes('emoc')
  ).length;

  useEffect(() => {
    setItems((prev) => {
      const bound = mapClaimsToPurchaseRows(claimTable);
      const manualExtras = prev.filter((row) => row.manual);
      return [...bound, ...manualExtras];
    });
  }, [claimTable]);

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        patientId: '',
        manual: true,
        servicePackage: '',
        qty: '',
        unitPrice: '',
      },
    ]);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const newItems = [...prev];
      const row = { ...newItems[index] };
      if (field === 'servicePackage' || field === 'patientId') {
        row[field] = value;
      } else {
        row[field] = value === '' ? '' : Math.floor(Number(value) || 0);
      }
      newItems[index] = row;
      return newItems;
    });
  };

  const deleteRow = (index) => {
    if (!window.confirm('Delete this row?')) return;
    const row = items[index];
    if (row.manual) {
      setItems(items.filter((_, i) => i !== index));
    } else if (row.patientId) {
      setClaimTable((prev) => prev.filter((c) => c.patientId !== row.patientId));
    }
  };

  const calculateAmount = (item) => {
    return Math.round((Number(item.qty) || 0) * (Number(item.unitPrice) || 0));
  };

  const total = items.reduce((sum, item) => sum + calculateAmount(item), 0);

  /** Formats date for PDF (and labels using this helper): dd/mm/yyyy */
  const formatDateDisplay = (iso) => {
    if (!iso) return '—';
    const parts = String(iso).trim().split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      if (y && m && d && /^\d+$/.test(y + m + d)) {
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
    const dt = new Date(iso + 'T12:00:00');
    if (Number.isNaN(dt.getTime())) return iso;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = String(dt.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  };

  const invoiceRef = useRef(null);

  const generatePDF = async () => {
    const element = invoiceRef.current;
    if (!element) {
      alert('Invoice preview မတွေ့ပါ။');
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      if (canvas.width <= 1 || canvas.height <= 1) {
        throw new Error(
          'html2canvas က canvas အရွယ်အစား မမှန်ပါ (width/height <= 1)။ ' +
            'Element ကို မမြင်ရအောင် ထားထားပြီး အရွယ်အစား ရှိမရှိ စစ်ပါ။'
        );
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableWidth = pdfWidth - margin * 2;
      const usableHeight = pdfHeight - margin * 2;

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Draw the same tall image on multiple pages with y-offset so nothing is cut.
      let heightLeft = imgHeight;
      let y = margin;

      pdf.addImage(imgData, 'JPEG', margin, y, imgWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        y = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, 'JPEG', margin, y, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      pdf.save(`Payment_Request_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert(`PDF ထုတ်မရပါဘူး။\nError: ${err.message}\nConsole ကို ကြည့်ပါ။`);
    }
  };

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-8 bg-gray-50 min-h-screen"
      style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
    >
      {/* Header */}
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 flex flex-col gap-1 items-center">
        <span>Zenith TRI</span>
        <span>Payment Request</span>
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-10 text-left font-serif ">

        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
          Request details
        </h2>

        <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-gray-800">Requested by:</span>
              <input
                type="text"
                value={requestBy}
                onChange={(e) => setRequestBy(e.target.value)}
                placeholder="Name"
                className="border border-gray-400 rounded px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-gray-800">Date of Request:</span>
              <input
                type="date"
                value={dateOfRequest}
                onChange={(e) => setDateOfRequest(e.target.value)}
                className="border border-gray-400 rounded px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-gray-800">Date Required:</span>
              <input
                type="date"
                value={dateRequired}
                onChange={(e) => setDateRequired(e.target.value)}
                className="border border-gray-400 rounded px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-gray-800">Verified by:</span>
              <input
                type="text"
                value={verifyBy}
                onChange={(e) => setVerifyBy(e.target.value)}
                placeholder="Verifier name"
                className="w-full border border-gray-400 rounded px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="space-y-4">
            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-gray-800">Payment to:</span>
              <input
                type="text"
                value={paymentTo}
                onChange={(e) => setPaymentTo(e.target.value)}
                placeholder="e.g. Vendor or payee name"
                className="border border-gray-400 rounded px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-gray-800">Bank Account No:</span>
              <input
                type="text"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="Account number"
                className="w-full border border-gray-400 rounded px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1 min-w-0">
              <span className="text-gray-800">Bank Account Hoder Name:</span>
              <input
                type="text"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Account holder name"
                className="w-full border border-gray-400 rounded px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        <div className="mt-10 max-w-5xl text-left">
          <h3 className="font-bold text-gray-900 text-[1.05rem] mb-3">Type of Purchase</h3>
          <label className="flex items-start gap-3 cursor-pointer select-none pl-6 sm:pl-7">
            <input
              type="checkbox"
              checked={servicesChecked}
              onChange={(e) => setServicesChecked(e.target.checked)}
              className="mt-1 size-4 border-gray-400 rounded text-blue-600 focus:ring-blue-500 shrink-0"
            />
            <span className="text-gray-800">Services (Emergency Child Care Services, Emergency Obstetric Care Services)</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4">Claim table</h2>
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <span className="px-3 py-1 rounded border border-gray-300 bg-gray-50">
            ECC cases: <strong>{eccCount}</strong>
          </span>
          <span className="px-3 py-1 rounded border border-gray-300 bg-gray-50">
            EmOC cases: <strong>{emocCount}</strong>
          </span>
        </div>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-3 text-center w-16">No</th>
              <th className="border px-4 py-3 text-left">Patient ID</th>
              <th className="border px-4 py-3 text-left">Services Packages</th>
              <th className="border px-4 py-3 text-center">OTP Token</th>
              <th className="border px-4 py-3 text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {claimTable.map((item, index) => (
              <tr key={`${item.patientId}-${index}`} className="hover:bg-gray-50">
                <td className="border p-3 text-center">{index + 1}</td>
                <td className="border p-3 font-medium">{item.patientId}</td>
                <td className="border p-3">{item.service}</td>
                <td className="border p-3 text-center font-mono">{item.otpToken}</td>
                <td className="border p-3 text-right">{item.price.toLocaleString()} MMK</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Purchase Items</h2>
          </div>
          <button
            onClick={addRow}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            + Add Row
          </button>
        </div>

        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-3 text-center w-16">No</th>
              <th className="border px-4 py-3 text-left w-32">Patient ID</th>
              <th className="border px-4 py-3 text-left">Service Package</th>
              <th className="border px-4 py-3 w-28">Qty</th>
              <th className="border px-4 py-3 w-40">Unit Price (MMK)</th>
              <th className="border px-4 py-3 w-40">Amount (MMK)</th>
              <th className="border px-4 py-3 w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2">
                  <input
                    type="text"
                    value={item.patientId || ''}
                    onChange={(e) => updateItem(index, 'patientId', e.target.value)}
                    readOnly={!item.manual}
                    placeholder={item.manual ? 'Patient ID' : ''}
                    className={`w-full px-2 py-1 border border-gray-300 rounded focus:border-blue-500 focus:outline-none ${!item.manual ? 'bg-gray-50 text-gray-800' : ''}`}
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="text"
                    value={item.servicePackage || ''}
                    onChange={(e) => updateItem(index, 'servicePackage', e.target.value)}
                    readOnly={!item.manual}
                    placeholder="Package code or name"
                    className={`w-full px-2 py-1 border border-gray-300 rounded focus:border-blue-500 focus:outline-none ${!item.manual ? 'bg-gray-50 text-gray-800' : ''}`}
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.qty || ''}
                    onChange={(e) => updateItem(index, 'qty', e.target.value)}
                    className="w-full py-1 text-center border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    className="w-full py-1 text-center border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="border p-2 text-right font-medium bg-gray-50">
                  {calculateAmount(item).toLocaleString()}
                </td>
                <td className="border p-2 text-center">
                  <button
                    type="button"
                    onClick={() => deleteRow(index)}
                    className="remove-row-btn text-red-600 hover:text-red-800 text-xl font-bold"
                    aria-label="Remove row"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500 italic">
                  No items yet. Click &quot;Add Row&quot; to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end text-xl font-bold">
          <div className="bg-gray-100 px-6 py-3 rounded-lg">
            Total Amount (MMK):{' '}
            <span className="text-blue-700 ml-2">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* PDF Download Button */}
      <div className="text-center mb-12">
        <button
          onClick={generatePDF}
          className="bg-green-600 hover:bg-green-700 text-white text-lg font-semibold px-10 py-4 rounded-xl shadow-lg transition-all"
        >
          Download PDF Invoice
        </button>
      </div>

      {/* Off-screen Invoice Template for PDF */}
      <div
        ref={invoiceRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          padding: '15mm',
          boxSizing: 'border-box',
          fontFamily: 'Calibri, Arial, sans-serif',
          fontSize: '14px',
          textAlign: 'left',
        }}
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 flex flex-col gap-1 items-center">
          <span>Zenith TRI</span>
          <span>Payment Request</span>
        </h1>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'Calibri, Arial, sans-serif',
            fontSize: '13px',
            lineHeight: '1.5',
            marginBottom: '22px',
            tableLayout: 'fixed',
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: '40%',
                  padding: '8px 16px 10px 0',
                  verticalAlign: 'top',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 700 }}>Requested by:</span>
                <span style={{ fontWeight: 400 }}> {requestBy || '—'}</span>
              </td>
              <td style={{ width: '18%', padding: 0 }} aria-hidden="true" />
              <td
                style={{
                  width: '42%',
                  padding: '8px 0 10px 0',
                  verticalAlign: 'top',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 700 }}>Payment to:</span>
                <span style={{ fontWeight: 400 }}> {paymentTo || '—'}</span>
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '0 16px 10px 0',
                  verticalAlign: 'top',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 700 }}>Date of Request:</span>
                <span style={{ fontWeight: 400 }}> {formatDateDisplay(dateOfRequest)}</span>
              </td>
              <td style={{ padding: 0 }} aria-hidden="true" />
              <td style={{ padding: '0 0 10px 0', verticalAlign: 'top', textAlign: 'left' }}>
                <span style={{ fontWeight: 700 }}>Bank Account No:</span>
                <span style={{ fontWeight: 400 }}> {bankAccountNo || '—'}</span>
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '0 16px 10px 0',
                  verticalAlign: 'top',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 700 }}>Date Required:</span>
                <span style={{ fontWeight: 400 }}> {formatDateDisplay(dateRequired)}</span>
              </td>
              <td style={{ padding: 0 }} aria-hidden="true" />
              <td style={{ padding: '0 0 10px 0', verticalAlign: 'top', textAlign: 'left' }}>
                <span style={{ fontWeight: 700 }}>Bank Account Holder Name:</span>
                <span style={{ fontWeight: 400 }}> {holderName || '—'}</span>
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: '0 16px 12px 0',
                  verticalAlign: 'top',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 700 }}>Verified by:</span>
                <span style={{ fontWeight: 400 }}> {verifyBy || '—'}</span>
              </td>
              <td style={{ padding: 0 }} aria-hidden="true" />
              <td style={{ padding: '0 0 12px 0' }} />
            </tr>
            <tr>
              <td
                colSpan={3}
                style={{
                  padding: '14px 0 8px 0',
                  fontWeight: 700,
                  fontSize: '14px',
                  textAlign: 'left',
                }}
              >
                Type of Purchase
              </td>
            </tr>
            <tr>
              <td
                colSpan={3}
                style={{
                  padding: '0 0 10px 22px',
                  verticalAlign: 'top',
                  textAlign: 'left',
                }}
              >
                {servicesChecked ? '☑' : '☐'} Services (Emergency Child Care Services, Emergency Obstetric Care Services)
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ padding: '6px 0 14px 0', textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '0',
                      fontSize: '14px',
                      lineHeight: '1.2',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>ECC cases:</span>
                    <span style={{ marginLeft: '6px', fontWeight: 700 }}>{eccCount}</span>
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '0',
                      fontSize: '14px',
                      lineHeight: '1.2',
                      backgroundColor: 'transparent',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>EmOC cases:</span>
                    <span style={{ marginLeft: '6px', fontWeight: 700 }}>{emocCount}</span>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #000',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '8px', width: '6%', textAlign: 'center' }}>
                No
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '12%', textAlign: 'left' }}>
                Patient ID
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '24%', textAlign: 'left' }}>
                Service Package
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '10%', textAlign: 'center' }}>
                Qty
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '20%', textAlign: 'right' }}>
                Unit Price (MMK)
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '28%', textAlign: 'right' }}>
                Amount (MMK)
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {i + 1}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                  {item.patientId || '—'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                  {item.servicePackage || '—'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {item.qty !== '' && item.qty !== undefined ? item.qty : '—'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  {item.unitPrice !== '' && item.unitPrice !== undefined
                    ? Number(item.unitPrice).toLocaleString()
                    : '—'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  {calculateAmount(item).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr style={{ fontWeight: 'bold', backgroundColor: '#f3f4f6' }}>
              <td
                colSpan={5}
                style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}
              >
                Total Amount (MMK)
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                {total.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: '10px', textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '24px' }}>APPROVAL:</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '90px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', width: '240px', height: '24px' }}></div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Program Manager / Executive Director
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', width: '180px', height: '24px' }}></div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Date</div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '40px',
            fontSize: '12px',
            borderTop: '1px solid #000',
            paddingTop: '16px',
            lineHeight: '1.4',
          }}
        >
        </div>

        
      </div>
    </div>
  );
}