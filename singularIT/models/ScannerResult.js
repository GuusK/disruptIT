var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ScannerResult = new mongoose.Schema({
    scanner_user:           { type: Schema.Types.ObjectId, ref: 'ScannerUser',
                              required: true, index: true },
    user:                   { type: Schema.Types.ObjectId, ref: 'User',
                              required: true, index: true },
    comment:                { type: String, required: false }
});

ScannerResult.index({scanner_user: 1, user: 2});

module.exports = mongoose.model('ScannerResult', ScannerResult);
