import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Copy, Download, FileText, AlertCircle } from 'lucide-react';
import setMappingsCSV from '../set-mappings.csv?raw';

const TCGPlayerOrderProcessor = () => {
  const [inputData, setInputData] = useState('');
  const [processedOrders, setProcessedOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [errors, setErrors] = useState([]);
  const [mode, setMode] = useState('csv');
  const [generatedUrls, setGeneratedUrls] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [setMappings, setSetMappings] = useState({});
  const [mappingsLoaded, setMappingsLoaded] = useState(false);

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  // Load set mappings from imported CSV file on component mount
  useEffect(() => {
    try {
      // Parse imported CSV
      const lines = setMappingsCSV.trim().split('\n');
      const mappings = {};

      // Skip header row (index 0) and process data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          // Split by comma, handling potential quotes
          const parts = line.split(',');
          if (parts.length >= 2) {
            const setName = parts[0].trim();
            const setCode = parts[1].trim();
            mappings[setName] = setCode;
          }
        }
      }

      setSetMappings(mappings);
      setMappingsLoaded(true);
    } catch (error) {
      console.error('Error loading set mappings:', error);
      setErrors(['Failed to load set mappings. Using empty mappings.']);
      setMappingsLoaded(true);
    }
  }, []);

  const parseDate = (dateStr) => {
    try {
      const match = dateStr.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      return match ? match[1] : dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$ ${num.toFixed(2)}`;
  };

  const extractSetCode = (productName) => {
    for (const [setName, code] of Object.entries(setMappings)) {
      if (productName.includes(setName)) {
        return code;
      }
    }
    return 'Unknown';
  };

  const parseManapoolCardDescription = (cardsText) => {
    const descriptions = [];
    const lines = cardsText.split('\n').map(l => l.trim()).filter(l => l);
    
    let i = 0;
    while (i < lines.length) {
      const cardName = lines[i];
      if (!cardName || cardName === '') {
        i++;
        continue;
      }
      
      i++;
      const setLine = lines[i];
      let setName = '';
      let collectorNum = '';
      if (setLine && setLine.includes('•')) {
        const setParts = setLine.split('•').map(p => p.trim());
        setName = setParts[0];
        if (setParts[1] && setParts[1].startsWith('#')) {
          collectorNum = setParts[1].substring(1);
        }
      }
      
      i++;
      let condition = lines[i] || 'NM';
      
      let specialAttrs = '';
      i++;
      if (lines[i] && !lines[i].includes('x') && lines[i] !== '' && isNaN(parseFloat(lines[i]))) {
        specialAttrs = lines[i];
        i++;
      }
      
      let quantity = 1;
      if (lines[i] && (lines[i].includes('x') || !isNaN(parseInt(lines[i])))) {
        quantity = parseInt(lines[i].replace('x', '')) || 1;
        i++;
      }
      
      if (lines[i] && lines[i].startsWith('$')) {
        i++;
      }
      
      const foilSuffix = specialAttrs ? ` ${specialAttrs}` : '';
      descriptions.push(
        `${quantity}x ${setName}: ${cardName} - #${collectorNum} - ${condition}${foilSuffix}`
      );
    }
    
    return descriptions.join(', ');
  };

  const parseProductDescription = (productsText) => {
    const descriptions = [];
    const lines = productsText.split('\n');

    // New TCGPlayer format spans multiple lines:
    // Line i: Magic - Set: Card - #Number - Condition[TAB]
    // Line i+1: $Price
    // Line i+2: [TAB]Quantity[TAB]$ExtPrice
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('Magic -')) {
        // Extract product info (remove trailing tabs and spaces)
        const productInfo = line.replace('Magic - ', '').replace(/\t+$/, '').trim();

        // Look ahead 2 lines to find quantity
        let quantity = 1;
        if (i + 2 < lines.length) {
          const quantityLine = lines[i + 2];
          // Quantity line format: [TAB]Quantity[TAB]$ExtPrice
          const quantityMatch = quantityLine.match(/^\s*(\d+)\s*\t/);
          if (quantityMatch) {
            quantity = parseInt(quantityMatch[1]) || 1;
          }
        }

        // New TCGPlayer format: "Set Name: Card Name - #CollectorNum - Condition"
        // Split by colon first to separate set from card details
        const colonIndex = productInfo.indexOf(':');
        if (colonIndex > 0) {
          const setName = productInfo.substring(0, colonIndex).trim();
          const cardDetails = productInfo.substring(colonIndex + 1).trim();

          // Now split the card details by ' - '
          const detailsParts = cardDetails.split(' - ');
          if (detailsParts.length >= 3) {
            const cardName = detailsParts.slice(0, -2).join(' - ');
            const collectorNum = detailsParts[detailsParts.length - 2].replace('#', '');
            const condition = detailsParts[detailsParts.length - 1];

            const foilSuffix = condition.includes('Foil') ? ' Foil' : '';
            const cleanCondition = condition.replace(' Foil', '');

            descriptions.push(
              `${quantity}x ${setName}: ${cardName} - #${collectorNum} - ${cleanCondition}${foilSuffix}`
            );
          }
        } else {
          // Fallback to old format if no colon found
          const infoParts = productInfo.split(' - ');
          if (infoParts.length >= 3) {
            const setAndCard = infoParts.slice(0, -2).join(' - ');
            const collectorNum = infoParts[infoParts.length - 2].replace('#', '');
            const condition = infoParts[infoParts.length - 1];

            const foilSuffix = condition.includes('Foil') ? ' Foil' : '';
            const cleanCondition = condition.replace(' Foil', '');

            descriptions.push(
              `${quantity}x ${setAndCard} - #${collectorNum} - ${cleanCondition}${foilSuffix}`
            );
          }
        }
      }
    }
    return descriptions.join(', ');
  };

  const processOrderNumbers = useCallback(() => {
    if (!inputData.trim()) {
      setErrors(['Please paste order numbers to process']);
      return;
    }

    setErrors([]);
    const urls = [];

    try {
      const lines = inputData.trim().split('\n');
      
      const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
      const tcgPattern = /^[A-F0-9]{8}-[A-F0-9]{6}-[A-F0-9]{5}$/i;
      
      for (const line of lines) {
        const orderNumber = line.trim();
        if (!orderNumber || orderNumber.length === 0) continue;
        
        if (orderNumber.startsWith('https://')) {
          urls.push(orderNumber);
        } else if (uuidPattern.test(orderNumber)) {
          urls.push(`https://manapool.com/seller/orders/${orderNumber}`);
        } else if (tcgPattern.test(orderNumber)) {
          urls.push(`https://sellerportal.tcgplayer.com/orders/${orderNumber}`);
        } else {
          urls.push(`https://sellerportal.tcgplayer.com/orders/${orderNumber}`);
        }
      }

      setGeneratedUrls(urls);
      setSummary({
        totalOrders: urls.length,
        totalNet: 0,
        allDirect: false,
        dateRange: ''
      });

    } catch (error) {
      setErrors([`Processing error: ${error.message}`]);
    }
  }, [inputData]);

  const processCSVData = useCallback(() => {
    if (!inputData.trim()) {
      setErrors(['Please paste data to process']);
      return;
    }

    setErrors([]);
    const orders = [];
    let totalNet = 0;
    let directCount = 0;

    try {
      const records = [];
      const lines = inputData.trim().split('\n');
      let currentRecord = '';
      
      const firstDataLine = lines[1] || '';
      const isManapool = firstDataLine.includes('manapool.com');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('https://')) {
          if (currentRecord) {
            records.push(currentRecord);
          }
          currentRecord = line;
        } else {
          currentRecord += '\n' + line;
        }
      }
      
      if (currentRecord) {
        records.push(currentRecord);
      }
      
      for (const record of records) {
        const columns = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < record.length; j++) {
          const char = record[j];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === '\t' && !inQuotes) {
            columns.push(current.replace(/^"|"$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        
        if (current) {
          columns.push(current.replace(/^"|"$/g, ''));
        }
        
        if (isManapool && columns.length >= 4) {
          const url = columns[0];
          const orderDetails = columns[1];
          const earningsData = columns[2];
          const cardDetails = columns[3];
          
          const uuidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
          const uuid = uuidMatch ? uuidMatch[1] : '';
          
          const dateMatch = orderDetails.match(/Order placed on (\d{2}\/\d{2}\/\d{4})/);
          const orderDate = dateMatch ? dateMatch[1] : '';
          
          const earningsMatch = earningsData.match(/Earnings\s+\$?([\d.]+)/);
          const earnings = earningsMatch ? parseFloat(earningsMatch[1]) : 0;
          
          const order = {
            Date: orderDate,
            Description: parseManapoolCardDescription(cardDetails),
            Type: 'Singles',
            Set: 'Unknown',
            Store: 'Manapool',
            Expense: '100%',
            Payment: 'Fidelity Magic',
            'Buy Dollars': '',
            'Sell Dollars': formatCurrency(earnings),
            'Grouping Code': '',
            Direct: '',
            Notes: uuid,
            'Raw Data': `${orderDetails}\n\n${earningsData}\n\n${cardDetails}`.replace(/\n/g, ' | ').replace(/\t/g, ' ')
          };
          
          totalNet += earnings;
          
          if (order.Description) {
            const products = order.Description.split(',').map(p => p.trim());
            const sets = new Set();
            
            for (const product of products) {
              const setCode = extractSetCode(product);
              if (setCode !== 'Unknown') {
                sets.add(setCode);
              }
            }
            
            if (sets.size > 1) {
              order.Set = 'Various';
            } else if (sets.size === 1) {
              order.Set = Array.from(sets)[0];
            }
          }
          
          orders.push(order);
          
        } else if (columns.length >= 9) {
          const productsData = columns[1];
          const transactionData = columns[2];
          const generalData = columns[3];
          const orderNumber = columns[4];
          const dateStr = columns[6];
          const fulfillment = columns[7];

          const isDirect = (fulfillment === 'Direct');
          const storeType = isDirect ? 'Direct TCGplayer' : 'TCGplayer';
          
          let directValue = '';
          if (isDirect) {
            const feeMatch = transactionData.match(/Fee Amount\s+\(\$?(\d+\.\d{2})\)/);
            const directFeeMatch = transactionData.match(/Direct Program Fee\s+\(\$?(\d+\.\d{2})\)/);
            
            let feeAmount = 0;
            if (directFeeMatch && parseFloat(directFeeMatch[1]) > 0) {
              feeAmount = parseFloat(directFeeMatch[1]);
            } else if (feeMatch) {
              feeAmount = parseFloat(feeMatch[1]);
            }
            directValue = formatCurrency(feeAmount);
          }

          const order = {
            Date: parseDate(dateStr),
            Description: parseProductDescription(productsData),
            Type: 'Singles',
            Set: 'Unknown',
            Store: storeType,
            Expense: '100%',
            Payment: 'Fidelity Magic',
            'Buy Dollars': '',
            'Sell Dollars': '',
            'Grouping Code': '',
            Direct: directValue,
            Notes: orderNumber,
            'Raw Data': `${productsData}\n\n${transactionData}\n\n${generalData}`.replace(/\n/g, ' | ').replace(/\t/g, ' ')
          };

          const netMatch = transactionData.match(/Net Amount\s+\$?(-?\d+\.\d{2})/);
          if (netMatch) {
            const netAmount = parseFloat(netMatch[1]);
            order['Sell Dollars'] = formatCurrency(Math.abs(netAmount));
            totalNet += Math.abs(netAmount);
            
            if (netAmount === 0) {
              order.Description = 'Canceled';
              order.Set = 'N/A';
            }
          }

          if (order.Description && order.Description !== 'Canceled') {
            const products = order.Description.split(',').map(p => p.trim());
            const sets = new Set();
            
            for (const product of products) {
              const setCode = extractSetCode(product);
              if (setCode !== 'Unknown') {
                sets.add(setCode);
              }
            }
            
            if (sets.size > 1) {
              order.Set = 'Various';
            } else if (sets.size === 1) {
              order.Set = Array.from(sets)[0];
            } else {
              order.Set = 'Unknown';
            }
          }

          if (isDirect) directCount++;
          orders.push(order);
        }
      }

      setProcessedOrders(orders);
      setSummary({
        totalOrders: orders.length,
        totalNet: totalNet,
        allDirect: directCount === orders.length,
        dateRange: orders.length > 0 ? orders[0].Date : ''
      });

    } catch (error) {
      setErrors([`Processing error: ${error.message}`]);
    }
  }, [inputData, setMappings]);

  const copyUrlsToClipboard = () => {
    const urlData = generatedUrls.join('\n');
    navigator.clipboard.writeText(urlData).then(() => {
      showToast('URLs copied to clipboard!');
    });
  };

  const copyToClipboard = () => {
    const headers = ['Date', 'Description', 'Type', 'Set', 'Store', 'Expense', 'Payment', 'Buy Dollars', 'Sell Dollars', 'Grouping Code', 'Direct', 'Notes', 'Raw Data'];
    const csvData = processedOrders.map(order => 
      headers.map(header => {
        let value = order[header] || '';
        
        if (header === 'Sell Dollars' || header === 'Direct') {
          value = value.replace(/^\$\s*/, '');
        }
        
        if (header === 'Raw Data') {
          value = value.replace(/\r\n/g, ' | ').replace(/\n/g, ' | ').replace(/\t/g, ' ').replace(/"/g, '""');
          value = `"${value}"`;
        }
        return value;
      }).join('\t')
    ).join('\n');

    navigator.clipboard.writeText(csvData).then(() => {
      showToast('Data copied to clipboard! Ready to paste into spreadsheet.');
    });
  };

  const downloadCSV = () => {
    const headers = ['Date', 'Description', 'Type', 'Set', 'Store', 'Expense', 'Payment', 'Buy Dollars', 'Sell Dollars', 'Grouping Code', 'Direct', 'Notes', 'Raw Data'];
    const csvData = [
      headers.join(','),
      ...processedOrders.map(order => 
        headers.map(header => `"${(order[header] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TCGPlayer_Orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Data Processor
        </h1>
        <p className="text-gray-600">
          Transform TCGPlayer and Manapool order data into spreadsheet-ready format
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-4 mb-4">
          <span className="font-semibold">Mode:</span>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="csv"
              checked={mode === 'csv'}
              onChange={(e) => {
                setMode(e.target.value);
                setInputData('');
                setProcessedOrders([]);
                setGeneratedUrls([]);
                setSummary(null);
                setErrors([]);
              }}
              className="w-4 h-4"
            />
            <span>Order Processing</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="urls"
              checked={mode === 'urls'}
              onChange={(e) => {
                setMode(e.target.value);
                setInputData('');
                setProcessedOrders([]);
                setGeneratedUrls([]);
                setSummary(null);
                setErrors([]);
              }}
              className="w-4 h-4"
            />
            <span>Order Numbers to URLs</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="config"
              checked={mode === 'config'}
              onChange={(e) => {
                setMode(e.target.value);
                setInputData('');
                setProcessedOrders([]);
                setGeneratedUrls([]);
                setSummary(null);
                setErrors([]);
              }}
              className="w-4 h-4"
            />
            <span>Set Mapping Config</span>
          </label>
        </div>
      </div>

      {mode === 'config' && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Set Name to Set Code Mappings</h2>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
            <p className="text-sm text-blue-800">
              Set mappings are loaded from <code className="bg-blue-100 px-1 rounded">set-mappings.csv</code> in the root of the <a href="https://github.com/say592/TCGOrderDataProcessor" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">repository</a>.
              To modify mappings, edit the CSV file, rebuild, and redeploy the application.
            </p>
          </div>

          <div className="bg-white p-4 rounded border">
            <h3 className="font-semibold mb-3">Loaded Mappings ({Object.keys(setMappings).length} total)</h3>
            {!mappingsLoaded ? (
              <div className="text-gray-500 text-center py-4">Loading mappings...</div>
            ) : Object.keys(setMappings).length === 0 ? (
              <div className="text-gray-500 text-center py-4">No mappings loaded</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Set Name</th>
                      <th className="p-2 text-left">Set Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(setMappings).map(([name, code]) => (
                      <tr key={name} className="border-t">
                        <td className="p-2">{name}</td>
                        <td className="p-2 font-mono">{code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {mode !== 'config' && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Input Data</h2>
          </div>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder={mode === 'csv' 
              ? "Paste your TCGPlayer or Manapool CSV data here..." 
              : "Paste order numbers here (one per line):\n\nTCGPlayer:\n8B5DCE37-050272-E8FFC\n\nManapool:\n1ccca6e6-7d39-4e03-889a-5b0aa24eee34"}
            className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm"
          />
          <button
            onClick={mode === 'csv' ? processCSVData : processOrderNumbers}
            disabled={!inputData.trim()}
            className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {mode === 'csv' ? 'Process Orders' : 'Generate URLs'}
          </button>
          
          {mode === 'csv' && (
            <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded border">
              <div>Input length: {inputData.length} characters</div>
              <div>Line count: {inputData.split('\n').length}</div>
            </div>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Processing Errors:</span>
          </div>
          <ul className="mt-2 text-red-700">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {summary && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            {mode === 'csv' ? 'Batch Summary:' : 'URL Generation Summary:'}
          </h3>
          <div className="text-blue-800 space-y-1">
            <div>Total {mode === 'csv' ? 'Orders' : 'URLs'}: {summary.totalOrders}</div>
            {mode === 'csv' && (
              <>
                <div>Date Range: {summary.dateRange}</div>
                <div>Total Net Amount: ${summary.totalNet.toFixed(2)}</div>
                <div>{summary.allDirect ? 'All Direct Fulfillment' : 'Mixed Fulfillment'}</div>
              </>
            )}
          </div>
        </div>
      )}

      {((mode === 'csv' && processedOrders.length > 0) || (mode === 'urls' && generatedUrls.length > 0)) && (
        <div className="flex gap-3 mb-6">
          {mode === 'csv' ? (
            <>
              <button
                onClick={copyToClipboard}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 font-semibold"
              >
                <Copy className="w-5 h-5" />
                Copy Data for Pasting
              </button>
              <button
                onClick={downloadCSV}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </>
          ) : (
            <button
              onClick={copyUrlsToClipboard}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 font-semibold"
            >
              <Copy className="w-5 h-5" />
              Copy URLs
            </button>
          )}
        </div>
      )}

      {mode === 'csv' && processedOrders.length > 0 && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left border-r">Date</th>
                  <th className="p-2 text-left border-r">Description</th>
                  <th className="p-2 text-left border-r">Type</th>
                  <th className="p-2 text-left border-r">Set</th>
                  <th className="p-2 text-left border-r">Store</th>
                  <th className="p-2 text-left border-r">Expense</th>
                  <th className="p-2 text-left border-r">Payment</th>
                  <th className="p-2 text-left border-r">Buy Dollars</th>
                  <th className="p-2 text-left border-r">Sell Dollars</th>
                  <th className="p-2 text-left border-r">Grouping Code</th>
                  <th className="p-2 text-left border-r">Direct</th>
                  <th className="p-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {processedOrders.map((order, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-2 border-r">{order.Date}</td>
                    <td className="p-2 border-r max-w-xs truncate" title={order.Description}>
                      {order.Description}
                    </td>
                    <td className="p-2 border-r">{order.Type}</td>
                    <td className="p-2 border-r">{order.Set}</td>
                    <td className="p-2 border-r">{order.Store}</td>
                    <td className="p-2 border-r">{order.Expense}</td>
                    <td className="p-2 border-r">{order.Payment}</td>
                    <td className="p-2 border-r">{order['Buy Dollars']}</td>
                    <td className="p-2 border-r">{order['Sell Dollars']}</td>
                    <td className="p-2 border-r">{order['Grouping Code']}</td>
                    <td className="p-2 border-r">{order.Direct}</td>
                    <td className="p-2 font-mono text-xs">{order.Notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {mode === 'urls' && generatedUrls.length > 0 && (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-3 border-b">
            <h3 className="font-semibold">Generated URLs</h3>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            {generatedUrls.map((url, index) => (
              <div key={index} className="mb-2 p-2 bg-gray-50 rounded font-mono text-sm break-all">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Usage Instructions:</h4>
        {mode === 'csv' ? (
          <ol className="space-y-1 ml-4">
            <li>1. Paste TCGPlayer or Manapool CSV data</li>
            <li>2. Click "Process Orders" to transform the data</li>
            <li>3. Review results and click "Copy Data for Pasting"</li>
            <li>4. Paste directly into your spreadsheet</li>
          </ol>
        ) : mode === 'urls' ? (
          <ol className="space-y-1 ml-4">
            <li>1. Paste order numbers or UUIDs (one per line)</li>
            <li>2. Supports TCGPlayer and Manapool formats</li>
            <li>3. Click "Generate URLs" and then "Copy URLs"</li>
          </ol>
        ) : (
          <ol className="space-y-1 ml-4">
            <li>1. View currently loaded set name to set code mappings</li>
            <li>2. Mappings are loaded from set-mappings.csv in the root of the repository</li>
            <li>3. To modify mappings, edit the CSV file, rebuild, and redeploy the app</li>
          </ol>
        )}
      </div>

      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
          <Copy className="w-5 h-5" />
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default TCGPlayerOrderProcessor;