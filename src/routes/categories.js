const { Router } = require('express');
const router = Router();
const jwt = require('jsonwebtoken');
const db = require('../database/mySqlConnection');