const sgMail = require("@sendgrid/mail");
const { sendgrid } = require("../../config/config");
const logger = require("./logger");

if (sendgrid.apiKey) {
    sgMail.setApiKey(sendgrid.apiKey);
} else {
    logger.warn("SENDGRID_API_KEY not set; email notifications are disabled");
}

const sendMemoNotification = (memo) => {
    if (!sendgrid.apiKey) return Promise.resolve();

    const msg = {
        to: sendgrid.toEmail,
        from: sendgrid.fromEmail,
        subject: "New NodeGoat memo posted",
        text: memo
    };

    return sgMail.send(msg)
        .then(() => logger.info("Memo notification email sent"))
        .catch((err) => logger.error("Failed to send memo notification email", { error: err.message }));
};

module.exports = { sendMemoNotification };
