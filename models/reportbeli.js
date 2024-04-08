//added lines
let mongoose = require('mongoose');
let reportbeli = new mongoose.Schema({
    Harga: Number,
    Nama: String,
    Jumlah: Number,
    Satuan: String,
    Tanggal: Date,
});
module.exports=mongoose.model('reportbeli', reportbeli);
//end