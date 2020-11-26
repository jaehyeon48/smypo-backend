const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');

const {
  addCash,
  editCash,
  deleteCash
} = require('../controllers/cashControllers');


// @ROUTE         POST api/cash
// @DESCRIPTION   Add New Cash
// @ACCESS        Private
router.post('/', authMiddleware, addCash);


// @ROUTE         PUT api/cash/:cashId
// @DESCRIPTION   Edit Stock's Information
// @ACCESS        Private
router.put('/:cashId', authMiddleware, editCash);


// @ROUTE         DELETE api/cash/:cashId
// @DESCRIPTION   Delete Cash
// @ACCESS        Private
router.delete('/:cashId', authMiddleware, deleteCash);

module.exports = router;