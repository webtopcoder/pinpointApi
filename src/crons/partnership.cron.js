const cron = require("node-cron");

const { partnershipService } = require("../services");

// Every day at 00:00
exports.endPartnership = cron.schedule("0 0 * * *", async () => {
  await partnershipService.endPartnership();
});
