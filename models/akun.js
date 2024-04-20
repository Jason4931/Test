//added lines
let mongoose = require('mongoose');
let akun = new mongoose.Schema({
    Nama: String,
    Pass: String,
    Role: String
});
module.exports=mongoose.model('akun', akun);
//end