'use strict';

require('should');

var async = require('async');
var Nightmare = require('nightmare');

var up = require('../../helpers/up');
var api = require('../../helpers/api');
var env = require('../../../config');

var managerNightmare = require('../../helpers/nightmare/manager');
var googleNightmare = require('../../helpers/nightmare/google');
var dropboxNightmare = require('../../helpers/nightmare/dropbox');
var evernoteNightmare = require('../../helpers/nightmare/evernote');
// var salesforceNightmare = require('../../helpers/nightmare/salesforce');


describe.long = process.env.LONG ? describe : describe.skip;
it.long = process.env.LONG ? it : it.skip;

var providers = {};

function generateDocuments(expectedDocuments) {
  if(!expectedDocuments) {
    return [];
  }

  return expectedDocuments.split(',');
}

providers.gcontacts = {
  id: '52bff1eec8318cb228000001',
  skip: !(process.env.GOOGLE_EMAIL && process.env.GOOGLE_PASSWORD && process.env.GCONTACTS_EXPECTED_DOCUMENTS),
  workflow: function(nightmare) {
    nightmare
      .use(googleNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(googleNightmare.authorize());
  },
  documents: generateDocuments(process.env.GCONTACTS_EXPECTED_DOCUMENTS)
};

providers.gmail = {
  id: '53047faac8318c2d65000096',
  skip: !(process.env.GOOGLE_EMAIL && process.env.GOOGLE_PASSWORD && process.env.GMAIL_EXPECTED_DOCUMENTS),
  workflow: function(nightmare) {
    nightmare
      .use(googleNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(googleNightmare.authorize());
  },
  documents: generateDocuments(process.env.GMAIL_EXPECTED_DOCUMENTS)
};

providers.gdrive = {
  id: '539ef7289f240405465a2e1f',
  skip: !(process.env.GOOGLE_EMAIL && process.env.GOOGLE_PASSWORD && process.env.GDRIVE_EXPECTED_DOCUMENTS),
  workflow: function(nightmare) {
    nightmare
      .use(googleNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(googleNightmare.authorize());
  },
  documents: generateDocuments(process.env.GDRIVE_EXPECTED_DOCUMENTS)
};

providers.gcalendar = {
  id: '53047faac8318c2d65000099',
  skip: !(process.env.GOOGLE_EMAIL && process.env.GOOGLE_PASSWORD && process.env.GCALENDAR_EXPECTED_DOCUMENTS),
  workflow: function(nightmare) {
    nightmare
      .use(googleNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(googleNightmare.authorize());
  },
  documents: generateDocuments(process.env.GCALENDAR_EXPECTED_DOCUMENTS)
};

providers.dropbox = {
  id: '52bff114c8318c29e9000005',
  skip: !(process.env.GOOGLE_EMAIL && process.env.GOOGLE_PASSWORD && process.env.DROPBOX_EXPECTED_DOCUMENTS),
  workflow: function(nightmare) {
    nightmare
      .use(dropboxNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(dropboxNightmare.authorize());
  },
  documents: generateDocuments(process.env.DROPBOX_EXPECTED_DOCUMENTS)
};

providers.evernote = {
  id: '53047faac8318c2d65000097',
  skip: !(process.env.EVERNOTE_EMAIL && process.env.EVERNOTE_PASSWORD && process.env.EVERNOTE_EXPECTED_DOCUMENTS),
  workflow: function(nightmare) {
    nightmare
      .use(evernoteNightmare.login(process.env.EVERNOTE_EMAIL, process.env.EVERNOTE_PASSWORD))
      .use(evernoteNightmare.authorize());
  },
  documents: generateDocuments(process.env.EVERNOTE_EXPECTED_DOCUMENTS)
};

/*providers.salesforce = {
  id: '53047faac8318c2d65000100',
  skip: !(process.env.SALESFORCE_EMAIL && process.env.SALESFORCE_PASSWORD && process.env.SALESFORCE_EXPECTED_DOCUMENTS),
  workflow: function(nightmare) {
    nightmare
      .use(salesforceNightmare.login(process.env.SALESFORCE_EMAIL, process.env.SALESFORCE_PASSWORD))
      .use(salesforceNightmare.authorize());
  },
  documents: generateDocuments(process.env.SALESFORCE_EXPECTED_DOCUMENTS)
};*/

describe("Test providers", function() {
  var hosts = {};
  Object.keys(env.providers).forEach(function(provider) {
    provider = env.providers[provider];
    hosts[provider] = {
      url: provider,
      expected: 302,
    };
  });

  up.generateDescribe(hosts);

  describe.long("are working", function() {
    Object.keys(providers).forEach(function(name) {
      (providers[name].skip ? describe.skip : describe)(name, function() {
        before(api.getToken);

        var accessToken = null;
        it('should pass OAuth authentication', function(done) {
          this.timeout(30000);

          new Nightmare()
            .viewport(800, 600)
            .use(managerNightmare.connect(providers[name].id))
            .use(providers[name].workflow)
            .wait('.alert')
            .run(done);
        });

        var testToken = it('should be registered on AnyFetch', function(done) {
          function checkExist(tryAgain) {
            async.waterfall([
              function getProviders(cb) {
                api
                  .basicApiRequest('get', '/providers')
                  .end(function(err, res) {
                    cb(err, res ? res.body : []);
                  });
              },
              function checkProviders(accountProviders, cb) {
                var isCreated = accountProviders.some(function(provider) {
                  if(provider.client && provider.client.id === providers[name].id) {
                    accessToken = provider.id;
                    return true;
                  }

                  return false;
                });

                if(!isCreated) {
                  return cb(new Error("No new access token created"));
                }

                cb(null);
              }
            ], function(err) {
              if(err) {
                return tryAgain(err);
              }

              done();
            });
          }

          api.wait(checkExist, testToken.title);
        });

        var testUploadDocuments = (providers[name].documents ? it : it.skip)('should have uploaded all documents', function(done) {
          this.timeout(providers[name].documents.length * 15000 + 25000);

          async.eachLimit(providers[name].documents, 5, function(identifier, cb) {
            function checkExist(tryAgain) {
              api.basicApiRequest('get', '/documents/identifier/' + identifier + '/raw')
                .end(function(err, res) {
                  if(err) {
                    return cb(err);
                  }

                  if(res.statusCode !== 200 && res.statusCode !== 404) {
                    return cb(new Error('Bad status code : ' + res.statusCode));
                  }

                  if(res.statusCode === 404 || res.body.hydrating.length > 0) {
                    return tryAgain(new Error("Bad status code (" + res.statusCode + ") or bad hydrating length"));
                  }

                  cb();
                });
            }

            api.wait(checkExist, testUploadDocuments);
          }, done);
        });

        (providers[name].documents ? it : it.skip)('should have documents available for projections', function(done) {
          // Everything looks great! Let's just check projection is working too
          async.eachLimit(providers[name].documents, 5, function(identifier, cb) {
            api.basicApiRequest('get', '/documents/identifier/' + identifier)
              .end(function(err, res) {
                if(res.statusCode !== 200) {
                  return cb(new Error("Unable to project " + identifier + ", got " + res.statusCode + ": " + res.body.toString()));
                }

                cb(err);
              });
          }, done);
        });

        var testListDocuments = it('should list documents', function(done) {
          // Documents should be available on ES
          function checkExist(tryAgain) {
            api.basicApiRequest('get', '/documents?provider=' + accessToken)
              .end(function(err, res) {
                if(res.statusCode !== 200) {
                  return tryAgain(new Error("Bad status code : " + res.statusCode));
                }

                var documentCount = providers[name].documents ? providers[name].documents.length : 1;
                if(res.body.count < documentCount) {
                  return tryAgain(new Error("Not enough documents, expected " + documentCount + ", have " + res.body.count));
                }

                done(err);
              });
          }

          api.wait(checkExist, testListDocuments.title);
        });

        after(api.reset);
      });
    });
  });
});
