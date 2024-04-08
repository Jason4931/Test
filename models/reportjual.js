//added lines
let mongoose = require('mongoose');
let reportjual = new mongoose.Schema({
    Harga: Number,
    Nama: String,
    Jumlah: Number,
    Satuan: String,
    Tanggal: Date,
});
module.exports=mongoose.model('reportjual', reportjual);
//end