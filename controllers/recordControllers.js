const pool = require('../database/db');


// @ROUTE         GET record/10days/:portfolioId
// @DESCRIPTION   Get Recent 10 Records
// @ACCESS        Private
async function getRecordsBy10(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;

  try {
    const [recordsRow] = await pool.query(`
    SELECT dailyReturn, totalValue, DATE_ADD(recordDate, INTERVAL 9 HOUR)AS recordDate 
    FROM dailyRecord 
    WHERE userId = ? AND portfolioId = ? 
    ORDER BY recordDate asc`, [userId, portfolioId]);

    return res.status(200).json({ records: recordsRow });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

// @ROUTE         POST record/:portfolioId
// @DESCRIPTION   Add A New Record
// @ACCESS        Private
async function addNewRecord(req, res) {
  const userId = req.user.id;
  const portfolioId = req.params.portfolioId;
  const { dailyReturn, totalValue, recordDate } = req.body;

  try {
    await pool.query(`
    INSERT INTO dailyRecords (userId, portfolioId, dailyReturn, totalValue, recordDate) 
    VALUES (?, ?, ?, ?, ?)`,
      [userId, portfolioId, dailyReturn, totalValue, recordDate]);
    return res.status(201).json({ successMsg: 'Daily record successfully added.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

async function deleteUsersRecords(req, res) {
  const userId = req.user.id;

  try {
    await pool.query('DELETE FROM dailyRecords WHERE userId = ?', [userId]);
    return res.status(200).json({ successMsg: "Deleted all of user's records successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ errorMsg: 'Internal Server Error' });
  }
}

module.exports = {
  getRecordsBy10,
  addNewRecord,
  deleteUsersRecords
};