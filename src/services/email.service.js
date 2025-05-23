const nodemailer = require("nodemailer");
const config = require("@configs/config");
const logger = require("@configs/logger");
const { userService, tokenService } = require("@services");

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== "test") {
  transport
    .verify()
    .then(() => logger.info("Connected to email server"))
    .catch(() =>
      logger.warn(
        "Unable to connect to email server. Make sure you have configured the SMTP options in .env"
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html) => {
  const msg = { from: config.email.from, to, subject, html };
  try {
    await transport.sendMail(msg);
  } catch (err) {
    logger.error(err);
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (userId) => {
  const user = await userService.getUserById(userId);
  const token = await tokenService.generateResetPasswordToken(user);

  const subject = "Reset password";
  const to = user.email;
  const link = `${config.frontend_url}/reset-password`;
  const html = `<p>Hi, <br><p>Your OTP is ${token}</p><br><p><br><p>Please click on the following <a href="${link}">link</a> to reset your password.</p>
                  <br><p>If you did not request this, please ignore this email.</p>`;

  await sendEmail(to, subject, html);
};

const sendVerificationEmail = async (userId) => {
  const user = await userService.getUserById(userId);
  const token = await tokenService.generateVerifyEmailToken(user);

  const subject = "Email Verification";
  const to = user.email;
  const link = `${config.frontend_url}/verify-email`;
  const html = `<p>Hi, <br><p>Your OTP is ${token}</p><br><p><br><p>Please click on the following <a href="${link}">link</a> to verify your email.</p>
                  <br><p>If you did not request this, please ignore this email.</p>`;

  await sendEmail(to, subject, html);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
