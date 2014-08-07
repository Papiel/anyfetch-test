'use strict';

require('should');
var request = require('supertest');

var up = require('../../helpers/up');
var warmer = require('../../helpers/warmer');
var env = require('../../../config');

// Build a checker-function to compare a reply with a file
var generateCompareFunction = function(file) {
  return function(data) {
    require(file).should.eql(data);
  };
};

var hydraters = {};

hydraters[env.hydraters.plaintext] = {
  payload: {
    file_path: "https://raw2.github.com/AnyFetch/anyfetch-test/cb808057f26562bec2e10975cbe7950a3a6bb6b0/test/hydraters/samples/plaintext.hydrater.anyfetch.com.test.doc",
    long_poll: 1,
    document: {
      document_type: "file",
      metadata: {},
      data: {},
      identifier: 'plaintext-test'
    }
  },
  expected: generateCompareFunction('./samples/plaintext.hydrater.anyfetch.com.expected.json')
};

hydraters[env.hydraters.pdf] = {
  payload: {
    file_path: "https://raw2.github.com/AnyFetch/anyfetch-test/2ac40f1b80fde346ee25b33b51240e2987a10c84/test/hydraters/samples/pdf.hydrater.anyfetch.com.test.pdf",
    long_poll: 1,
    document: {
      document_type: 'document',
      metadata: {
        path: 'pdf.hydrater.anyfetch.com.test.pdf',
        mime_type: 'application/pdf'
      },
      data: {},
      identifier: 'pdf-test'
    }
  },
  expected: function(data) {
    var expected = require('./samples/pdf.hydrater.anyfetch.com.expected.json');
    for(var key in expected) {
      data.should.have.property(key);
      data[key].should.eql(expected[key]);
    }
    data.data.should.have.property('html');
    data.data.html.should.match(/mail est un/);
  }
};

hydraters[env.hydraters.office] = {
  payload: {
    access_token: "123",
    file_path: "https://raw2.github.com/AnyFetch/anyfetch-test/de8030de45a6458205156d87f4f987729c8e7077/test/hydraters/samples/plaintext.hydrater.anyfetch.com.test.docx",
    long_poll: 1,
    document: {
      document_type: 'document',
      metadata: {
        path: 'office.hydrater.anyfetch.com.test.docx'
      },
      data: {},
      identifier: 'office-test'
    }
  }
};

hydraters[env.hydraters.image] = {
  payload: {
    file_path: "https://raw2.github.com/AnyFetch/anyfetch-test/cb808057f26562bec2e10975cbe7950a3a6bb6b0/test/hydraters/samples/image.hydrater.anyfetch.com.test.png",
    long_poll: 1,
    document: {
      document_type: 'file',
      metadata: {
        path: 'image.hydrater.anyfetch.com.test.png',
      },
      data: {},
      identifier: 'image-test'
    }
  },
  expected: function(data) {
    var expected = require('./samples/image.hydrater.anyfetch.com.expected.json');
    for(var key in expected) {
      data.should.have.property(key);
      data[key].should.eql(expected[key]);
    }
    data.data.should.have.property('thumb');
    data.data.should.have.property('display');
    data.data.display.should.containDeep("data:image/jpeg;base64,");
    data.data.thumb.should.containDeep("data:image/png;base64,");
  }
};

hydraters[env.hydraters.ocr] = {
  payload: {
    file_path: "https://raw2.github.com/AnyFetch/anyfetch-test/cb808057f26562bec2e10975cbe7950a3a6bb6b0/test/hydraters/samples/ocr.hydrater.anyfetch.com.test.png",
    long_poll: 1,
    document: {
      document_type: 'image',
      metadata: {
        path: 'ocr.hydrater.anyfetch.com.test.png',
      },
      data: {},
      identifier: 'ocr-test'
    }
  },
  expected: generateCompareFunction('./samples/ocr.hydrater.anyfetch.com.expected.json')
};

hydraters[env.hydraters.eml] = {
  payload: {
    access_token: "123",
    file_path: "https://raw2.github.com/AnyFetch/anyfetch-test/2ac40f1b80fde346ee25b33b51240e2987a10c84/test/hydraters/samples/eml.hydrater.anyfetch.com.test.eml",
    long_poll: 1,
    document: {
      document_type: 'document',
      metadata: {
        path: '/file.eml'
      },
      data: {},
      identifier: 'eml-test'
    }
  },
  expected: generateCompareFunction('./samples/eml.hydrater.anyfetch.com.expected.json')
};

hydraters[env.hydraters.markdown] = {
  payload: {
    file_path: "https://raw2.github.com/AnyFetch/anyfetch-test/25a82595891eba0979ec4d4283e99258dfaeef88/test/hydraters/samples/markdown.hydrater.anyfetch.com.test.md",
    long_poll: 1,
    document: {
      document_type: 'document',
      metadata: {
        path: '/markdown.hydrater.anyfetch.com.test.md',
      },
      data: {},
      identifier: 'markdown-test'
    }
  },
  expected: generateCompareFunction('./samples/markdown.hydrater.anyfetch.com.expected.json')
};

hydraters[env.hydraters.embedmail] = {
  payload: {
    long_poll: 1,
    document: {
      document_type: 'document',
      metadata: {
        text: 'Salut !\n----- forwarded message ------\nDe : buathi_q@epitech.eu....'
      },
      data: {},
      identifier: 'embedmail-test',
      id: 'embedmail-test'
    }
  },
  expected: generateCompareFunction('./samples/embedmail.hydrater.anyfetch.com.expected.json')
};

hydraters[env.hydraters.iptc] = {
  payload: {
    file_path: "https://raw.githubusercontent.com/AnyFetch/anyfetch-test/327eb029b969a820b04868d219c5f797238874b8/test/hydraters/samples/iptc.hydrater.anyfetch.com.test.jpg",
    long_poll: 1,
    document: {
      document_type: 'document',
      metadata: {
        path: '/iptc.hydrater.anyfetch.com.test.jpg',
      },
      data: {},
      identifier: 'iptc-test'
    }
  },
  expected: generateCompareFunction('./samples/iptc.hydrater.anyfetch.com.expected.json')
};

hydraters[env.hydraters.ics] = {
  payload: {}
};

hydraters[env.hydraters.filecleaner] = {
  payload: {}
};


describe("Test hydraters", function() {
  var hosts = {};
  Object.keys(hydraters).forEach(function(url) {
    hosts[url] = {
      url : url + '/status',
      expected: 200
    };
  });
  up.generateDescribe(hosts);

  describe("are working", function() {
    var requests = {};
    Object.keys(hydraters).forEach(function(url) {
      if(!hydraters[url].expected) {
        // Skip hdyraters without expectation
        it("`" + url + "` should hydrate file");
        return;
      }

      requests[url] = request(url)
        .post('/hydrate')
        .send(hydraters[url].payload)
        .expect(200)
        .expect(function(res) {
          hydraters[url].expected(res.body);
        });
    });

    var status = warmer.prepareRequests(requests);

    Object.keys(requests).forEach(function(url) {
      it("`" + url + "` should hydrate file", function(done) {
        warmer.untilChecker(status, url, done);
      });
    });

  });
});
