// src/App.jsx
import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  const [items, setItems] = useState([]);

  const addRow = () => {
    setItems([
      ...items,
      { item: '', qty: '', days: '', unitPrice: '', exchangeRate: '' },
    ]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field !== 'item') {
      value = value === '' ? '' : Math.floor(Number(value) || 0);
    }
    newItems[index][field] = value;
    setItems(newItems);
  };

  const deleteRow = (index) => {
    if (window.confirm('Delete this row?')) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateAmount = (item) => {
    return Math.round(
      (Number(item.qty) || 0) *
        (Number(item.days) || 0) *
        (Number(item.unitPrice) || 0) *
        (Number(item.exchangeRate) || 0)
    );
  };

  const total = items.reduce((sum, item) => sum + calculateAmount(item), 0);

  const invoiceRef = useRef(null);

  const generatePDF = async () => {
    const element = invoiceRef.current;
    if (!element) {
      alert('Invoice preview မတွေ့ပါ။');
      return;
    }

    // Debug - element အရွယ်အစား စစ်ဆေးရန်
    console.log('Element dimensions before capture:', {
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
    });

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true, // debug အတွက် ဖွင့်ထားပါ
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      console.log('Canvas generated size:', canvas.width, '×', canvas.height);

      if (canvas.width <= 1 || canvas.height <= 1) {
        throw new Error(
          'html2canvas က canvas အရွယ်အစား မမှန်ပါ (width/height <= 1)။ ' +
            'Element ကို မမြင်ရအောင် ထားထားပြီး အရွယ်အစား ရှိမရှိ စစ်ပါ။'
        );
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
      pdf.save(`Payment_Request_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert(`PDF ထုတ်မရပါဘူး။\nError: ${err.message}\nConsole ကို ကြည့်ပါ။`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Zenith Payment Request 
      </h1>

      {/* Editable Table */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Purchase Items</h2>
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
              <th className="border px-4 py-3 text-left">Items / Description</th>
              <th className="border px-4 py-3 w-24">Qty</th>
              <th className="border px-4 py-3 w-24">Days</th>
              <th className="border px-4 py-3 w-32">Unit Price (USD)</th>
              <th className="border px-4 py-3 w-32">Exchange Rate</th>
              <th className="border px-4 py-3 w-40">Amount (MMK)</th>
              <th className="border px-4 py-3 w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border p-2">
                  <input
                    type="text"
                    value={item.item || ''}
                    onChange={(e) => updateItem(index, 'item', e.target.value)}
                    placeholder="Enter description..."
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
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
                    value={item.days || ''}
                    onChange={(e) => updateItem(index, 'days', e.target.value)}
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
                <td className="border p-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.exchangeRate || ''}
                    onChange={(e) => updateItem(index, 'exchangeRate', e.target.value)}
                    className="w-full py-1 text-center border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="border p-2 text-right font-medium bg-gray-50">
                  {calculateAmount(item).toLocaleString()}
                </td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => deleteRow(index)}
                    className="text-red-600 hover:text-red-800 text-xl font-bold"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500 italic">
                  No items added yet. Click "Add Row" to start.
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
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '14px',
        }}
      >
         <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Zenith Payment Request 
      </h1>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #000',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <th style={{ border: '1px solid #000', padding: '8px', width: '45%' }}>Items</th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '10%' }}>Qty</th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '8%' }}>Days</th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '12%' }}>
                Unit Price (USD)
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '12%' }}>
                Exchange Rate
              </th>
              <th style={{ border: '1px solid #000', padding: '8px', width: '13%' }}>
                Amount (MMK)
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                  {item.item || '—'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {item.qty ? `${item.qty} Person` : '—'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {item.days || '—'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {item.unitPrice || '—'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {item.exchangeRate || '—'}
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

        <div style={{ marginTop: '40px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>APPROVAL:</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
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
          * All purchases of “Goods” over local currency equiv. 3,350,000 MMK or all purchases of
          “Services” over local currency equiv. 6,270,000 MMK require three written quotations
          before a purchase can be made.
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: '12px',
            marginTop: '40px',
            color: '#4b5563',
          }}
        >
          ANNEX 10_Payment Request
        </div>
      </div>
    </div>
  );
}