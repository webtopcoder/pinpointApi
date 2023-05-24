const cron = require("node-cron");

const { partnershipService } = require("../services");

exports.endPartnership = cron.schedule("0 0 * * *", async () => {
  await partnershipService.endPartnership();
});
