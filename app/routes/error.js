// Error handling middleware
const logger = require("../utils/logger");

const errorHandler = (err, req, res,next) => {

    "use strict";

    logger.error(err.message, { stack: err.stack });
    res.status(500);
    res.render("error-template", {
        error: err
    });
};

module.exports = { errorHandler };
