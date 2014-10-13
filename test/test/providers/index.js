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
var salesforceNightmare = require('../../helpers/nightmare/salesforce');

describe.long = process.env.LONG ? describe : describe.skip;
it.long = process.env.LONG ? it : it.skip;

var providers = {};

providers[env.providers.gcontacts] = {
  id: '52bff1eec8318cb228000001',
  workflow: function (nightmare) {
    nightmare
      .use(googleNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(googleNightmare.authorize());
  },
  documents: [
    'https://mail.google.com/mail/b/test.anyfetch@gmail.com/#contact/6605918b8df97f95'
  ]
};

providers[env.providers.gmail] = {
  id: '53047faac8318c2d65000096',
  workflow: function (nightmare) {
    nightmare
      .use(googleNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(googleNightmare.authorize());
  },
  documents: [
    'https://mail.google.com/mail/b/test.anyfetch@gmail.com/?cm#all/148f5d86b880a36e',
    'https://mail.google.com/mail/b/test.anyfetch@gmail.com/?cm#all/148f5c52fddc1957',
    'https://mail.google.com/mail/b/test.anyfetch@gmail.com/?cm#all/148f946aba4e5c1d',
    'https://mail.google.com/mail/b/test.anyfetch@gmail.com/?cm#all/148f5c52c341a29f',
    'https://mail.google.com/mail/b/test.anyfetch@gmail.com/?cm#all/148f5c52b966e69a'
  ]
};

providers[env.providers.gdrive] = {
  id: '539ef7289f240405465a2e1f',
  workflow: function (nightmare) {
    nightmare
      .use(googleNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(googleNightmare.authorize());
  },
  documents: [
    'https://docs.google.com/file/d/1pP3fjTPp-VBq02Ksbkp_fo7UQkGwP-zMXa01LsZIEXo'
  ]
};

providers[env.providers.gcalendar] = {
  id: '53047faac8318c2d65000099',
  workflow: function (nightmare) {
    nightmare
      .use(googleNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(googleNightmare.authorize());
  },
  documents: [
    'https://www.google.com/calendar/event?eid=dmE5b2UxOGdycGdlZ2l0aGsxM2k4cHVhdDAgdGVzdC5hbnlmZXRjaEBt'
  ]
};

providers[env.providers.dropbox] = {
  id: '52bff114c8318c29e9000005',
  workflow: function (nightmare) {
    nightmare
      .use(dropboxNightmare.login(process.env.GOOGLE_EMAIL, process.env.GOOGLE_PASSWORD))
      .use(dropboxNightmare.authorize());
  },
  documents: [
    'https://dropbox.com/346349689/pi.pdf'
  ]
};

providers[env.providers.evernote] = {
  id: '53047faac8318c2d65000097',
  workflow: function (nightmare) {
    nightmare
      .use(evernoteNightmare.login(process.env.EVERNOTE_EMAIL, process.env.EVERNOTE_PASSWORD))
      .use(evernoteNightmare.authorize());
  },
  documents: [
    'adce01b0-bb6d-4cd3-bcf7-0b1e815fe82f',
    '51312a87-85df-46e2-8e6c-1cc684691ece'
  ]
};

/*providers[env.providers.salesforce] = {
  id: '53047faac8318c2d65000100',
  workflow: function (nightmare) {
    nightmare
      .use(salesforceNightmare.login(process.env.SALESFORCE_EMAIL, process.env.SALESFORCE_PASSWORD))
      .use(salesforceNightmare.authorize());
  },
  documents: [
    // TO-DO
  ]
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
    Object.keys(providers).forEach(function(url) {
      describe(url, function() {
        before(api.getToken);

        it('should pass OAuth authentication', function(done) {
         this.timeout(30000);

         new Nightmare()
            .viewport(800, 600)
            .use(managerNightmare.connect(providers[url].id))
            .use(providers[url].workflow)
            .wait('.alert')
            .run(done);
        });

        it('should be registered on AnyFetch', function(done) {
          async.waterfall([
            function getProviders(cb) {
              api
                .basicApiRequest('get', '/providers')
                .end(function(err, res) {
                  cb(err, res ? res.body : []);
                });
            },
            function checkProviders(accountProviders, cb) {
              if(!accountProviders.some(function(provider) { return provider.client && provider.client.id === providers[url].id; })) {
                console.log(accountProviders);
                return cb(new Error("No new access token created"));
              }
              cb(null);
            }
          ], done);
        });

        describe('should have uploaded all documents', function() {
          if(!providers[url].documents) {
            return;
          }

          providers[url].documents.forEach(function(identifier) {
            it(identifier, function(done) {
              function checkExist(tryAgain) {
                api.basicApiRequest('get', '/documents/identifier/' + encodeURIComponent(identifier) + '/raw')
                  .end(function(err, res) {
                    if(err) {
                      return done(err);
                    }

                    if(res.statusCode !== 200 && res.statusCode !== 404) {
                      return done(new Error('Bad status code : ' + res.statusCode));
                    }

                    if(res.statusCode === 404 || res.body.hydrating.length > 0) {
                      return tryAgain();
                    }

                    done();
                  });
              }

              api.wait(checkExist);
            });
          });
        });

        after(api.reset);
      });
    });
  });
});
