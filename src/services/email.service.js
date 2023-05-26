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
};

const sendInviteEmail = async ({ senderId, inviteTo, message }) => {
  const user = await userService.getUserById(senderId);
  // const link = `${config.frontend_url}/home`;
  // const defaultMessage = `${message ? message : ""
  //   }<br><p>Hi, You have been invited to join The Pinpoint Social by ${user.firstName + " " + user.lastName
  //   }.</p><p>Please click on the following <a href="${link}">link</a> to verify your email.</p>`;
  // const subject = "Invitation";
  // const to = inviteTo;
  // const html = defaultMessage;

  await sendEmailWithEJS(inviteTo, subject, message ? "invite-email-message" : 'invite-email', {
    title: "Invitation",
    message: message,
    user: user.firstName + " " + user.lastName
  });

  // await sendEmail(to, subject, html);
};

const sendPartnerStatus = async ({ id }) => {
  const user = await userService.getUserById(id);
  const link = `${config.frontend_url}/`;
  // const activeMessage = `<p>Your Approved!</p><p>You can now access The Pinpoint Soical. Thank you for your for your patience.</p><p><a href="${link}">Login</a></p>
  // <p>You must have a pinpoint Partnership to go live on our interactive map.</p>
  // <p>If you did not intend to receive this email, please ignore this email.</p>`;
  // const inactiveMessage = `<p>Access Denied</p><p>For one reason or another, Pinpoint has declined your request to access the platform.</p>
  // <p>If you belive this may have been a mistake, please reach out to us at.. pinpointfoodtruck@gmail.com</p>
  // <p>If you did not intend to receive this email, please ignore this email.</p>`;
  const subject = "Partner Verication";
  // const to = user.email;
  // const html = user.status === "active" ? activeMessage : inactiveMessage;
  // await sendEmail(to, subject, html);

  await sendEmailWithEJS(user.email, subject, user.status ? "partner-approve" : 'partner-decline', {
    title: "Partner Verication",
  });


};

const sendAdditionUserEmail = async ({ owner_id, additional }) => {
  const user = await userService.getUserById(owner_id);
  const token = await tokenService.generateCreateAdditionToken(user);
  const link = `https://testing.thepinpointsocial.com/authentication/additionuser/register/?token=${token}&&partner=${user.email}&&user=${additional.email}&&partnerID=${owner_id}`;
  // const defaultMessage = `<p>Hi, ${user?.email} added you as ${additional?.role}.</p><p>Please click on the following <a href="${link}">link</a> to verify your email.</p>
  // <br><p>If you did not request this, please ignore this email.</p>`;
  const subject = "Invitation As additional user";
  // const to = additional?.email;
  // const html = defaultMessage;
  // await sendEmail(to, subject, html);

  await sendEmailWithEJS(additional.email, subject, "additional-user-invite", {
    title: "Additional User Invitation",
    link: link
  });
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendInviteEmail,
  sendMailFromAdmin,
  sendAdditionUserEmail,
  sendEmailWithEJS,
  sendPartnerStatus
};
