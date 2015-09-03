var webtask = require('webtask-tools');
var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var logger = require('./logger');

var app = express();
app.use(
    //Log requests
    morgan(':method :url :status :response-time ms - :res[content-length]', { 
        stream: logger.stream 
    })
);

var Ticket;
app.use(function(req, res, next) {    
    if(!Ticket || mongoose.connection.readyState !== 1) {
        //Database not connected
        mongoose.connect(process.env.MONGO_URL ||
                         req.webtaskContext.data.MONGO_URL,
            function(err) {
                if(err) {
                    logger.error(err);
                    res.sendStatus(500);
                    return;
                }
                
                Ticket = mongoose.model('Ticket', {
                    id: Number,
                    status: String,
                    title: String,
                    userInitials: String,
                    assignedTo: String,
                    shortDescription: String,
                    description: String,
                    replies: [{ user: String, message: String }]
                });
                
                next();
            }
        );       
    } else {
        next();
    }    
});

app.get('/tickets', function(req, res, next) {
    Ticket.find({}, function(err, result) {
        if(err) {
            logger.error(err);
            res.sendStatus(500);
            return;
        } 
        res.json(result);
    });
});

//Express to webtask adapter
module.exports = webtask.fromExpress(app);

