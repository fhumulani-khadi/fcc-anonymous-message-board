'use strict';
const { v4: uuidv4 } = require('uuid');

// Global persistent storage engine organized by message board channels
const boardDatabase = {};

module.exports = function (app) {
  
  // ----------------------------------------------------
  // THREADS MANAGEMENT SYSTEM (POST, GET, PUT, DELETE)
  // ----------------------------------------------------
  app.route('/api/threads/:board')
    .post((req, res) => {
      const board = req.params.board;
      const { text, delete_password } = req.body;
      
      if (!boardDatabase[board]) boardDatabase[board] = [];
      
      const now = new Date();
      const newThread = {
        _id: uuidv4(),
        text: text || '',
        created_on: now,
        bumped_on: now,
        reported: false,
        delete_password: delete_password || '',
        replies: []
      };
      
      boardDatabase[board].push(newThread);
      return res.redirect(`/b/${board}/`);
    })
    
    .get((req, res) => {
      const board = req.params.board;
      if (!boardDatabase[board]) return res.json([]);
      
      const threads = boardDatabase[board]
        .sort((a, b) => b.bumped_on - a.bumped_on)
        .slice(0, 10)
        .map(thread => {
          const recentReplies = thread.replies
            .sort((a, b) => b.created_on - a.created_on)
            .slice(0, 3)
            .map(r => ({ _id: r._id, text: r.text, created_on: r.created_on }));
            
          return {
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: recentReplies
          };
        });
        
      return res.json(threads);
    })
    
    .put((req, res) => {
      const board = req.params.board;
      const { thread_id } = req.body;
      
      if (!boardDatabase[board]) return res.send('incorrect thread_id');
      const thread = boardDatabase[board].find(t => t._id === thread_id);
      
      if (!thread) return res.send('incorrect thread_id');
      thread.reported = true;
      return res.send('reported');
    })
    
    .delete((req, res) => {
      const board = req.params.board;
      const { thread_id, delete_password } = req.body;
      
      if (!boardDatabase[board]) return res.send('incorrect password');
      const index = boardDatabase[board].findIndex(t => t._id === thread_id);
      
      if (index === -1) return res.send('incorrect thread_id');
      if (boardDatabase[board][index].delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      
      boardDatabase[board].splice(index, 1);
      return res.send('success');
    });
    
  // ----------------------------------------------------
  // REPLIES MANAGEMENT SYSTEM (POST, GET, PUT, DELETE)
  // ----------------------------------------------------
  app.route('/api/replies/:board')
    .post((req, res) => {
      const board = req.params.board;
      const { text, delete_password, thread_id } = req.body;
      
      if (!boardDatabase[board]) return res.send('incorrect thread_id');
      const thread = boardDatabase[board].find(t => t._id === thread_id);
      
      if (!thread) return res.send('incorrect thread_id');
      
      const now = new Date();
      const newReply = {
        _id: uuidv4(),
        text: text || '',
        created_on: now,
        delete_password: delete_password || '',
        reported: false
      };
      
      thread.bumped_on = now;
      thread.replies.push(newReply);
      
      return res.redirect(`/b/${board}/${thread_id}`);
    })
    
    .get((req, res) => {
      const board = req.params.board;
      const { thread_id } = req.query;
      
      if (!boardDatabase[board]) return res.json({});
      const thread = boardDatabase[board].find(t => t._id === thread_id);
      
      if (!thread) return res.json({});
      
      const cleanReplies = thread.replies.map(r => ({
        _id: r._id,
        text: r.text,
        created_on: r.created_on
      }));
      
      return res.json({
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: cleanReplies
      });
    })
    
    .put((req, res) => {
      const board = req.params.board;
      const { thread_id, reply_id } = req.body;
      
      if (!boardDatabase[board]) return res.send('incorrect ID parameters');
      const thread = boardDatabase[board].find(t => t._id === thread_id);
      
      if (!thread) return res.send('incorrect thread_id');
      const reply = thread.replies.find(r => r._id === reply_id);
      
      if (!reply) return res.send('incorrect reply_id');
      reply.reported = true;
      return res.send('reported');
    })
    
    .delete((req, res) => {
      const board = req.params.board;
      const { thread_id, reply_id, delete_password } = req.body;
      
      if (!boardDatabase[board]) return res.send('incorrect password');
      const thread = boardDatabase[board].find(t => t._id === thread_id);
      
      if (!thread) return res.send('incorrect thread_id');
      const reply = thread.replies.find(r => r._id === reply_id);
      
      if (!reply) return res.send('incorrect reply_id');
      if (reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }
      
      reply.text = '[deleted]';
      return res.send('success');
    });
};
