const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');

const {
  checkMarketStatus,
  getRealTimePriceAndChange,
  getClosePrice,
  addStock,
  editStock,
  deleteStock,
  deleteQuote
} = require('../controllers/stockControllers');


// @ROUTE         GET stock/marketStatus
// @DESCRIPTION   Check whether the exchange is opened or closed
// @ACCESS        Private
router.get('/marketStatus', authMiddleware, checkMarketStatus);

// @ROUTE         GET stock/realTime/:ticker
// @DESCRIPTION   Get Realtime Price and Change of the Stock
// @ACCESS        Private
router.get('/realtime/:ticker', authMiddleware, getRealTimePriceAndChange);

// @ROUTE         GET stock/close/:ticker
// @DESCRIPTION   Get Close Price of the Stock
// @ACCESS        Private
router.get('/close/:ticker', authMiddleware, getClosePrice);

// @ROUTE         POST stock
// @DESCRIPTION   Add New Stock
// @ACCESS        Private
router.post('/', authMiddleware, addStock);


// @ROUTE         PUT stock/:stockId
// @DESCRIPTION   Edit Stock's Information
// @ACCESS        Private
router.put('/:stockId', authMiddleware, editStock);


// @ROUTE         DELETE stock/:stockId
// @DESCRIPTION   Delete Stock transaction
// @ACCESS        Private
router.delete('/:stockId', authMiddleware, deleteStock);

// @ROUTE         DELETE stock/:portfolioId/:ticker
// @DESCRIPTION   Delete stock quote (entire transaction history)
// @ACCESS        Private
router.delete('/:portfolioId/:ticker', authMiddleware, deleteQuote);

module.exports = router;