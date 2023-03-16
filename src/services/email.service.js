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
 * @param {string} html
 * @param {any} attachments
 * @returns {Promise}
 */
const sendEmail = async (to, subject, html, attachments) => {
  const msg = { from: config.email.from, to, subject, html, attachments };
  try {
    await transport.sendMail(msg);
  } catch (err) {
    logger.error(err);
  }
};

/**
 * Send mail from Admin
 */
const sendMailFromAdmin = async ({ to, subject, message, attachments }) => {
  await sendEmail(to, subject, message, attachments);
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
  const link = `${config.frontend_url}/authentication/create-password/?token=${token}`;
  const html = `<p>Hi, br><p>Please click on the following <a href="${link}">link</a> to reset your password.</p>
    <br>Or enter the following OTP to reset your password: <br><p>${link}</p>
    <br><p>If you did not request this, please ignore this email.</p>`;

  await sendEmail(to, subject, html);
};

const sendVerificationEmail = async (userId) => {
  const user = await userService.getUserById(userId);
  const token = await tokenService.generateVerifyEmailToken(user);
  let html;
  const subject = "Email Verification";
  const to = user.email;
  if (user.role === "user") {
    html = `<p>Hi, <br><p>Your OTP is ${token}</p><br><p><br><p>Pinpoint is going to vet out your business to make sure you are legit.</p><br><p> You will receive an email in less than an hour with the results. If approved, you will then be able to login. Thank you!</p><br>
    <p>If you did not request this, please ignore this email.</p>`;
  } else {
    html = `<p>Hi, <br><p>Your OTP is ${token}</p><br><p>If you did not request this, please ignore this email.</p>`;
  }

  await sendEmail(to, subject, html);
};

const sendInviteEmail = async ({ senderId, inviteTo, message }) => {
  const user = await userService.getUserById(senderId);
  const link = `${config.frontend_url}/home`;
  const defaultMessage = `<p>Hi, <br><p>I am going to invite our platform.</p><br><p><br><p>Please click on the following <a href="${link}">link</a> to verify your email.</p>
  <br><p>If you did not request this, please ignore this email.</p>`;
  const subject = "Invitation";
  const to = inviteTo;
  const html = message ? message : defaultMessage;

  await sendEmail(to, subject, html);
};

const sendAdditionUserEmail = async ({ NewUser, user_id }) => {
  const user = await userService.getUserById(user_id);
  const link = `${config.frontend_url}/home`;
  const defaultMessage = `<p>Hi, <br><p>I am going to invite our platform.</p><br><p><br><p>Please click on the following <a href="${link}">link</a> to verify your email.</p>
  <br><p>If you did not request this, please ignore this email.</p>`;
  const subject = "Invitation";
  const to = NewUser.email;
  const html = message ? message : defaultMessage;

  await sendEmail(to, subject, html);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendInviteEmail,
  sendMailFromAdmin,
  sendAdditionUserEmail,
};
