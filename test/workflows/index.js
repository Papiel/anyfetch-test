'use strict';

require('should');

var helpers = require('./helpers.js');

describe("Test workflow", function() {
  before(helpers.createAccount);
  before(helpers.resetAccount);

  it("should be able to login", function(done) {
    // We should be able to login using supplied credentials
    helpers.basicApiRequest('get', '/')
      .expect(200)
      .end(done);
  });

  after(helpers.deleteAccount);
});
