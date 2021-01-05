const pool = require('../database/db');


// @ROUTE         GET portfolio
// @DESCRIPTION   Get all of the user's portfolios
// @ACCESS        Private
async function getPortfolios(req, res) {
  const userId = req.user.id;
  try {
    const [userPortfolios] = await pool.query(`SELECT portfolioId, portfolioName FROM portfolio WHERE ownerId = '${userId}'`);

    let resultPortfolio = [];

    userPortfolios.map(portfolio => {
      resultPortfolio.push({
        portfolioId: portfolio.portfolioId,
        portfolioName: portfolio.portfolioName
      });
    });

    res.status(200).json(resultPortfolio);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET portfolio/:portfolioId/stocks
// @DESCRIPTION   Get Portfolio's stocks
// @ACCESS        Private
async function getPortfolioStocks(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;
  const getStocksQuery = `
    SELECT stocks.ticker, stocks.companyName, stocks.price, stocks.quantity, 
    stocks.transactionType, stocks.transactionDate
    FROM users
      INNER JOIN portfolios
        ON users.userId = ${userId} AND portfolios.portfolioId = ${portfolioId} AND users.userId = portfolios.ownerId 
      INNER JOIN stocks
        ON users.userId = stocks.holderId AND portfolios.portfolioId = stocks.portfolioId
      ORDER BY stocks.ticker, stocks.transactionDate, stocks.transactionType;`;

  try {
    if (portfolioId !== null) {
      const [stocksRow] = await pool.query(getStocksQuery);
      if (stocksRow.length === 0) {
        return res.status(200).json(null);
      }
      else {
        return res.status(200).json(stocksRow);
      }
    }
    else {
      return res.status(404);
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET portfolio/:portfolioId/cash
// @DESCRIPTION   Get Portfolio's cash
// @ACCESS        Private
async function getPortfolioCash(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;
  const getCashQuery = `
    SELECT cashId, cash.amount, cash.transactionType, cash.transactionDate
    FROM users
	    INNER JOIN portfolios
		    ON users.userId = ${userId} AND portfolios.portfolioId = ${portfolioId} AND users.userId = portfolios.ownerId
	    INNER JOIN cash
		    ON users.userId = cash.holderId AND portfolios.portfolioId = cash.portfolioId
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
    SELECT stockId, price, quantity, transactionType, transactionDate
    FROM stocks
    WHERE ticker = '${tickerName}' AND holderId = ${userId} AND portfolioId = ${portfolioId}
    ORDER BY transactionDate, transactionType, quantity
  `;
  try {
    const [ownerIdRow] = await pool.query(`SELECT ownerId FROM portfolio WHERE portfolioId = ${portfolioId}`);

    if (userId !== ownerIdRow[0].ownerId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot read this portfolio info.' });
    }

    const [stocksRow] = await pool.query(getStockQuery);

    res.status(200).json(stocksRow);
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         GET portfolio/select
// @DESCRIPTION   Fetch selected portfolio
// @ACCESS        Private
async function getSelectedPortfolio(req, res) {
  const userId = req.user.id;
  try {
    const [selectedPortfolioRow] = await pool.query(`SELECT * FROM selectedPortfolio WHERE userId = ${userId}`);

    if (!selectedPortfolioRow[0]) {
      return res.status(404).json({ errorMsg: 'Selected portfolio does not exist' });
    }

    return res.status(200).json({ selectedPortfolioId: selectedPortfolioRow[0].portfolioId });
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
      SELECT stocks.stockId, stocks.price, stocks.quantity, stocks.ticker, realizedStocks.avgCost
      FROM stocks
        INNER JOIN users
          ON stocks.holderId = ${userId} AND stocks.holderId = users.userId 
        INNER JOIN portfolios
          ON stocks.portfolioId = ${portfolioId} AND stocks.portfolioId = portfolios.portfolioId
        INNER JOIN realizedStocks
          ON stocks.stockId = realizedStocks.stockId
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
    const [isNameConflict] = await pool.query(`SELECT portfolioId FROM portfolio WHERE userId = ${userId} AND portfolioName = '?'`, [portfolioName]);

    if (isNameConflict[0]) {
      return res.status(400).json({ errorMsg: 'Portfolio name is already exists.' });
    }

    // check if the user does not have any portfolios
    const [isNotFirstlyCreated] = await pool.query(`SELECT portfolioId FROM selectedPortfolio WHERE userId = ${userId}`);

    const [newPortfolio] = await pool.query(`INSERT INTO portfolio (portfolioName, userId, privacy) VALUES ('?', ${userId},'${privacy}')`, [portfolioName]);

    // if the portfolio is firstly created one, select the portfolio.
    if (!isNotFirstlyCreated[0]) {
      await pool.query(`INSERT INTO selectedPortfolio VALUES (${newPortfolio.insertId}, ${userId})`);
    }

    return res.status(201).json({ successMsg: 'New portfolio created' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

// @ROUTE         POST portfolio/select
// @DESCRIPTION   Save selected portfolio into the DB
// @ACCESS        Private
async function selectPortfolio(req, res) {
  const userId = req.user.id;
  const { portfolioId } = req.body;
  try {
    // delete a previously selected portfolio
    await pool.query(`DELETE FROM selectedPortfolio WHERE userId = ${userId}`);
    await pool.query(`INSERT INTO selectedPortfolio VALUES (${portfolioId}, ${userId})`);

    return res.status(201).json({ selectedPortfolioId: portfolioId });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         PUT portfolio/:portfolioId
// @DESCRIPTION   Edit Portfolio's Name
// @ACCESS        Private
async function editPortfolioName(req, res) {
  const userId = req.user.id;
  const { newPortfolioName } = req.body;
  const portfolioId = req.params.portfolioId;
  try {
    const [ownerIdRow] = await pool.query(`SELECT ownerId FROM portfolio WHERE portfolioId = ${portfolioId}`);

    if (userId !== ownerIdRow[0].ownerId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot edit this portfolio.' });
    }

    const [isNameConflict] = await pool.query(`SELECT portfolioId FROM portfolio WHERE portfolioName = '${newPortfolioName}'`);

    if (isNameConflict[0]) {
      return res.status(400).json({ errorMsg: 'The portfolio name already exists.' });
    }

    await pool.query(`UPDATE portfolio SET portfolioName = '${newPortfolioName}' WHERE portfolioId = ${portfolioId}`);

    res.status(200).json({ successMsg: 'Successfully changed portfolio name.' });
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
    const [ownerIdRow] = await pool.query(`SELECT ownerId FROM portfolio WHERE portfolioId = ${portfolioId}`);

    if (userId !== ownerIdRow[0].ownerId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot delete this portfolio.' });
    }

    const [isSelectedOne] = await pool.query(`SELECT portfolioId FROM selectedPortfolio WHERE portfolioId = ${portfolioId}`);

    const [stocksInThePortfolio] = await pool.query(`SELECT stockId FROM stocks WHERE holderId = ${userId} AND portfolioId = ${portfolioId}`);

    // delete every realized stock data
    for (const stock of stocksInThePortfolio) {
      await pool.query(`DELETE FROM realizedStocks WHERE stockId = ${stock.stockId}`);
    }

    await pool.query(`DELETE FROM dailyRecords WHERE portfolioId = ${portfolioId}`);
    await pool.query(`DELETE FROM cash WHERE portfolioId = ${portfolioId}`);
    await pool.query(`DELETE FROM selectedPortfolio WHERE portfolioId = ${portfolioId}`)
    await pool.query(`DELETE FROM stocks WHERE portfolioId = ${portfolioId}`);
    await pool.query(`DELETE FROM portfolio WHERE portfolioId = ${portfolioId}`);


    // if the portfolio is selected one, select another portfolio if there exists other portfolios.
    if (isSelectedOne[0]) {
      const [userPortfolioRow] = await pool.query(`SELECT portfolioId FROM portfolio WHERE ownerId = ${userId}`);

      if (userPortfolioRow[0]) {
        await pool.query(`INSERT INTO selectedPortfolio VALUES (${userPortfolioRow[0].portfolioId}, ${userId})`);
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
  getSelectedPortfolio,
  getPortfolioCash,
  getStockInfoByTickerGroup,
  getRealizedStocks,
  selectPortfolio,
  createPortfolio,
  editPortfolioName,
  deletePortfolio
};