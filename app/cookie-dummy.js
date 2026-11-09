"use strict";

const Cookies = require("js-cookie");

const setDummyCookie = (value) => Cookies.set("dummy", value, { expires: 1 });
const getDummyCookie = () => Cookies.get("dummy");

module.exports = { setDummyCookie, getDummyCookie };
