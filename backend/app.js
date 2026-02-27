var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var { Sequelize } = require("sequelize");

// 데이터베이스 연결
var connection = new Sequelize("clim","root","0000",{
    host:"localhost",
    dialect:"mysql"
});

// 모델 정의
var define = require("./model.js");
define(connection);

// 세션 설정
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const options = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '0000',
    database: 'clim'
};
const sessionStore = new MySQLStore(options);

// 라우터 import
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var gymsRouter = require('./routes/gyms.js');
var postsRouter = require('./routes/posts.js');
var recommendationsRouter = require('./routes/recommendations.js'); // 🤖 새로 추가!

var app = express();

// 세션 미들웨어
app.use(session({
    key: 'login_session_id',
    secret: 'mjcmjc@@##44',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// 기본 미들웨어
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 라우터 설정 - Vue에서 호출하는 경로와 일치시키기
app.use('/', indexRouter);
app.use('/api/user', usersRouter);
app.use('/api/gyms', gymsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/recommendations', recommendationsRouter); // 🤖 추천 API 라우터 추가!

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;