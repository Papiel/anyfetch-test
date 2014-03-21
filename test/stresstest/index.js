'use strict';

require('should');
var async = require('async');

var helpers = require('../workflows/helpers.js');


var COUNT = 8;

describe("Stress test", function() {
  this.timeout(15 * 60 * 1000);
  this.bail(true);
  before(helpers.createAccount);
  before(helpers.resetAccount);
  before(helpers.getToken);

  // Generate a simple range to iterate over
  var range = [];
  for(var i = 0; i < COUNT; i += 1) {
    range.push(i);
  }

  // Store all documents sent
  var payloads = new Array(COUNT);

  it("sending " + COUNT + " documents and files", function(done) {

    var sender = function(i, cb) {
      var payload = {
        no_hydration: true,
        identifier:'test-office-dependencies-identifier-' + i,
        metadatas: {
          path: '/test-dependencies-sample.doc',
        },
        document_type: 'file',
        user_access: null
      };
      payloads[i] = payload;
      var file = __dirname + '/../workflows/samples/office-file.doc';

      async.series([
        helpers.sendDocument(payload),
        helpers.sendFile(payload, file)
      ], cb);
    };


    async.eachLimit(range, 4, sender, done);
  });

  it("checking for hydration", function(done) {
    var checker = function(i, cb) {
      var id = payloads[i].id;

      helpers.waitForHydration(id, 'http://office.hydrater.anyfetch.com/hydrate')(cb);
    };

    async.eachLimit(range, 4, checker, done);
  });

  after(helpers.deleteAccount);
});