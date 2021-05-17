const pool = require('../database/db');


// @ROUTE         POST cash
// @DESCRIPTION   Add New Cash
// @ACCESS        Private
async function addCash(req, res) {
  const userId = req.user.id;
  const { portfolioId, amount, cashMemo, transactionType, transactionDate } = req.body;

  try {
    await pool.query(`
      INSERT INTO cash (userId, portfolioId, amount, memo, transactionType, transactionDate)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, portfolioId, amount, cashMemo, transactionType, transactionDate]);
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
  const { amount, cashMemo, transactionType, transactionDate } = req.body;

  try {
    const [userIdRow] = await pool.query('SELECT userId FROM cash WHERE cashId = ?', [cashId]);

    if (userId !== userIdRow[0].userId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot delete this cash info.' });
    }

    await pool.query(`
      UPDATE cash
      SET amount = ?, memo = ?, transactionType = ?, transactionDate = ?
      WHERE cashId = ?
    `, [amount, cashMemo, transactionType, transactionDate, cashId]);

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
  try {
    const [userIdRow] = await pool.query('SELECT userId FROM cash WHERE cashId = ?', [cashId]);

    if (userId !== userIdRow[0].userId) {
      return res.status(403).json({ errorMsg: 'Wrong access: You cannot delete this cash info.' });
    }
    await pool.query('DELETE FROM cash WHERE cashId = ?', [cashId]);

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