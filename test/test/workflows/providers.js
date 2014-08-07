'use strict';

require('should');

var helpers = require('./helpers.js');

describe("Test providers workflow", function() {
  before(helpers.resetAccount);
  before(helpers.getToken);

  var payload = {
    identifier:'test-workflow-identifier',
    metadata: {
      text:'hello world',
      path: '/sample-path.txt'
    },
    document_type: 'file',
    user_access: null,
  };

  it("should be able to send a document", function(done) {
    // We should be able to login using supplied credentials
    helpers.tokenApiRequest('post', '/documents')
      .send(payload)
      .expect(helpers.expectJSON('identifier', payload.identifier))
      .expect(200)
      .end(function(err, res) {
        if(err) {
          throw err;
        }
        payload.id = res.body.id;

        done();
      });
  });

  it("should be able to retrieve a document", function(done) {
    // We should be able to get the document after providing
    helpers.basicApiRequest('get', '/documents/' + payload.id)
      .expect(200)
      .expect(function(res) {
        res.body.should.have.property('id', payload.id);
        res.body.should.have.property('data');
      })
      .expect(200)
      .end(done);
  });

  it("should be able to search for a document", function(done) {
    // Wait for ES indexing before keeping on
    setTimeout(function() {
      // We should be able to get the document via ES
      helpers.basicApiRequest('get', '/documents?search=hello')
        .expect(200)
        .expect(function(res) {
          res.body.should.have.property('data').with.lengthOf(1);
          res.body.data[0].should.have.property('id', payload.id);

          // Test projection is working too (title auto generated from path)
          res.body.data[0].data.should.have.property('title', 'Sample path');
        })
        .end(done);
    }, 5000);
  });

  it("should be removed with a reset", function(done) {
    helpers.resetAccount(function(err) {
      if(err) {
        throw err;
      }

      helpers.basicApiRequest('get', '/documents/' + payload.id)
        .expect(404)
        .end(done);
    });
  });
});