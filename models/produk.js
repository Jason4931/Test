//added lines
let mongoose = require('mongoose');
let produk = new mongoose.Schema({
    Nama: String,
    Harga: Number,
    Kategori: String,
});
module.exports=mongoose.model('produk', produk);
//end