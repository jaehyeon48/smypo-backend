const axios = require('axios');
const pool = require('../database/db');


// @ROUTE         GET stock/marketStatus
// @DESCRIPTION   Check whether the exchange is opened or closed
// @ACCESS        Private
async function checkMarketStatus(req, res) {
  const apiUrl = `https://cloud.iexapis.com/stable/stock/aapl/quote?token=${process.env.IEX_CLOUD_API_KEY}`;

  try {
    const marketStatusResponse = await axios.get(apiUrl);
    const currentTimestamp = new Date().getTime();
    const latestTimestamp = marketStatusResponse.data.lastTradeTime;

    const minutesDifference = Math.floor((currentTimestamp - latestTimestamp) / 1000 / 60);
    if (minutesDifference > 10) {
      return res.status(200).json(false); // false for closed
    }

    return res.status(200).json(true); // true for opened
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET stock/realTime/:ticker
// @DESCRIPTION   Get Realtime Price and Change of the Stock
// @ACCESS        Private
async function getRealTimePriceAndChange(req, res) {
  const ticker = req.params.ticker;
  const apiUrl = `https://cloud.iexapis.com/stable/stock/${ticker}/quote?token=${process.env.IEX_CLOUD_API_KEY}`;

  try {
    const response = await axios.get(apiUrl);

    const realTimeData = {
      price: response.data.iexRealtimePrice,
      change: response.data.change,
      changePercent: parseFloat((response.data.changePercent * 100).toFixed(2))
    }
    res.status(200).json(realTimeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

// @ROUTE         GET stock/close/:ticker
// @DESCRIPTION   Get Close Price of the Stock
// @ACCESS        Private
async function getClosePrice(req, res) {
  const ticker = req.params.ticker;
  const apiUrl = `https://cloud.iexapis.com/stable/stock/${ticker}/quote/?token=${process.env.IEX_CLOUD_API_KEY}`;

  try {
    const response = await axios.get(apiUrl);
    const realTimeData = {
      price: response.data.latestPrice,
      change: response.data.change,
      changePercent: parseFloat((response.data.changePercent * 100).toFixed(2))
    }
    res.status(200).json(realTimeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         POST stock
// @DESCRIPTION   Add New Stock
// @ACCESS        Private
async function addStock(req, res) {
  const userId = req.user.id;
  const {
    portfolioId, ticker, price, quantity, stockMemo,
    referCash, currentAvgCost, transactionType, transactionDate
  } = req.body;

  try {
    if (referCash) {
      if (transactionType === 'buy') {
        const cashToWithdraw = parseFloat((price * quantity).toFixed(2));
        const cashMemo = `Purchased ${ticker} @${price} x ${quantity} shares`
        await pool.query(`
        INSERT INTO cash (userId, portfolioId, amount, memo, transactionType, transactionDate)
        VALUES (${userId}, ${portfolioId}, ?, ?, 'purchased', ?)`,
          [cashToWithdraw, cashMemo, transactionDate]);
      }
      else if (transactionType === 'sell') {
        const cashToDeposit = parseFloat((price * quantity).toFixed(2));
        const cashMemo = `Sold ${ticker} @${price} x ${quantity} shares`;
        await pool.query(`
        INSERT INTO cash (userId, portfolioId, amount, memo, transactionType, transactionDate)
        VALUES (${userId}, ${portfolioId}, ?, ?, 'sold', ?)`,
          [cashToDeposit, cashMemo, transactionDate]);
      }
    }
    const addStockResult = await pool.query(`
      INSERT INTO stock (userId, portfolioId, ticker, price,
        quantity, memo, transactionType, transactionDate)
      VALUES (${userId}, ${portfolioId}, ?, ?, ?, ?, ?, ?)`,
      [ticker.toUpperCase(), price, quantity, stockMemo, transactionType, transactionDate]);

    if (transactionType === 'sell') {
      const insertedStockId = addStockResult[0].insertId; // newly created stock row's id
      await pool.query(`
        INSERT INTO realizedStock (stockId, avgCost)
        VALUES (${insertedStockId}, ${currentAvgCost})
      `);
    }

    return res.status(201).json({ successMsg: 'Stock successfully added.' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         PUT stock/:stockId
// @DESCRIPTION   Edit Stock's Information
// @ACCESS        Private
async function editStock(req, res) {
  const userId = req.user.id;
  const stockId = req.params.stockId;
  const { price, quantity, stockMemo, transactionType,
    transactionDate, currentAvgCost } = req.body;

  try {
    const [userIdRow] = await pool.query(`SELECT userId FROM stock WHERE stockId = ${stockId}`);

    if (userId !== userIdRow[0].userId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot delete this stock info.' });
    }

    const [previousTrTypeRow] = await pool.query(`SELECT transactionType FROM stock WHERE stockId = ${stockId}`);

    // insert new realized return info
    if (previousTrTypeRow[0].transactionType === 'buy' && transactionType === 'sell') {
      await pool.query(`
        INSERT INTO realizedStock (stockId, avgCost)
        VALUES (${stockId}, ${currentAvgCost})
      `);
    }
    // delete realized return info
    else if (previousTrTypeRow[0].transactionType === 'sell' && transactionType === 'buy') {
      await pool.query(`DELETE FROM realizedStock WHERE stockId = ${stockId}`);
    }

    await pool.query(`
    UPDATE stock
    SET price = ?, quantity = ?, memo = ?, transactionType = ?, transactionDate = ?
    WHERE stockId = ?`, [price, quantity, stockMemo, transactionType, transactionDate, stockId]);

    res.status(200).json({ successMsg: 'Successfully edited the stock info' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         DELETE stock/:stockId
// @DESCRIPTION   Delete Stock transaction
// @ACCESS        Private
async function deleteStock(req, res) {
  const stockId = req.params.stockId;
  const userId = req.user.id;
  try {
    const [userIdRow] = await pool.query(`SELECT userId FROM stock WHERE stockId = ${stockId}`);

    if (userId !== userIdRow[0].userId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot delete this stock info.' });
    }

    await pool.query(`DELETE FROM realizedStock WHERE stockId = ${stockId}`);
    await pool.query(`DELETE FROM stock WHERE stockId = ${stockId}`);

    res.status(200).json({ successMsg: 'Successfully deleted the stock' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

// @ROUTE         DELETE stock/:portfolioId/:ticker
// @DESCRIPTION   Delete stock quote (entire transaction history)
// @ACCESS        Private
async function deleteQuote(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;
  const ticker = req.params.ticker;

  try {
    const [stockIdsToDelete] = await pool.query('SELECT stockId FROM stock WHERE userId = ? AND portfolioId = ? AND ticker = ?', [userId, portfolioId, ticker]);
    // delete every realized stock data if it exists
    for (const { stockId } of stockIdsToDelete) {
      await pool.query('DELETE FROM realizedStock WHERE stockId = ?', [stockId]);
    }
    await pool.query('DELETE FROM stock WHERE userId = ? AND portfolioId = ? AND ticker = ?', [userId, portfolioId, ticker]);

    res.status(200).json({ successMsg: 'Successfully closed the position' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


module.exports = {
  checkMarketStatus,
  getRealTimePriceAndChange,
  getClosePrice,
  addStock,
  editStock,
  deleteStock,
  deleteQuote
};