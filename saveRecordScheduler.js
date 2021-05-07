const axios = require('axios');
const pool = require('./database/db');
require('dotenv').config();

// main function
async function saveRecordScheduler() {
  console.log('initiate saving records');

  if (await checkMarketWasOpened()) {
    const portfolios = await getAllPortfolios();
    let usersValueData = []; // organized stocks by ticker

    for (const portfolioId of portfolios) {
      const userId = await getUserIdByPortfolioId(portfolioId);

      const stocks = await getStockData(userId, portfolioId);
      const organizedStocks = await sortStocks(stocks);
      // calculate total value of stocks in each portfolio
      const portfolioValueData = await calculateValueOfStock(organizedStocks);
      const totalCash = await getTotalCash(userId, portfolioId);
      usersValueData.push({
        userId,
        portfolioId,
        dailyReturn: portfolioValueData.dailyReturn,
        totalValue: parseFloat((portfolioValueData.overallReturn + totalCash).toFixed(2))
      });

    }

    // save data into DB
    for (const valueDataItem of usersValueData) {
      await saveRecordIntoDB(valueDataItem);
    }

    console.log('saved record successfully');
  }
  else {
    console.log('Market was not opened today.');
  }
}

// Check if the market 'was' opened for the day by comparing timestamp between current timestamp
// and IEX api's timestamp and if the difference between the two is less than 35 minutes,
// return true. The reason of 35 minutes is the schedule is running at 8:30PM UTC (which is 30 minutes
// after the market's official closing time) plus 10 minutes of margin in case of a latency.
async function checkMarketWasOpened() {
  const apiUrl = `https://cloud.iexapis.com/stable/stock/aapl/quote?token=${process.env.IEX_CLOUD_API_KEY}`;

  try {
    const marketStatusResponse = await axios.get(apiUrl);
    const currentTimestamp = new Date().getTime();
    const latestTimestamp = marketStatusResponse.data.lastTradeTime;

    const minutesDifference = Math.floor((currentTimestamp - latestTimestamp) / 1000 / 60);
    if (minutesDifference < 10000) {
      return true;
    }
    else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function getUserIdByPortfolioId(portfolioId) {
  try {
    const [userListRows] = await pool.query(`SELECT userId FROM portfolio WHERE portfolioId = ${portfolioId}`);

    return userListRows[0].userId;
  } catch (error) {
    console.error(error);
  }
}

async function getAllPortfolios() {
  const portfolioIds = [];
  try {
    const [portfoliosRow] = await pool.query('SELECT portfolioId FROM portfolio ORDER BY portfolioId asc');

    portfoliosRow.forEach((portfolio) => {
      portfolioIds.push(portfolio.portfolioId);
    });

    return portfolioIds;
  } catch (error) {
    console.error(error);
  }
}

async function getStockData(userId, portfolioId) {
  try {
    const [stocksRow] = await pool.query(`
      SELECT stock.ticker, stock.price, stock.quantity,
      stock.transactionType, DATE_ADD(stock.transactionDate, INTERVAL 9 HOUR) AS transactionDate
      FROM user
        INNER JOIN portfolio
          ON user.userId = ? AND portfolio.portfolioId = ? AND user.userId = portfolio.userId 
        INNER JOIN stock
          ON user.userId = stock.userId AND portfolio.portfolioId = stock.portfolioId
        ORDER BY stock.ticker, stock.transactionType DESC, stock.transactionDate
    `, [userId, portfolioId]);
    return stocksRow;
  } catch (error) {
    console.error(error);
  }
}

async function sortStocks(stocksList) {
  let organizedShares = [];
  const groupedStocks = groupStocksByTickerName(stocksList);
  for (let [ticker, value] of Object.entries(groupedStocks)) {
    organizedShares.push(await organizeGroupedStocks(ticker, value));
  }
  return organizedShares;
}

function groupStocksByTickerName(stocks) {
  const stockGroup = {}
  const tickers = [];
  stocks.forEach(share => {
    const tickerOfShare = share.ticker.toLowerCase();
    const isTickerExist = tickers.findIndex(ticker => ticker === tickerOfShare);
    if (isTickerExist === -1) tickers.push(tickerOfShare);
  });

  tickers.forEach(ticker => {
    stockGroup[ticker] = [];
  });

  stocks.forEach(share => {
    stockGroup[share.ticker.toLowerCase()].push(share);
  });

  return stockGroup;
};

// 각 종목별 평균 매수가, 보유량 등을 계산
const organizeGroupedStocks = async (ticker, stockData) => {
  const share = {};
  let totalCost = 0;
  let totalQty = 0;
  share.ticker = ticker;

  let sellQty = 0;
  stockData.forEach(share => {
    if (share.transactionType === 'sell') {
      sellQty += share.quantity;
    } else { // share.transactionType === 'buy'
      const shareQty = share.quantity - sellQty;
      if (shareQty > 0) {
        totalCost += share.price * shareQty;
        totalQty += shareQty;
        sellQty = 0;
      } else if (shareQty < 0) {
        sellQty = -shareQty;
      } else {
        sellQty = 0;
      }
    }
  });

  share.avgCost = totalQty > 0 ? parseFloat((totalCost / totalQty).toFixed(2)) : 0;
  share.quantity = (totalQty <= 0 ? 0 : totalQty);
  share.dailyReturn = null;
  share.overallReturn = null;
  return share;
}

// calculate total value of each stock by adding cost, total return
async function calculateValueOfStock(stocks) {
  let totalCostOfStocks = 0;
  let totalDailyReturn = 0;
  let totalOverallReturn = 0;
  for (const stock of stocks) {
    if (stock.quantity > 0) {
      const closePriceData = await getClosePriceData(stock.ticker);
      const { closePrice, dailyChange } = closePriceData
      totalDailyReturn += dailyChange * stock.quantity;
      totalOverallReturn += (closePrice - stock.avgCost) * stock.quantity; // overall return
      totalCostOfStocks += stock.avgCost * stock.quantity;
    }
  }
  return {
    dailyReturn: totalDailyReturn,
    overallReturn: totalCostOfStocks + totalOverallReturn
  };
}

async function getClosePriceData(ticker) {
  const apiUrl = `https://cloud.iexapis.com/stable/stock/${ticker}/quote/?token=${process.env.IEX_CLOUD_API_KEY}`;

  try {
    const response = await axios.get(apiUrl);
    return {
      closePrice: response.data.latestPrice,
      dailyChange: response.data.change
    };
  } catch (error) {
    console.error(error);
  }
}

// get cash data
async function getTotalCash(userId, portfolioId) {
  try {
    const [cashRow] = await pool.query(`
      SELECT cashId, cash.amount, cash.memo, cash.transactionType, DATE_ADD(cash.transactionDate, INTERVAL 9 HOUR) AS transactionDate
      FROM user
	      INNER JOIN portfolio
		      ON user.userId = ? AND portfolio.portfolioId = ? AND user.userId = portfolio.userId
	      INNER JOIN cash
		      ON user.userId = cash.userId AND portfolio.portfolioId = cash.portfolioId
	      ORDER BY transactionDate
    `, [userId, portfolioId]);
    return calculateTotalCashAmount(cashRow);
  } catch (error) {
    console.error(error);
  }
}

// add all cash data
function calculateTotalCashAmount(cashList) {
  let totalCashAmount = 0;
  cashList.forEach(cash => {
    if (cash.transactionType === 'deposit' ||
      cash.transactionType === 'sold' ||
      cash.transactionType === 'dividend') {
      totalCashAmount += cash.amount;
    }
    else if (cash.transactionType === 'withdraw' || cash.transactionType === 'purchased') {
      totalCashAmount -= cash.amount;
    }
  });
  return totalCashAmount;
}

async function saveRecordIntoDB(recordData) {
  const todayDate = new Date().toJSON().slice(0, 10);
  await pool.query(`INSERT INTO dailyRecord (userId, portfolioId, dailyReturn, totalValue, recordDate) VALUES (${recordData.userId}, ${recordData.portfolioId}, ${recordData.dailyReturn}, ${recordData.totalValue}, '${todayDate}')`);
}

saveRecordScheduler();