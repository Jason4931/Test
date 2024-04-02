var express = require('express');
var router = express.Router();

let produk = require('../models/produk.js');
let bahan = require('../models/bahan.js');
let produkbahan = require('../models/produkbahan.js');
let reportbeli = require('../models/reportbeli.js');
let reportjual = require('../models/reportjual.js');

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render('index');
});
router.get('/produk', async function(req, res, next) {
  res.render('produk', { produk: await produk.find(), produkbahan: await produkbahan.find(), bahan: await bahan.find() });
});
router.get('/bahan', async function(req, res, next) {
  res.render('bahan', { bahan: await bahan.find() });
});
router.get('/jual', async function (req, res, next) {
  let today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  today = yyyy + '-' + mm + '-' + dd;
  res.render('jual', { produk: await produk.find(), today: today, err: "" });
});
router.get('/jual/err', async function (req, res, next) {
  let today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  today = yyyy + '-' + mm + '-' + dd;
  res.render('jual', { produk: await produk.find(), today: today, err: "Bahan Tidak Mencukupi!" });
});
router.get('/beli', async function (req, res, next) {
  let today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  today = yyyy + '-' + mm + '-' + dd;
  res.render('beli', { bahan: await bahan.find(), today: today });
});
router.get('/laporan/n', async function(req, res, next) {
  let reportbelis;
  let reportjuals;
  let reportb;
  let reportj;
  // let perubahan;
  let bahanp;
  let today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  today = yyyy + '-' + mm + '-' + dd;
  reportbelis = await reportbeli.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(today) } },
          { Tanggal: { $lte: new Date(today) } }
        ]
      }
    }
  ]);
  reportjuals = await reportjual.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(today) } },
          { Tanggal: { $lte: new Date(today) } }
        ]
      }
    }
  ]);
  reportb = await reportbeli.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(today) } },
          { Tanggal: { $lte: new Date(today) } }
        ]
      }
    },
    {
      $group: {
        _id: "$Nama",
        nama: { $first: "$Nama" },
        harga: { $sum: { $multiply: ["$Harga", "$Jumlah"] } },
        jumlah: { $sum: "$Jumlah" }
      }
    }
  ]);
  reportj = await reportjual.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(today) } },
          { Tanggal: { $lte: new Date(today) } }
        ]
      }
    },
    {
      $group: {
        _id: "$Nama",
        nama: { $first: "$Nama" },
        harga: { $sum: { $multiply: ["$Harga", "$Jumlah"] } },
        jumlah: { $sum: "$Jumlah" }
      }
    }
  ]);
  let sisajual = await reportjual.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(today) } },
          { Tanggal: { $lte: new Date(today) } }
        ]
      }
    },
    { $group:
      {
        _id : "$Nama",
        sum : { $sum: "$Jumlah" },
        Nama: { $first: "$Nama" }
      }
    },
    { $lookup:
      {
        from: 'produks',
        localField: 'Nama',
        foreignField: 'Nama',
        as: 'produkJual'
      }
    },
    { $lookup:
      {
        from: 'produkbahans',
        localField: 'produkJual.Nama',
        foreignField: 'Produk',
        as: 'jumlahBahan'
      }
    }
  ]);
  let sisabeli = await reportbeli.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(today) } },
          { Tanggal: { $lte: new Date(today) } }
        ]
      }
    },
    {
      $group:
      {
        _id: "$Nama",
        sum: { $sum: "$Jumlah" }
      }
    }
  ]);
  bahanp = await bahan.find();
  for (let i = 0; i < bahanp.length; i++) {
    if (sisabeli[i] != undefined) {
      bahanp[i].sisabeli = sisabeli[i].sum;
    } else {
      bahanp[i].sisabeli = 0;
    }
    if (sisajual[i] != undefined) {
      sisajual.forEach((sisajuals) => {
        sisajuals.jumlahBahan.forEach((jumlahBahan) => {
          if (bahanp[i].Nama == jumlahBahan.Bahan) {
            if (bahanp[i].sisajual == undefined) {
              bahanp[i].sisajual = 0;
            }
            bahanp[i].sisajual += jumlahBahan.Jumlah * sisajual[i].sum;
          }
        });
      });
    } else {
      bahanp[i].sisajual = 0;
    }
  }
  // perubahan = await reportjual.find();
  //DB::select("SELECT nama, sum(jumlah) as jumlah FROM ( SELECT nama, sum(jumlah) as jumlah FROM `reportbelis`
  //WHERE created_at>='date(Y-m-d)' AND created_at<='$date' GROUP BY nama UNION ALL SELECT stocks.nama,
  //sum(product_bahans.jumlah*reportjuals.jumlah)*-1 as jumlah FROM `product_bahans` INNER JOIN products on
  //product_bahans.produk=products.id INNER JOIN stocks on product_bahans.bahan=stocks.id INNER JOIN
  //reportjuals on reportjuals.nama=products.nama WHERE reportjuals.created_at>='date(Y-m-d)' AND
  //reportjuals.created_at<='$date' GROUP BY stocks.nama ) as report GROUP BY nama")
  res.render('laporan', { reportjual: reportjuals, reportbeli: reportbelis, datenow: today, reportb: reportb, reportj: reportj, bahan: bahanp, state: "n" });
});
router.post('/laporan/p', async function(req, res, next) {
  let start = req.body.start;
  let end = req.body.end;
  let reportbelis;
  let reportjuals;
  let reportb;
  let reportj;
  // let perubahan;
  let bahanp;
  let today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  today = yyyy + '-' + mm + '-' + dd;
  reportbelis = await reportbeli.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  reportjuals = await reportjual.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  reportb = await reportbeli.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    {
      $group: {
        _id: "$Nama",
        nama: { $first: "$Nama" },
        harga: { $sum: { $multiply: ["$Harga", "$Jumlah"] } },
        jumlah: { $sum: "$Jumlah" }
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  reportj = await reportjual.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    {
      $group: {
        _id: "$Nama",
        nama: { $first: "$Nama" },
        harga: { $sum: { $multiply: ["$Harga", "$Jumlah"] } },
        jumlah: { $sum: "$Jumlah" }
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  let sisajual = await reportjual.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    { $group:
      {
        _id : "$Nama",
        sum : { $sum: "$Jumlah" },
        Nama: { $first: "$Nama" }
      }
    },
    { $lookup:
      {
        from: 'produks',
        localField: 'Nama',
        foreignField: 'Nama',
        as: 'produkJual'
      }
    },
    { $lookup:
      {
        from: 'produkbahans',
        localField: 'produkJual.Nama',
        foreignField: 'Produk',
        as: 'jumlahBahan'
      }
    },
    { $sort : { Tanggal : 1 } }
  ]);
  let sisabeli = await reportbeli.aggregate([
    {
      $match:
      {
        $and: [
          { Tanggal: { $gte: new Date(req.body.start) } },
          { Tanggal: { $lte: new Date(req.body.end) } }
        ]
      }
    },
    {
      $group:
      {
        _id: "$Nama",
        sum: { $sum: "$Jumlah" }
      }
    },
    { $sort: { Tanggal: 1 } }
  ]);
  bahanp = await bahan.find();
  for (let i = 0; i < bahanp.length; i++) {
    if (sisabeli[i] != undefined) {
      bahanp[i].sisabeli = sisabeli[i].sum;
    } else {
      bahanp[i].sisabeli = 0;
    }
    if (sisajual[i] != undefined) {
      sisajual.forEach((sisajuals) => {
        sisajuals.jumlahBahan.forEach((jumlahBahan) => {
          if (bahanp[i].Nama == jumlahBahan.Bahan) {
            if (bahanp[i].sisajual == undefined) {
              bahanp[i].sisajual = 0;
            }
            bahanp[i].sisajual += jumlahBahan.Jumlah * sisajual[i].sum;
          }
        });
      });
    } else {
      bahanp[i].sisajual = 0;
    }
  }
  // perubahan = await reportjual.find();
  res.render('laporan', { reportjual: reportjuals, reportbeli: reportbelis, datenow: today, start: start, end: end, reportb: reportb, reportj: reportj, bahan: bahanp, state: "p" });
});
router.post('/create/:for', async function(req, res, next) {
  try {
    if(req.params.for == "bahan") {
      new bahan({
        Nama: req.body.nama,
        Jumlah: req.body.jumlah,
        Satuan: req.body.satuan
      }).save();
    } else if(req.params.for == "produk") {
      new produk({
        Nama: req.body.nama,
        Harga: req.body.harga,
        Kategori: req.body.kategori
      }).save();
    } else if(req.params.for == "produkbahan") {
      let bbahan = await bahan.find({ Nama: req.body.bahan });
      req.body.satuan = bbahan[0].Satuan;
      new produkbahan({
        Produk: req.body.produk,
        Bahan: req.body.bahan,
        Jumlah: req.body.jumlah,
        Satuan: req.body.satuan
      }).save();
      req.params.for = "produk";
    }
    res.redirect('/'+req.params.for);
  } catch(error) {
    return next(error);
  }
});
router.post('/update/:for', async function(req, res, next) {
  try {
    if(req.params.for == "bahan") {
      await bahan.findByIdAndUpdate(req.body._id, {
        Nama: req.body.nama,
        Jumlah: req.body.jumlah,
        Satuan: req.body.satuan
      });
    } else if(req.params.for == "produk") {
      await produk.findByIdAndUpdate(req.body._id, {
        Nama: req.body.nama,
        Harga: req.body.harga,
        Kategori: req.body.kategori
      });
    } else if(req.params.for == "produkbahan") {
      let bbahan = await bahan.find({ Nama: req.body.bahan });
      req.body.satuan = bbahan[0].Satuan;
      await produkbahan.findByIdAndUpdate(req.body._id, {
        Produk: req.body.produk,
        Bahan: req.body.bahan,
        Jumlah: req.body.jumlah,
        Satuan: req.body.satuan
      });
      req.params.for = "produk";
    }
    res.redirect('/'+req.params.for);
  } catch(error) {
    return next(error);
  }
});
router.get('/delete/:for/:id', async function(req, res, next) {
  try {
    if(req.params.for == "bahan") {
      await bahan.findByIdAndDelete(req.params.id);
    } else if(req.params.for == "produk") {
      await produk.findByIdAndDelete(req.params.id);
    } else if(req.params.for == "produkbahan") {
      await produkbahan.findByIdAndDelete(req.params.id);
      req.params.for = "produk";
    }
    res.redirect('/'+req.params.for);
  } catch(error) {
    return next(error);
  }
});
async function min(nama, angka) {
  let Bahan = await bahan.find({ Nama: nama });
  angka = Number(angka);
  let PJumlah = Bahan[0].Jumlah - angka;
  if(PJumlah < 0) {
    return true;
  } else {
    await bahan.findOneAndUpdate({Nama: nama}, {
      Jumlah: PJumlah
    });
    return false;
  }
}
async function plus(nama, angka) {
  let Bahan = await bahan.find({ Nama: nama });
  angka = Number(angka);
  let PJumlah = Bahan[0].Jumlah + angka;
  await bahan.findOneAndUpdate({Nama: nama}, {
    Jumlah: PJumlah
  });
}
router.post('/processjual', async function(req, res, next) {
  try {
    let jproduk = await produk.find({ Nama: req.body.nama });
    jproduk[0].Kategori == "Makanan" ? req.body.satuan = "Piring" : req.body.satuan = "Gelas";
    req.body.harga == "" ? req.body.harga = jproduk[0].Harga : null;
    let check = true;
    let jprodukbahan = await produkbahan.find({ Produk: req.body.nama });
    await jprodukbahan.forEach(function(jprodukbahan) {
      let angka = req.body.jumlah * jprodukbahan.Jumlah;
      min(jprodukbahan.Bahan, angka).then(bool => {
        if(bool) {
          check = false;
        }
      });
    });
    setTimeout(() => {
      if(check) {
        new reportjual({
          Nama: req.body.nama,
          Jumlah: req.body.jumlah,
          Harga: req.body.harga,
          Satuan: req.body.satuan,
          Tanggal: req.body.tanggal
        }).save();
        res.redirect('/jual');
      } else {
        jprodukbahan.forEach(function(jprodukbahan) {
          plus(jprodukbahan.Bahan, req.body.jumlah * jprodukbahan.Jumlah);
        });
        res.redirect('/jual/err');
      }
    }, 100);
  } catch(error) {
    return next(error);
  }
});
router.post('/processbeli', async function(req, res, next) {
  try {
    let bbahan = await bahan.find({ Nama: req.body.nama });
    req.body.satuan = bbahan[0].Satuan;
    plus(req.body.nama, req.body.jumlah);
    new reportbeli({
      Nama: req.body.nama,
      Jumlah: req.body.jumlah,
      Harga: req.body.harga,
      Satuan: req.body.satuan,
      Tanggal: req.body.tanggal
    }).save();
    res.redirect('/beli');
  } catch(error) {
    return next(error);
  }
});
router.get('/renderp', async function(req, res, next) {
  res.json(
    await produk.find()
  );
});
router.get('/renderb', async function(req, res, next) {
  res.json(
    await bahan.find()
  );
});

module.exports = router;