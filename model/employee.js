const mongoose = require('mongoose')

const employee = mongoose.Schema({
    id:{
        type:Number,
        required: true
    },
    firstname:{
        type:String,
        required: true
    },
    lastname:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required: true
    },
    mobile:{
        type:String,
        required: true
    },
    password:{
        type:String,
        required: true
    }
});

module.exports = mongoose.model("Employee",employee);