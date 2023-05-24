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
  const html = `<p>Hi, Please click on the following <a href="${link}">link</a> to reset your password.</p>
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
  if (user.role === "partner") {
    html = `<p>Hi, Future Pinpoint Partner,
    <br><p>Your OTP for your email verification is ${token}</p><br>
    <p><br><p>
    PLEASE NOTE: This code will not grant you access to use The Pinpoint Social. This is strictly to
    verify the email you have signed up with</p><br>
    <p> Following this verification, a Pinpoint admin will verify your business and manually activate your
    profile. You will receive an email in less than 24 hours, stating the results of this vetting process.
    After activation, you will not have access to our interactive map until you have signed up for a
    Partnership with Pinpoint. At that point you have access to all of the features Pinpoint has to
    offer!</p><br>
    <p>If you did not request this, please ignore this email.</p><p><br><p>
    <p><p><br><p><p>`;
  } else {
    html = `<p>Hi, <br><p>Your OTP is ${token}</p><br><p>If you did not request this, please ignore this email.</p>`;
  }

  await sendEmail(to, subject, html);
};

const sendInviteEmail = async ({ senderId, inviteTo, message }) => {
  const user = await userService.getUserById(senderId);
  const link = `${config.frontend_url}/home`;
  const defaultMessage = `${message ? message : ''}<br><p>Hi, You have been invited to join The Pinpoint Social by ${user.firstName + " " + user.lastName}.</p><p>Please click on the following <a href="${link}">link</a> to verify your email.</p>`;
  const subject = "Invitation";
  const to = inviteTo;
  const html = defaultMessage;

  await sendEmail(to, subject, html);
};

const sendAdditionUserEmail = async ({ owner_id, additional }) => {
  const user = await userService.getUserById(owner_id);
  const token = await tokenService.generateCreateAdditionToken(user);
  const link = `https://testing.thepinpointsocial.com/authentication/additionuser/register/?token=${token}&&partner=${user.email}&&user=${additional.email}&&partnerID=${owner_id}`;
  const defaultMessage = `<p>Hi, ${user?.email} added you as ${additional?.role}.</p><p>Please click on the following <a href="${link}">link</a> to verify your email.</p>
  <br><p>If you did not request this, please ignore this email.</p>`;
  const subject = "Invitation";
  const to = additional?.email;
  const html = defaultMessage;
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
