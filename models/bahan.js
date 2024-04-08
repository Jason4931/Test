//added lines
let mongoose = require('mongoose');
let bahan = new mongoose.Schema({
    Nama: String,
    Jumlah: Number,
    Satuan: String,
});
module.exports=mongoose.model('bahan', bahan);
//end