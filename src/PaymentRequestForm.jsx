// PaymentRequestForm.jsx
import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PaymentRequestForm() {
  const [form, setForm] = useState({
    projectCode: 'UNFPA',
    requestBy: 'Ei Ei Phyo',
    dateRequest: '8 May 2025',
    purchaseBy: 'Direct payment to Vendor',
    dateRequired: '9 May 2025',
    supervisor: 'Dr. Nyi Zin Latt',
    amountMMK: 10416000,
    amountWords: 'Ten million, four hundred sixteen thousand MMK Only',
    type: {
      equipment: false,
      supplies: false,
      services: true,
    },
    specifyEquipment: '',
    specifySupplies: '',
    specifyServices:
      'Venue charges, Two coffee breaks & One Lunch for participants to conduct Training on Basic Supply Chain and Inventory Management of Health Commodities on 06-07 May 2025',
  });

  const [items, setItems] = useState([
    {
      desc: 'Venue charges and Refreshment for participants (06 May 2025)',
      qty: 47,
      days: 1,
      unitUSD: 32,
      exchange: 3500,
    },
    {
      desc: 'Venue charges and Refreshment for participants (07 May 2025)',
      qty: 46,
      days: 1,
      unitUSD: 32,
      exchange: 3500,
    },
  ]);

  const invoiceRef = useRef(null);

  const calcAmount = (item) =>
    Math.round((item.qty || 0) * (item.days || 0) * (item.unitUSD || 0) * (item.exchange || 0));

  const total = items.reduce((sum, it) => sum + calcAmount(it), 0);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateType = (key, checked) =>
    setForm((prev) => ({
      ...prev,
      type: { ...prev.type, [key]: checked },
    }));

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const v = field === 'desc' ? value : value === '' ? '' : Math.floor(Number(value));
    newItems[index][field] = v;
    setItems(newItems);
  };

  const addRow = () =>
    setItems([...items, { desc: '', qty: '', days: '', unitUSD: '', exchange: '' }]);

  const removeRow = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2.5, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`Zenith_TRI_Payment_Request_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Payment Request Form</h1>

      {/* Form Inputs - လိုအပ်ရင် ဒီထဲမှာ ထပ်ထည့်နိုင်တယ် */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 bg-gray-50 p-6 rounded-lg shadow">
        {/* ဥပမာ inputs တချို့ */}
        <div>
          <label className="block text-sm">Project Name / Account Code</label>
          <input
            value={form.projectCode}
            onChange={(e) => updateForm('projectCode', e.target.value)}
            className="w-full border p-2 rounded mt-1"
          />
        </div>
        <div>
          <label className="block text-sm">Request by</label>
          <input
            value={form.requestBy}
            onChange={(e) => updateForm('requestBy', e.target.value)}
            className="w-full border p-2 rounded mt-1"
          />
        </div>
        {/* ကျန်တဲ့ field တွေ လိုအပ်ရင် ထပ်ထည့်ပါ */}
      </div>

      <div className="mb-8">
        <button
          onClick={addRow}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 mb-4"
        >
          + Add Item Row
        </button>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-3">Description</th>
              <th className="border p-3 w-24">Qty</th>
              <th className="border p-3 w-20">Days</th>
              <th className="border p-3 w-28">Unit (USD)</th>
              <th className="border p-3 w-28">Exchange Rate</th>
              <th className="border p-3 w-36">Amount (MMK)</th>
              <th className="border p-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">
                  <input
                    value={item.desc}
                    onChange={(e) => updateItem(i, 'desc', e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.qty}
                    onChange={(e) => updateItem(i, 'qty', e.target.value)}
                    className="w-full text-center p-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.days}
                    onChange={(e) => updateItem(i, 'days', e.target.value)}
                    className="w-full text-center p-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.unitUSD}
                    onChange={(e) => updateItem(i, 'unitUSD', e.target.value)}
                    className="w-full text-center p-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.exchange}
                    onChange={(e) => updateItem(i, 'exchange', e.target.value)}
                    className="w-full text-center p-1 border rounded"
                  />
                </td>
                <td className="border p-2 text-right font-medium">
                  {calcAmount(item).toLocaleString()}
                </td>
                <td className="border p-2 text-center">
                  <button onClick={() => removeRow(i)} className="text-red-600 text-xl">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PDF Preview & Download Button */}
      <div className="flex justify-center mb-12">
        <button
          onClick={generatePDF}
          className="bg-green-600 hover:bg-green-700 text-white text-lg font-semibold px-10 py-4 rounded-xl shadow-lg"
        >
          Generate & Download PDF
        </button>
      </div>

      {/* ────────────────────────────────────────────────
          အောက်က အပိုင်းက PDF အတွက် အဓိက render ဖြစ်တယ်
      ──────────────────────────────────────────────── */}
      <div ref={invoiceRef} className="bg-white p-8 border border-gray-400 mx-auto max-w-[210mm] shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Zenith TRI</h1>
          <h2 className="text-xl font-semibold mt-1">Payment Request</h2>
        </div>

        <div className="border-b pb-4 mb-6">
          <div className="font-semibold">Project Name/Account Code: {form.projectCode}</div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <strong>Request by:</strong> {form.requestBy}
            <br />
            <strong>Date of Request:</strong> {form.dateRequest}
          </div>
          <div>
            <strong>Purchase by:</strong> {form.purchaseBy}
            <br />
            <strong>Date Required:</strong> {form.dateRequired}
          </div>
        </div>

        <div className="mb-6 text-sm">
          <strong>Requestor's Supervisor:</strong> {form.supervisor}
        </div>

        <div className="bg-yellow-100 p-4 rounded mb-6 text-center font-semibold">
          Amount of Purchase: {total.toLocaleString()} MMK
          <br />
          ({form.amountWords})
        </div>

        <div className="mb-8">
          <strong>Type of Purchase (Select any applicable):</strong>
          <div className="mt-2 space-y-2">
            <label>
              <input
                type="checkbox"
                checked={form.type.equipment}
                onChange={(e) => updateType('equipment', e.target.checked)}
              />{' '}
              Equipment (Please specify: <input type="text" className="border-b w-64" />)
            </label>
            <br />
            <label>
              <input
                type="checkbox"
                checked={form.type.supplies}
                onChange={(e) => updateType('supplies', e.target.checked)}
              />{' '}
              Supplies (Please specify: <input type="text" className="border-b w-64" />)
            </label>
            <br />
            <label>
              <input
                type="checkbox"
                checked={form.type.services}
                onChange={(e) => updateType('services', e.target.checked)}
              />{' '}
              Services (Please specify:{' '}
              <textarea
                value={form.specifyServices}
                onChange={(e) => updateForm('specifyServices', e.target.value)}
                className="border w-full h-20 p-1 mt-1"
              />)
            </label>
          </div>
        </div>

        <div className="mb-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Items</th>
                <th className="border p-2 w-20">Qty</th>
                <th className="border p-2 w-16">Days</th>
                <th className="border p-2 w-24">Unit Price (USD)</th>
                <th className="border p-2 w-24">Exchange Rate</th>
                <th className="border p-2 w-32">Amount (MMK)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td className="border p-2">{it.desc || '—'}</td>
                  <td className="border p-2 text-center">
                    {it.qty ? `${it.qty} Person` : '—'}
                  </td>
                  <td className="border p-2 text-center">{it.days || '—'}</td>
                  <td className="border p-2 text-center">{it.unitUSD || '—'}</td>
                  <td className="border p-2 text-center">{it.exchange || '—'}</td>
                  <td className="border p-2 text-right">{calcAmount(it).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-100">
                <td colSpan={5} className="border p-2 text-right">
                  Total Amount (MMK)
                </td>
                <td className="border p-2 text-right">{total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-10 mb-6">
          <strong>APPROVAL:</strong>
          <div className="flex justify-between mt-6">
            <div className="text-center">
              <div className="border-b w-64 h-6"></div>
              <div className="mt-1">Program Manager / Executive Director</div>
            </div>
            <div className="text-center">
              <div className="border-b w-48 h-6"></div>
              <div className="mt-1">Date</div>
            </div>
          </div>
        </div>

        <div className="text-xs border-t pt-4 mt-6">
          * All purchases of “Goods” over local currency equiv. 3,350,000 MMK or all purchases of
          “Services” over local currency equiv. 6,270,000 MMK require three written quotations
          before a purchase can be made.
        </div>

        <div className="text-center text-xs mt-8 text-gray-600">
          ANNEX 10 _ Payment Request
        </div>
      </div>
    </div>
  );
}