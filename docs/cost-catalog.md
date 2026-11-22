# Katalog biaya (RAG ringkas)

Dokumen ini mencatat dasar penyusunan daftar biaya di wizard "Masukkan biaya".
Katalog dipakai sebagai **saran** saat petani mengisi biaya; nominal tetap milik
petani dan tidak ada angka yang di-hardcode.

## Metode

1. Kumpulkan studi biaya usahatani dan laporan industri untuk tiap komoditas
   (padi, jagung, bayam, cabai, pisang).
2. Ambil komponen biaya yang berulang di sumber: saprodi, tenaga kerja, dan
   biaya di luar input produksi.
3. Petakan ke tiga kelompok aplikasi:
   - **Direct** = saprodi dan bahan habis pakai.
   - **Labour** = upah kerja per tahap.
   - **Hidden** = biaya yang sering lupa dicatat (transport, kemasan, susut,
     komisi, penyimpanan, irigasi, penyusutan, bunga, sertifikasi, retribusi,
     kerja keluarga).
4. Hanya komponen yang muncul di sumber yang dimasukkan ke daftar saran
   per komoditas.

Katalog kode: `lib/cost-catalog.ts`. Label dan penjelasan ada di kamus i18n
(`farm.costItems`, `farm.hiddenHints`).

## Saran biaya langsung per komoditas

| Komoditas | Saran |
| --- | --- |
| Padi | Benih, pupuk, pestisida, kapur pertanian |
| Jagung | Benih, pupuk, pestisida |
| Bayam | Benih, pupuk kandang/kompos, pupuk, pestisida |
| Cabai | Benih, pupuk, kompos, pestisida, mulsa, ajir |
| Pisang | Bibit, kompos, pupuk, pestisida, ajir |

## Saran biaya tenaga kerja

Olah tanah, tanam, pemupukan, penyiangan, penyemprotan, panen.

## Biaya tersembunyi dan definisinya

| Biaya | Definisi |
| --- | --- |
| Transportasi | Angkut hasil ke pasar, pembeli, atau gudang. |
| Kemasan | Karung, krat, ikatan, label. |
| Susut pascapanen | Bagian panen yang rusak atau hilang. |
| Komisi tengkulak | Potongan perantara dari penjualan. |
| Penyimpanan | Sewa gudang atau biaya simpan. |
| Air dan listrik | Air, listrik, dan bahan bakar pompa. |
| Penyusutan alat | Keausan cangkul, pompa, dan mesin. |
| Bunga pinjaman | Bunga modal tanam. |
| Sertifikasi | Sertifikat atau uji mutu. |
| Retribusi pasar | Biaya pasar atau tempat jualan. |
| Kerja keluarga | Kerja keluarga yang tidak dibayar. |

## Sumber

- Malaysia Competition Commission, *Laporan Industri Padi dan Beras di
  Malaysia* — struktur kos operasi padi: benih, baja, racun, pengangkutan,
  jentera, sewa tanah, tenaga kerja.
  https://www.mycc.gov.my/sites/default/files/pdf/newsroom/MyCC_Laporan%20Industri%20Padi%20dan%20Beras%20di%20Malaysia_%28BM%29.pdf
- RTM, "Pelbagai bentuk subsidi dan insentif, bantu pesawah tangani kos
  pertanian" (2026) — subsidi input padi: benih, baja, racun, upah membajak.
  https://berita.rtm.gov.my/nasional/senarai-berita-nasional/senarai-artikel/pelbagai-bentuk-subsidi-dan-insentif-bantu-pesawah-tangani-kos-pertanian/
- Jurnal Agrimics (2025), analisis biaya usahatani cabai merah keriting —
  pupuk, pestisida, tenaga kerja.
  https://journal.sativapublishing.org/index.php/aj/article/download/41/23
- Program Studi Agribisnis UNRAM, *Analisis Biaya dan Pendapatan Usahatani
  Cabai Merah Keriting* — benih, pupuk, pestisida, tenaga kerja dalam dan luar
  keluarga, mulsa.
  https://eprints.unram.ac.id/46601/2/J_Masdeli%20Kartikasari_Analisis%20Biaya%20dan%20Pendapatan%20Usahatani%20Cabai%20Merah%20Keriting%20Binaan%20Yayasan.pdf
- Fakultas Pertanian UNG (2018), usahatani jagung — benih, pupuk, pestisida,
  tenaga kerja.
  https://ejurnal.ung.ac.id/index.php/AGR/article/viewFile/9708/2569
- Repository UB, *Analisis Efisiensi Biaya dan Keuntungan pada Usahatani
  Jagung* — benih, pupuk anorganik dan organik, pestisida, upah.
  https://repository.ub.ac.id/128907/1/SKRIPSI1.pdf
- Jurnal Agrides ULM, *Analisis Usahatani Bayam* — benih, pupuk, pestisida,
  tenaga kerja, penyusutan alat, perlengkapan, lahan.
  https://ppjp.ulm.ac.id/journal/index.php/agrides/article/download/24772/pdf
- Jurnal Agricultural Review UNISAN (2025), biaya produksi pisang — bibit,
  pupuk, pestisida, upah, air/irigasi, transportasi hasil, alat habis pakai.
  https://ejurnal.unisan.ac.id/index.php/arview/article/download/1661/510/5689
- Jurnal SEA UPR, *Analisis Usahatani Pisang Kepok* — benih, pupuk, pestisida,
  upah.
  https://e-journal.upr.ac.id/index.php/j-sea/article/download/480/431

## Batasan

- Studi di atas berasal dari lokasi dan tahun berbeda; nominalnya tidak bisa
  dipakai langsung untuk semua petani.
- Katalog ini hanya mengingatkan jenis biaya, bukan mengisi angka.
- Harga saprodi dan upah berubah; petani tetap memasukkan nominal aktual.
