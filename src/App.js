import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto'; // Import Chart.js module

const App = () => {
  const [symbol, setSymbol] = useState('ethusdt'); // Default symbol
  const [interval, setInterval] = useState('1m'); // Default interval
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Open',
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
      {
        label: 'High',
        data: [],
        borderColor: 'rgba(255, 99, 132, 1)',
        fill: false,
      },
      {
        label: 'Low',
        data: [],
        borderColor: 'rgba(54, 162, 235, 1)',
        fill: false,
      },
      {
        label: 'Close',
        data: [],
        borderColor: 'rgba(255, 206, 86, 1)',
        fill: false,
      },
    ],
  });

  // WebSocket URL based on symbol and interval
  const socketUrl = (symbol, interval) => 
    `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;

  useEffect(() => {
    // Create WebSocket connection
    const socket = new WebSocket(socketUrl(symbol, interval));

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const kline = msg.k;

      // Log the incoming message for debugging
      console.log('Incoming WebSocket message:', msg);

      if (kline.x) { // Check if the kline is closed
        const candle = {
          time: new Date(kline.t).toLocaleTimeString(),
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };

        // Log the parsed candle data for debugging
        console.log('Parsed candle data:', candle);

        setChartData((prevData) => {
          const updatedLabels = [...prevData.labels, candle.time];
          const updatedOpen = [...prevData.datasets[0].data, candle.open];
          const updatedHigh = [...prevData.datasets[1].data, candle.high];
          const updatedLow = [...prevData.datasets[2].data, candle.low];
          const updatedClose = [...prevData.datasets[3].data, candle.close];

          // Update local storage
          localStorage.setItem(symbol, JSON.stringify({ open: updatedOpen, high: updatedHigh, low: updatedLow, close: updatedClose }));

          return {
            labels: updatedLabels,
            datasets: [
              { ...prevData.datasets[0], data: updatedOpen },
              { ...prevData.datasets[1], data: updatedHigh },
              { ...prevData.datasets[2], data: updatedLow },
              { ...prevData.datasets[3], data: updatedClose },
            ],
          };
        });
      }
    };

    return () => {
      socket.close(); // Clean up the socket on component unmount
    };
  }, [symbol, interval]);

  const handleSymbolChange = (e) => {
    const newSymbol = e.target.value.toLowerCase();
    setSymbol(newSymbol);
    
    // Retrieve stored data from local storage
    const storedData = JSON.parse(localStorage.getItem(newSymbol)) || { open: [], high: [], low: [], close: [] };
  
    // Check if storedData is valid
    if (storedData && storedData.open && storedData.high && storedData.low && storedData.close) {
      if (storedData.open.length) {
        setChartData((prevData) => ({
          ...prevData,
          labels: Array.from({ length: storedData.open.length }, (_, i) => `${i + 1}`), // Create dummy labels
          datasets: [
            { ...prevData.datasets[0], data: storedData.open },
            { ...prevData.datasets[1], data: storedData.high },
            { ...prevData.datasets[2], data: storedData.low },
            { ...prevData.datasets[3], data: storedData.close },
          ],
        }));
      } else {
        // Reset chart data if no stored data is available
        setChartData({
          labels: [],
          datasets: [
            { ...chartData.datasets[0], data: [] },
            { ...chartData.datasets[1], data: [] },
            { ...chartData.datasets[2], data: [] },
            { ...chartData.datasets[3], data: [] },
          ],
        });
      }
    } else {
      console.error('Stored data is not in the expected format:', storedData);
      // Reset the chart data if the structure is incorrect
      setChartData({
        labels: [],
        datasets: [
          { ...chartData.datasets[0], data: [] },
          { ...chartData.datasets[1], data: [] },
          { ...chartData.datasets[2], data: [] },
          { ...chartData.datasets[3], data: [] },
        ],
      });
    }
  };
  
  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Cryptocurrency Live Chart</h1>
      <div>
        <label>Select Cryptocurrency: </label>
        <select onChange={handleSymbolChange}>
          <option value="ethusdt">ETH/USDT</option>
          <option value="bnbusdt">BNB/USDT</option>
          <option value="dotusdt">DOT/USDT</option>
        </select>

        <label style={{ marginLeft: '20px' }}>Select Time Interval: </label>
        <select onChange={handleIntervalChange}>
          <option value="1m">1 Minute</option>
          <option value="3m">3 Minutes</option>
          <option value="5m">5 Minutes</option>
        </select>
      </div>

      <Line data={chartData} options={{ responsive: true, scales: { y: { beginAtZero: false } } }} />
    </div>
  );
};

export default App;
