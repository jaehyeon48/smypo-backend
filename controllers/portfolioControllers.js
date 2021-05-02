const pool = require('../database/db');


// @ROUTE         GET portfolio
// @DESCRIPTION   Get all of the user's portfolios
// @ACCESS        Private
async function getPortfolios(req, res) {
  const userId = req.user.id;
  try {
    const [userPortfolios] = await pool.query(`SELECT portfolioId, portfolioName, privacy FROM portfolio WHERE userId = '${userId}'`);

    let resultPortfolio = [];

    userPortfolios.map(portfolio => {
      resultPortfolio.push({
        portfolioId: portfolio.portfolioId,
        portfolioName: portfolio.portfolioName,
        portfolioPrivacy: portfolio.privacy
      });
    });

    res.status(200).json(resultPortfolio);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET portfolio/stocks/:portfolioId
// @DESCRIPTION   Get Portfolio's stocks
// @ACCESS        Private
async function getPortfolioStocks(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;
  const getStocksQuery = `
    SELECT stock.ticker, stock.price, stock.quantity,
    stock.transactionType, DATE_ADD(stock.transactionDate, INTERVAL 9 HOUR) AS transactionDate
    FROM user
      INNER JOIN portfolio
        ON user.userId = ${userId} AND portfolio.portfolioId = ${portfolioId} AND user.userId = portfolio.userId 
      INNER JOIN stock
        ON user.userId = stock.userId AND portfolio.portfolioId = stock.portfolioId
      ORDER BY stock.ticker, stock.transactionType DESC, stock.transactionDate;`;

  try {
    if (portfolioId) {
      const [stocksRow] = await pool.query(getStocksQuery);
      return res.status(200).json(stocksRow);
    }
    else {
      return res.status(400).json({ errorMsg: 'Portfolio id does not exist' });
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET portfolio/cash/:portfolioId
// @DESCRIPTION   Get Portfolio's cash
// @ACCESS        Private
async function getPortfolioCash(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;
  const getCashQuery = `
    SELECT cashId, cash.amount, cash.memo, cash.transactionType, DATE_ADD(cash.transactionDate, INTERVAL 9 HOUR) AS transactionDate
    FROM user
	    INNER JOIN portfolio
		    ON user.userId = ${userId} AND portfolio.portfolioId = ${portfolioId} AND user.userId = portfolio.userId
	    INNER JOIN cash
		    ON user.userId = cash.userId AND portfolio.portfolioId = cash.portfolioId
	    ORDER BY transactionDate;
  `;

  try {
    const [cashRow] = await pool.query(getCashQuery);
    res.status(200).json(cashRow);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET portfolio/:portfolioId/:tickerName
// @DESCRIPTION   Get Information of the Ticker Group in the portfolio
// @ACCESS        Private
async function getStockInfoByTickerGroup(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;
  const tickerName = req.params.tickerName;
  const getStockQuery = `
    SELECT stockId, price, quantity, memo, transactionType, DATE_ADD(transactionDate, INTERVAL 9 HOUR) AS transactionDate
    FROM stock
    WHERE ticker = '${tickerName}' AND userId = ${userId} AND portfolioId = ${portfolioId}
    ORDER BY transactionDate, transactionType, quantity
  `;
  try {
    const [stocksRow] = await pool.query(getStockQuery);

    res.status(200).json(stocksRow);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET portfolio/default
// @DESCRIPTION   Get default portfolio
// @ACCESS        Private
async function getDefaultPortfolio(req, res) {
  const userId = req.user.id;
  try {
    const [defaultPortfolioRow] = await pool.query(`SELECT * FROM defaultPortfolio WHERE userId = ${userId}`);

    if (!defaultPortfolioRow[0]) {
      return res.status(404).json({ defaultPortfolioId: null });
    }

    return res.status(200).json({ defaultPortfolioId: defaultPortfolioRow[0].portfolioId });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET portfolio/default/name/:defaultPortfolioId
// @DESCRIPTION   Get default portfolio's name
// @ACCESS        Private 
async function getDefaultPortfolioName(req, res) {
  const defaultPortfolioId = req.params.defaultPortfolioId;

  try {
    const [response] = await pool.query(`SELECT portfolioName FROM portfolio WHERE portfolioId = ${defaultPortfolioId}`);

    return res.json({ name: response[0].portfolioName })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET portfolio/realized/:portfolioId
// @DESCRIPTION   Get All Realized stock's info
// @ACCESS        Private
async function getRealizedStocks(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;

  try {
    const [realizedStocks] = await pool.query(`
      SELECT stock.stockId, stock.price, stock.quantity, stock.ticker, realizedStock.avgCost
      FROM stock
        INNER JOIN user
          ON stock.userId = ${userId} AND stock.userId = user.userId 
        INNER JOIN portfolio
          ON stock.portfolioId = ${portfolioId} AND stock.portfolioId = portfolio.portfolioId
        INNER JOIN realizedStock
          ON stock.stockId = realizedStock.stockId
        ORDER BY ticker asc;
    `);
    return res.status(200).json(realizedStocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         POST portfolio
// @DESCRIPTION   Create New Portfolio
// @ACCESS        Private
async function createPortfolio(req, res) {
  const userId = req.user.id;
  const { portfolioName, privacy } = req.body;
  try {
    // check if the user does not have any portfolios
    const [isNotFirstlyCreated] = await pool.query(`SELECT portfolioId FROM defaultPortfolio WHERE userId = ${userId}`);

    const [newPortfolio] = await pool.query(`INSERT INTO portfolio (portfolioName, userId, privacy) VALUES (?, ${userId},'${privacy}')`, [portfolioName]);

    // if the portfolio is firstly created one, select the portfolio.
    if (!isNotFirstlyCreated[0]) {
      await pool.query(`INSERT INTO defaultPortfolio VALUES (${newPortfolio.insertId}, ${userId})`);
    }

    return res.status(201).json({ successMsg: 'New portfolio created' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

// @ROUTE         POST portfolio/default
// @DESCRIPTION   Select default portfolio
// @ACCESS        Private
async function selectPortfolio(req, res) {
  const userId = req.user.id;
  const { portfolioId } = req.body;
  try {
    // delete a previous default portfolio
    await pool.query(`DELETE FROM defaultPortfolio WHERE userId = ${userId}`);
    await pool.query(`INSERT INTO defaultPortfolio VALUES (${portfolioId}, ${userId})`);

    return res.status(201).json({ defaultPortfolioId: portfolioId });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         PUT portfolio/:portfolioId
// @DESCRIPTION   Edit Portfolio
// @ACCESS        Private
async function editPortfolioName(req, res) {
  const userId = req.user.id;
  const { newPortfolioName, newPortfolioPrivacy } = req.body;
  const portfolioId = req.params.portfolioId;
  try {
    const [userIdRow] = await pool.query(`SELECT userId FROM portfolio WHERE portfolioId = ${portfolioId}`);

    if (userId !== userIdRow[0].userId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot edit this portfolio.' });
    }

    await pool.query(`UPDATE portfolio SET portfolioName = ?, privacy = ? WHERE portfolioId = ${portfolioId}`,
      [newPortfolioName, newPortfolioPrivacy]);

    res.status(200).json({ successMsg: 'Successfully changed portfolio.' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         DELETE portfolio/:portfolioId
// @DESCRIPTION   DELETE an portfolio all of its related information
// @ACCESS        Private
async function deletePortfolio(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;

  try {
    const [userIdRow] = await pool.query(`SELECT userId FROM portfolio WHERE portfolioId = ${portfolioId}`);

    if (userId !== userIdRow[0].userId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot delete this portfolio.' });
    }

    const [isDefaultOne] = await pool.query(`SELECT portfolioId FROM defaultPortfolio WHERE portfolioId = ${portfolioId}`);

    const [stocksInThePortfolio] = await pool.query(`SELECT stockId FROM stock WHERE userId = ${userId} AND portfolioId = ${portfolioId}`);

    // delete every realized stock data
    for (const stock of stocksInThePortfolio) {
      await pool.query(`DELETE FROM realizedStock WHERE stockId = ${stock.stockId}`);
    }

    await pool.query(`DELETE FROM dailyRecord WHERE portfolioId = ${portfolioId}`);
    await pool.query(`DELETE FROM cash WHERE portfolioId = ${portfolioId}`);
    await pool.query(`DELETE FROM defaultPortfolio WHERE portfolioId = ${portfolioId}`)
    await pool.query(`DELETE FROM stock WHERE portfolioId = ${portfolioId}`);
    await pool.query(`DELETE FROM portfolio WHERE portfolioId = ${portfolioId}`);


    // if the portfolio is default one, select another portfolio if there exists other portfolios.
    if (isDefaultOne[0]) {
      const [userPortfolioRow] = await pool.query(`SELECT portfolioId FROM portfolio WHERE userId = ${userId}`);

      if (userPortfolioRow[0]) {
        await pool.query(`INSERT INTO defaultPortfolio VALUES (${userPortfolioRow[0].portfolioId}, ${userId})`);
      }
    }

    res.status(200).json({ successMsg: 'The portfolio successfully deleted.' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

module.exports = {
  getPortfolios,
  getPortfolioStocks,
  getDefaultPortfolio,
  getDefaultPortfolioName,
  getPortfolioCash,
  getStockInfoByTickerGroup,
  getRealizedStocks,
  selectPortfolio,
  createPortfolio,
  editPortfolioName,
  deletePortfolio
};