'use strict';

module.exports.login = function login(email, password) {
  return function(nightmare) {
    nightmare
      .wait('#login')
      .type('#username', email)
      .type('#password', password)
      .click('#login')
      .wait();
  };
};

module.exports.authorize = function authorize() {
  return function(nightmare) {
    nightmare
      .wait('#oaapprove')
      .click('#oaapprove')
      .wait();
  };
};