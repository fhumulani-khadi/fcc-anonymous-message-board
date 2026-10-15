const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(5000);

  suite('API Routing for Threads Channel', function() {
    let testThreadId;
    const testDeletePassword = 'password123';

    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/testboard')
        .send({ text: 'Hello World Thread', delete_password: testDeletePassword })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
      chai.request(server)
        .get('/api/threads/testboard')
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          if (res.body.length > 0) {
            testThreadId = res.body[0]._id;
            assert.property(res.body[0], '_id');
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.isArray(res.body[0].replies);
            assert.notProperty(res.body[0], 'delete_password');
            assert.notProperty(res.body[0], 'reported');
          }
          done();
        });
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
      chai.request(server)
        .put('/api/threads/testboard')
        .send({ thread_id: testThreadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
      chai.request(server)
        .delete('/api/threads/testboard')
        .send({ thread_id: testThreadId, delete_password: 'wrong_password' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
      chai.request(server)
        .delete('/api/threads/testboard')
        .send({ thread_id: testThreadId, delete_password: testDeletePassword })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });

  suite('API Routing for Replies Channel', function() {
    let threadId;
    let replyId;
    const pwd = 'reply123';

    before(function(done) {
      chai.request(server)
        .post('/api/threads/replyboard')
        .send({ text: 'Thread for Replies test', delete_password: 'pwd' })
        .end(function() {
          chai.request(server)
            .get('/api/threads/replyboard')
            .end(function(err, res) {
              threadId = res.body[0]._id;
              done();
            });
        });
    });

    test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post('/api/replies/replyboard')
        .send({ thread_id: threadId, text: 'This is a test reply', delete_password: pwd })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
      chai.request(server)
        .get('/api/replies/replyboard')
        .query({ thread_id: threadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.equal(res.body._id, threadId);
          assert.isArray(res.body.replies);
          assert.isAtLeast(res.body.replies.length, 1);
          replyId = res.body.replies[0]._id;
          assert.notProperty(res.body.replies[0], 'delete_password');
          assert.notProperty(res.body.replies[0], 'reported');
          done();
        });
    });

    test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
      chai.request(server)
        .put('/api/replies/replyboard')
        .send({ thread_id: threadId, reply_id: replyId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
      chai.request(server)
        .delete('/api/replies/replyboard')
        .send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrong' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
      chai.request(server)
        .delete('/api/replies/replyboard')
        .send({ thread_id: threadId, reply_id: replyId, delete_password: pwd })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });
});
