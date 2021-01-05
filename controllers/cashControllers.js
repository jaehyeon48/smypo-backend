const pool = require('../database/db');


// @ROUTE         POST cash
// @DESCRIPTION   Add New Cash
// @ACCESS        Private
async function addCash(req, res) {
  const userId = req.user.id;
  const { portfolioId, amount, transactionType, transactionDate } = req.body;
  const addCashQuery = `
    INSERT INTO cash (holderId, portfolioId, amount, transactionType, transactionDate)
    VALUES (${userId}, ${portfolioId}, ${amount}, '${transactionType}', '${transactionDate}')`;
  try {
    await pool.query(addCashQuery);

    res.status(201).json({ successMsg: 'Successfully added new cash info.' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         PUT cash/:cashId
// @DESCRIPTION   Edit Stock's Information
// @ACCESS        Private
async function editCash(req, res) {
  const userId = req.user.id;
  const cashId = req.params.cashId;
  const { amount, transactionType, transactionDate } = req.body;
  const editCashQuery = `
    UPDATE cash
    SET amount = ${amount}, transactionType = '${transactionType}', transactionDate = '${transactionDate}'
    WHERE cashId = ${cashId}`;

  try {
    const [holderIdRow] = await pool.query(`SELECT holderId FROM cash WHERE cashId = ${cashId}`);

    if (userId !== holderIdRow[0].holderId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot delete this cash info.' });
    }

    await pool.query(editCashQuery);

    res.status(200).json({ successMsg: 'Successfully edited the cash info.' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}


// @ROUTE         DELETE cash/:cashId
// @DESCRIPTION   Delete Cash
// @ACCESS        Private
async function deleteCash(req, res) {
  const cashId = req.params.cashId;
  const userId = req.user.id;
  const deleteCashQuery = `DELETE FROM cash WHERE cashId = ${cashId}`;
  try {
    const [holderIdRow] = await pool.query(`SELECT holderId FROM cash WHERE cashId = ${cashId}`);

    if (userId !== holderIdRow[0].holderId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot delete this cash info.' });
    }
    await pool.query(deleteCashQuery);

    return res.status(200).json({ successMsg: 'Successfully deleted the cash' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

module.exports = {
  addCash,
  editCash,
  deleteCash
};