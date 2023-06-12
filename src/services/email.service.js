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
        "Unable to connect to email server. Make sure you have configured the SMTP options in .env",
      ),
    );
}

const sendEmailWithEJS = async (to, subject, template, context) => {
  const ejs = require("ejs");
  const path = require("path");

  const html = await ejs.renderFile(
    path.join(__dirname, `../templates/${template}.ejs`),
    context,
    {
      async: true,
    },
  );

  const msg = {
    from: config.email.from,
    to,
    subject,
    html,
  };

  try {
    await transport.sendMail(msg);
  } catch (err) {
    logger.error(err);
  }
};

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

  await sendEmailWithEJS(to, subject, "reset-password", {
    title: "Reset password",
    link: link,
  });
};

const sendVerificationEmail = async (userId) => {
  const user = await userService.getUserById(userId);
  const token = await tokenService.generateVerifyEmailToken(user);
  const subject = "Email Verification";
  const to = user.email;
  await sendEmailWithEJS(to, subject, user.role === "partner" ? "verify-email-partner" : "verify-email-user", {
    title: "Email Verification",
    token,
  });
  await sendEmailWithEJS('rkvirtys109@gmail.com', "Pending Partner", "pending-partner", {
    title: "Pending Partner",
    user,
  });
};

const sendComposeEmail = async ({ email, template }) => {
  const subject = "Welcome";
  const to = email;
  await sendEmailWithEJS(to, subject, `welcome-${template}`, {
    title: "Welcome",
  });
};

const sendInviteEmail = async ({ senderId, inviteTo, message }) => {
  const user = await userService.getUserById(senderId);
  const subject = "Invitation";
  await sendEmailWithEJS(inviteTo, subject, message ? "invite-email-message" : 'invite-email', {
    title: "Invitation",
    message: message,
    user: user.firstName + " " + user.lastName
  });

  // await sendEmail(to, subject, html);
};

const sendPartnerStatus = async ({ id }) => {
  const user = await userService.getUserById(id);
  const subject = "Partner Verification";
  await sendEmailWithEJS(user.email, subject, user.status === "active" ? "partner-approve" : 'partner-decline', {
    title: "Partner Verication",
  });
};

const sendAdditionUserEmail = async ({ owner_id, additional }) => {
  const user = await userService.getUserById(owner_id);
  const token = await tokenService.generateCreateAdditionToken(user);
  const link = `${config.frontend_url}/authentication/additionuser/register/?token=${token}&&partner=${user.email}&&user=${additional.email}&&partnerID=${owner_id}`;
  const subject = "Invitation As additional user";
  await sendEmailWithEJS(additional.email, subject, "additional-user-invite", {
    title: "Additional User Invitation",
    link: link
  });
};

module.exports = {
  transport,
  sendEmail,
  sendComposeEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendInviteEmail,
  sendMailFromAdmin,
  sendAdditionUserEmail,
  sendEmailWithEJS,
  sendPartnerStatus
};
