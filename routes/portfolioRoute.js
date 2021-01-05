const express = require('express');
const router = express.Router();

const {
  getPortfolios,
  getPortfolioStocks,
  getSelectedPortfolio,
  getPortfolioCash,
  getStockInfoByTickerGroup,
  getRealizedStocks,
  createPortfolio,
  selectPortfolio,
  editPortfolioName,
  deletePortfolio,
} = require('../controllers/portfolioControllers');

const authMiddleware = require('../middlewares/authMiddleware');


// @ROUTE         GET portfolio
// @DESCRIPTION   Get all of the user's portfolios
// @ACCESS        Private
router.get('/', authMiddleware, getPortfolios);


// @ROUTE         GET portfolio/stocks/:portfolioId
// @DESCRIPTION   Get Portfolio's stocks
// @ACCESS        Private
router.get('/stocks/:portfolioId', authMiddleware, getPortfolioStocks);


// @ROUTE         GET portfolio/cash/:portfolioId
// @DESCRIPTION   Get Portfolio's cash
// @ACCESS        Private
router.get('/cash/:portfolioId', authMiddleware, getPortfolioCash);


// @ROUTE         GET portfolio/group/:portfolioId/:tickerName
// @DESCRIPTION   Get Information of the Ticker Group in the portfolio
// @ACCESS        Private
router.get('/group/:portfolioId/:tickerName', authMiddleware, getStockInfoByTickerGroup);


// @ROUTE         GET portfolio/select
// @DESCRIPTION   Fetch selected portfolio
// @ACCESS        Private
router.get('/select', authMiddleware, getSelectedPortfolio);


// @ROUTE         GET portfolio/realized/:portfolioId
// @DESCRIPTION   Get All Realized stock's info
// @ACCESS        Private
router.get('/realized/:portfolioId', authMiddleware, getRealizedStocks);


// @ROUTE         POST portfolio
// @DESCRIPTION   Create New Portfolio
// @ACCESS        Private
router.post('/', authMiddleware, createPortfolio);


// @ROUTE         POST portfolio/select
// @DESCRIPTION   Save selected portfolio into the DB
// @ACCESS        Private
router.post('/select', authMiddleware, selectPortfolio);


// @ROUTE         PUT portfolio/:portfolioId
// @DESCRIPTION   Edit Portfolio's Name
// @ACCESS        Private
router.put('/:portfolioId', authMiddleware, editPortfolioName);


// @ROUTE         DELETE portfolio/:portfolioId
// @DESCRIPTION   DELETE an portfolio all of its related information
// @ACCESS        Private
router.delete('/:portfolioId', authMiddleware, deletePortfolio);

module.exports = router;