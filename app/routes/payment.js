const { PaymentsDAO } = require("../data/payments-dao");
const { stripeSecretKey, environmentalScripts } = require("../../config/config");
const logger = require("../utils/logger");

const stripe = require("stripe")(stripeSecretKey);

const SUPPORTED_CURRENCIES = ["usd", "eur", "gbp"];

function PaymentHandler(db) {
    "use strict";

    const paymentsDAO = new PaymentsDAO(db);

    this.displayPaymentPage = (req, res, next) => {
        const { userId } = req.session;
        logger.info("Displaying payment page", { userId });

        return res.render("payment", {
            userId,
            currencies: SUPPORTED_CURRENCIES,
            environmentalScripts
        });
    };

    this.processPayment = (req, res, next) => {
        const { userId } = req.session;
        const { amount, currency, paymentMethodId, description } = req.body;

        const parsedAmount = parseInt(amount, 10);

        if (!parsedAmount || parsedAmount <= 0) {
            logger.warn("Payment rejected: invalid amount", { userId, amount });
            return res.render("payment", {
                userId,
                currencies: SUPPORTED_CURRENCIES,
                paymentError: "Amount must be a positive number",
                environmentalScripts
            });
        }

        if (!SUPPORTED_CURRENCIES.includes(currency)) {
            logger.warn("Payment rejected: unsupported currency", { userId, currency });
            return res.render("payment", {
                userId,
                currencies: SUPPORTED_CURRENCIES,
                paymentError: "Unsupported currency",
                environmentalScripts
            });
        }

        if (!paymentMethodId) {
            logger.warn("Payment rejected: missing payment method", { userId });
            return res.render("payment", {
                userId,
                currencies: SUPPORTED_CURRENCIES,
                paymentError: "Payment method is required",
                environmentalScripts
            });
        }

        logger.info("Creating Stripe PaymentIntent", { userId, amount: parsedAmount, currency });

        // Amount in Stripe is in smallest currency unit (cents)
        stripe.paymentIntents.create({
            amount: parsedAmount * 100,
            currency,
            payment_method: paymentMethodId,
            description: description || "NodeGoat payment",
            confirm: true,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never"
            }
        }, (err, paymentIntent) => {
            if (err) {
                logger.error("Stripe PaymentIntent creation failed", { userId, error: err.message });
                return res.render("payment", {
                    userId,
                    currencies: SUPPORTED_CURRENCIES,
                    paymentError: err.message,
                    environmentalScripts
                });
            }

            logger.info("Stripe PaymentIntent created", { userId, intentId: paymentIntent.id, status: paymentIntent.status });

            paymentsDAO.insert(userId, parsedAmount, currency, paymentIntent.status, paymentIntent.id, (dbErr, payment) => {
                if (dbErr) return next(dbErr);

                logger.info("Payment record saved", { userId, paymentId: payment._id });

                return res.render("payment", {
                    userId,
                    currencies: SUPPORTED_CURRENCIES,
                    paymentSuccess: true,
                    paymentId: paymentIntent.id,
                    paymentStatus: paymentIntent.status,
                    amount: parsedAmount,
                    currency: currency.toUpperCase(),
                    environmentalScripts
                });
            });
        });
    };

    this.displayPaymentHistory = (req, res, next) => {
        const { userId } = req.session;
        logger.info("Displaying payment history", { userId });

        paymentsDAO.getByUserId(userId, (err, payments) => {
            if (err) return next(err);

            return res.render("payment-history", {
                userId,
                payments,
                environmentalScripts
            });
        });
    };
}

module.exports = PaymentHandler;
