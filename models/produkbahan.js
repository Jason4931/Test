//added lines
let mongoose = require('mongoose');
let produkbahan = new mongoose.Schema({
    Produk: String,
    Bahan: String,
    Jumlah: Number,
    Satuan: String,
});
module.exports=mongoose.model('produkbahan', produkbahan);
//end