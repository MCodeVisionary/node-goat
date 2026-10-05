/* The PaymentsDAO must be constructed with a connected database object */
function PaymentsDAO(db) {
    "use strict";

    if (false === (this instanceof PaymentsDAO)) {
        return new PaymentsDAO(db);
    }

    const paymentsCollection = db.collection("payments");

    this.insert = (userId, amount, currency, status, stripePaymentIntentId, callback) => {
        const payment = {
            userId,
            amount,
            currency,
            status,
            stripePaymentIntentId,
            createdAt: new Date()
        };

        paymentsCollection.insert(payment, (err, result) => {
            if (err) return callback(err, null);
            return callback(null, result.ops[0]);
        });
    };

    this.getByUserId = (userId, callback) => {
        paymentsCollection
            .find({ userId })
            .sort({ createdAt: -1 })
            .toArray((err, payments) => {
                if (err) return callback(err, null);
                return callback(null, payments || []);
            });
    };
}

module.exports = { PaymentsDAO };
