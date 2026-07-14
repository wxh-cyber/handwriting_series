const express = require('express');

const { createSession, getSessionById, listSessions } = require('../services/sessions');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    sessions: listSessions(),
  });
});

router.post('/', (req, res) => {
  const session = createSession();

  res.status(201).json({
    session,
  });
});

router.get('/:id', (req, res) => {
  const session = getSessionById(req.params.id);

  if (!session) {
    res.status(404).json({
      error: '会话不存在',
    });
    return;
  }

  res.json({
    session,
  });
});

module.exports = router;
