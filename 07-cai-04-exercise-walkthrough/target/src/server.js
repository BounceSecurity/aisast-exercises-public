const express = require("express");
const checkoutGood = require("./routes/checkout-good");
const refundBad = require("./routes/refund-bad");
const topupBad = require("./routes/topup-bad");
const subscriptionGood = require("./routes/subscription-good");
const donateBad = require("./routes/donate-bad");

const app = express();
app.use(express.json());
app.use(checkoutGood);
app.use(refundBad);
app.use(topupBad);
app.use(subscriptionGood);
app.use(donateBad);

module.exports = app;
