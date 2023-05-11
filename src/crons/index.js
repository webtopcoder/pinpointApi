const partnershipCrons = require("./partnership.cron");

async function start() {
  partnershipCrons.endPartnership.start();
}

module.exports = { start };
