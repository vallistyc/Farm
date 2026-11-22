# Javanese (jv) native review list

Every Javanese string in the app is listed below. Simple ngoko is used on purpose:
short, friendly, and close to everyday farming speech. A native Javanese speaker
should review this file before the iASI demo.

Review focus:

- Farming and price terms feel natural to older farmers (panen, tegal, tanduran, biaya, rega).
- Tone is polite enough (ngoko is fine; avoid heavy krama inggil).
- Currency labels and status words (Aman, Tipis, Rugi) are clear.
- No string is ambiguous when translated back to Indonesian.

Generated from i18n/en.ts and i18n/jv.ts on 2026-11-22. Keys: 296.

## app

| Key | English | Basa Jawa |
| --- | --- | --- |
| `app.name` | Harga Jual Petani | Harga Jual Petani |
| `app.shortName` | Harga Tani | Harga Tani |
| `app.tagline` | Set a fair price from real costs and market prices. | Temtokake rega jual sing adil saka biaya nyata lan rega pasar. |
| `app.version` | Prototype v0.1 | Prototipe v0.1 |

## nav

| Key | English | Basa Jawa |
| --- | --- | --- |
| `nav.mainLabel` | Main navigation | Navigasi utama |
| `nav.home` | Home | Ngarep |
| `nav.farm` | Farm | Tegal |
| `nav.priceRadar` | Price Radar | Radar Rega |
| `nav.community` | Community | Paguyuban |
| `nav.profile` | Profile | Profil |

## common

| Key | English | Basa Jawa |
| --- | --- | --- |
| `common.comingSoon` | Coming soon | Bakal teka |
| `common.sampleData` | Sample data | Data conto |
| `common.loading` | Loading... | Ngamot... |
| `common.back` | Back | Bali |
| `common.cancel` | Cancel | Batal |
| `common.save` | Save | Simpen |
| `common.next` | Next | Terus |
| `common.add` | Add | Tambah |
| `common.remove` | Remove | Busak |
| `common.total` | Total | Total |
| `common.retry` | Try again | Coba maneh |
| `common.perKg` | per kg | saben kg |

## units

| Key | English | Basa Jawa |
| --- | --- | --- |
| `units.kg` | kg | kg |
| `units.hectare` | ha | ha |

## commodities

| Key | English | Basa Jawa |
| --- | --- | --- |
| `commodities.padi` | Rice | Pari |
| `commodities.maize` | Maize | Jagung |
| `commodities.spinach` | Spinach | Bayem |
| `commodities.chilli` | Red chilli | Lombok Abang |
| `commodities.banana` | Banana | Gedhang |

## welcome

| Key | English | Basa Jawa |
| --- | --- | --- |
| `welcome.title` | Choose your language | Pilih basamu |
| `welcome.subtitle` | You can change it later in Profile. | Bisa diganti mengko ing Profil. |
| `welcome.languageLabel` | Language | Basa |
| `welcome.currencyLabel` | Display currency | Dhuwit sing ditampilake |
| `welcome.currencyNote` | All costs are stored in MYR. The currency setting only changes how values are shown. | Kabeh biaya disimpen ing MYR. Setelan dhuwit mung ngganti tampilan. |
| `welcome.continue` | Continue | Terusake |
| `welcome.step` | First launch setup | Persiapan wiwitan |

## login

| Key | English | Basa Jawa |
| --- | --- | --- |
| `login.title` | Log in | Mlebu |
| `login.subtitle` | Use your phone number and 4-digit PIN. | Ngango nomer HP lan PIN 4 angka. |
| `login.phoneLabel` | Phone number | Nomer HP |
| `login.phonePlaceholder` | e.g. 0123456789 | contone: 08123456789 |
| `login.pinLabel` | 4-digit PIN | PIN 4 angka |
| `login.pinPlaceholder` | •••• | •••• |
| `login.submit` | Log in | Mlebu |
| `login.errorPhone` | Enter a valid phone number. | Isi nomer HP sing bener. |
| `login.errorPin` | PIN must be 4 digits. | PIN kudu 4 angka. |
| `login.errorInvalid` | Phone number or PIN is incorrect. | Nomer HP utawa PIN ora bener. |
| `login.demoTitle` | Demo accounts | Akun demo |
| `login.demoHint` | Tap an account to fill in the form. | Pencet akun kanggo ngisi formulir. |
| `login.demoTap` | {phone} · PIN {pin} | {phone} · PIN {pin} |
| `login.footer` | iASI 2026 prototype. For demo use only. | Prototipe iASI 2026. Mung kanggo demo. |

## home

| Key | English | Basa Jawa |
| --- | --- | --- |
| `home.greeting` | Hello, {name} | Sugeng rawuh, {name} |
| `home.subtitle` | Your farm data is ready to use. | Data tegalmu wis siyap digunakake. |
| `home.summaryTitle` | Price summary | Ringkesan rega |
| `home.summaryEmpty` | Your recommended price will appear here after you add a crop and its costs. | Rega sing disaranake bakal katon sawise ngisi tanaman lan biayane. |
| `home.quickTitle` | Quick actions | Tumindak cepet |
| `home.quickCalc` | Calculate price | Etung rega |
| `home.quickCost` | Add cost | Tambah biaya |
| `home.quickMarket` | View market price | Deleng rega pasar |
| `home.demoNote` | Prototype for iASI 2026. Market prices use official PriceCatcher data when available. | Prototipe iASI 2026. Rega pasar nganggo data resmi PriceCatcher yen ana. |
| `home.latestCrop` | Latest crop | Tanaman pungkasan |
| `home.viewRecommendation` | View recommendation | Deleng saran |
| `home.summaryLine` | {commodity} · {status} | {commodity} · {status} |
| `home.recommendedLabel` | Recommended price | Rega sing disaranake |
| `home.askAi` | Ask AI advisor | Takon AI |

## status

| Key | English | Basa Jawa |
| --- | --- | --- |
| `status.aman` | Safe | Aman |
| `status.tipis` | Thin margin | Tipis |
| `status.rugi` | Loss | Rugi |

## farm

| Key | English | Basa Jawa |
| --- | --- | --- |
| `farm.title` | Farm | Tegal |
| `farm.description` | Your fields and crops in one place. | Tegal lan tanamanmu ing sak panggonan. |
| `farm.fieldsTitle` | Fields | Daftar tegal |
| `farm.cropsTitle` | Crops | Tanaman |
| `farm.emptyTitle` | No fields yet | Durung ana tegal |
| `farm.emptyDescription` | Add your first field to start recording crops and costs. | Tambah tegal pisanan kanggo mulai nyathet tanaman lan biaya. |
| `farm.addField` | Add field | Tambah tegal |
| `farm.addCrop` | Add crop | Tambah tanaman |
| `farm.fieldName` | Field name | Jeneng tegal |
| `farm.fieldNamePlaceholder` | e.g. Main paddy field | contone: Sawah Utama |
| `farm.fieldSize` | Field size | Amba tegal |
| `farm.fieldLocation` | Location | Panggonan |
| `farm.fieldLocationPlaceholder` | e.g. Kedah | contone: Kedah |
| `farm.newFieldTitle` | New field | Tegal anyar |
| `farm.newFieldDescription` | Record where you farm. | Cathet panggonan tegalmu. |
| `farm.saveField` | Save field | Simpen tegal |
| `farm.errorFieldName` | Enter a field name. | Isi jeneng tegal. |
| `farm.errorFieldSize` | Enter a field size greater than 0. | Isi amba tegal luwih saka 0. |
| `farm.errorFieldLocation` | Enter a location. | Isi panggonan tegal. |
| `farm.newCropTitle` | New crop | Tanaman anyar |
| `farm.newCropDescription` | Choose the field and commodity. | Pilih tegal lan komoditas. |
| `farm.cropField` | Field | Tegal |
| `farm.cropCommodity` | Commodity | Komoditas |
| `farm.plantingDate` | Planting date | Tanggal tandur |
| `farm.harvestDate` | Expected harvest | Kira-kira panen |
| `farm.saveCrop` | Save and enter costs | Simpen lan isi biaya |
| `farm.selectField` | Choose a field | Pilih tegal |
| `farm.selectCommodity` | Choose a commodity | Pilih komoditas |
| `farm.errorCropField` | Choose a field. | Pilih tegal. |
| `farm.errorCropCommodity` | Choose a commodity. | Pilih komoditas. |
| `farm.errorPlanting` | Enter the planting date. | Isi tanggal tandur. |
| `farm.errorHarvest` | Enter a harvest date after the planting date. | Isi tanggal panen sawise tanggal tandur. |
| `farm.noCropsTitle` | No crops yet | Durung ana tanaman |
| `farm.noCropsDescription` | Add a crop to record costs and get a price. | Tambah tanaman kanggo nyathet biaya lan entuk rega. |
| `farm.sizeValue` | {size} ha | {size} ha |
| `farm.cropMeta` | {field} · Harvest {date} | {field} · Panen {date} |
| `farm.detailTitle` | Crop details | Rincian tanaman |
| `farm.costSummary` | Cost summary | Ringkesan biaya |
| `farm.directCostsLabel` | Direct costs | Biaya langsung |
| `farm.labourCostsLabel` | Labour costs | Biaya tenaga kerja |
| `farm.hiddenCostsLabel` | Hidden costs | Biaya sing ndhelik |
| `farm.totalCost` | Total cost | Total biaya |
| `farm.inputCosts` | Enter costs | Isi biaya |
| `farm.editCosts` | Update costs | Anyari biaya |
| `farm.costsNotEntered` | Costs not entered yet. | Biaya durung diisi. |
| `farm.yieldShort` | Yield | Asil |
| `farm.lossShort` | Loss | Susut |
| `farm.nextStep` | See price recommendation | Deleng saran rega |
| `farm.notFoundTitle` | Crop not found | Tanaman ora ketemu |
| `farm.notFoundDescription` | It may have been removed from this device. | Mungkin wis dibusak saka piranti iki. |
| `farm.backToFarm` | Back to Farm | Bali menyang Tegal |
| `farm.wizard.title` | Enter costs | Isi biaya |
| `farm.wizard.stepOf` | Step {step} of {total} | Langkah {step} saka {total} |
| `farm.wizard.directTitle` | Direct costs | Biaya langsung |
| `farm.wizard.directHint` | Seeds, fertiliser, pesticide, and other materials. | Wiji, pupuk, obat hama, lan bahan liyane. |
| `farm.wizard.labourTitle` | Labour costs | Biaya tenaga kerja |
| `farm.wizard.labourHint` | Workers you pay for planting, spraying, and harvesting. | Buruh sing mbok bayar kanggo tandur, semprot, lan panen. |
| `farm.wizard.hiddenTitle` | Hidden costs | Biaya sing ndhelik |
| `farm.wizard.hiddenHint` | Tap every cost that applies, then enter the amount. | Pencet kabeh biaya sing cocog, banjur isi nominale. |
| `farm.wizard.yieldTitle` | Yield and loss | Asil panen lan susut |
| `farm.wizard.yieldHint` | Estimate how much you will harvest after losses. | Kira-kira asil panen sawise susut. |
| `farm.wizard.addLine` | Add cost | Tambah biaya |
| `farm.wizard.suggestionTitle` | Suggested costs | Biaya sing disaranake |
| `farm.wizard.suggestionHint` | Tap a cost to add it, then enter the amount. | Pencet biaya kanggo nambah, banjur isi nominale. |
| `farm.wizard.lineLabel` | Cost name | Jeneng biaya |
| `farm.wizard.lineAmount` | Amount | Nominal |
| `farm.wizard.lineLabelPlaceholder` | e.g. Seeds | contone: Wiji |
| `farm.wizard.noLines` | No costs added. You can skip this step. | Durung ana biaya. Langkah iki kena dilewati. |
| `farm.wizard.selectedCount` | {count} selected | {count} dipilih |
| `farm.wizard.yieldLabel` | Expected harvest | Kira-kira asil |
| `farm.wizard.lossLabel` | Loss | Susut |
| `farm.wizard.lossHint` | Typical loss is 5-15%. | Susut biasane 5-15%. |
| `farm.wizard.errorYield` | Enter an expected harvest greater than 0. | Isi kira-kira asil luwih saka 0. |
| `farm.wizard.errorLoss` | Loss must be between 0 and 100. | Susut kudu antarane 0 lan 100. |
| `farm.wizard.save` | Save costs | Simpen biaya |
| `farm.wizard.savedNote` | Saved on this device. No data leaves your phone. | Disimpen ing piranti iki. Data ora metu saka HP-mu. |
| `farm.wizard.totalSoFar` | Costs so far: {amount} | Biaya nganti saiki: {amount} |
| `farm.hiddenCosts.transport` | Transport | Angkutan |
| `farm.hiddenCosts.packaging` | Packaging | Kemasan |
| `farm.hiddenCosts.postHarvestLoss` | Post-harvest loss | Susut sawise panen |
| `farm.hiddenCosts.commission` | Middleman commission | Komisi tengkulak |
| `farm.hiddenCosts.storage` | Storage | Panyimpenan |
| `farm.hiddenCosts.irrigation` | Water and electricity | Banyu lan listrik irigasi |
| `farm.hiddenCosts.equipment` | Equipment depreciation | Penyusutan alat |
| `farm.hiddenCosts.loanInterest` | Loan interest | Bunga utang |
| `farm.hiddenCosts.certification` | Certification | Sertifikasi |
| `farm.hiddenCosts.marketFee` | Market fee | Retribusi pasar |
| `farm.hiddenCosts.familyLabour` | Unpaid family labour | Tenaga kerja keluarga (ora dibayar) |
| `farm.hiddenHints.transport` | Taking the harvest to the market, buyer, or warehouse. | Ongkos ngangkut asil menyang pasar, panuku, utawa gudang. |
| `farm.hiddenHints.packaging` | Sacks, crates, ties, and labels. | Karung, krat, iketan, lan label. |
| `farm.hiddenHints.postHarvestLoss` | Spoiled or lost part of the harvest. | Bagian panen sing rusak utawa susut. |
| `farm.hiddenHints.commission` | The middleman's cut. | Potongan tengkulak saka dodolan. |
| `farm.hiddenHints.storage` | Warehouse rent or storage fees. | Sewa gudang utawa biaya nyimpen. |
| `farm.hiddenHints.irrigation` | Water, electricity, and pump fuel. | Banyu, listrik, lan bahan bakar pompa. |
| `farm.hiddenHints.equipment` | Wear on tools, pumps, and machines. | Penyusutan pacul, pompa, lan mesin. |
| `farm.hiddenHints.loanInterest` | Interest on money borrowed for the season. | Bunga utang modal tandur. |
| `farm.hiddenHints.certification` | Certificates or quality tests. | Biaya sertifikat utawa uji mutu. |
| `farm.hiddenHints.marketFee` | Market or stall fees. | Retribusi pasar utawa papan dodolan. |
| `farm.hiddenHints.familyLabour` | Family work you do not pay for. | Kerja keluarga sing ora mbok bayar. |
| `farm.costItems.seeds` | Seeds / seedlings | Wiji / bibit |
| `farm.costItems.fertiliser` | Fertiliser | Pupuk |
| `farm.costItems.compost` | Compost / manure | Pupuk kandang / kompos |
| `farm.costItems.pesticide` | Pesticide | Obat hama |
| `farm.costItems.mulch` | Mulch | Mulsa |
| `farm.costItems.stakes` | Stakes / support | Ajir / penyangga |
| `farm.costItems.lime` | Agricultural lime | Kapur pertanian |
| `farm.costItems.landPrep` | Land preparation | Ngolah lemah |
| `farm.costItems.planting` | Planting | Tandur |
| `farm.costItems.fertilising` | Fertilising | Mupuk |
| `farm.costItems.weeding` | Weeding | Nyiangi |
| `farm.costItems.spraying` | Spraying | Nyemprot |
| `farm.costItems.harvest` | Harvesting | Panen |

## calc

| Key | English | Basa Jawa |
| --- | --- | --- |
| `calc.title` | Price calculator | Kalkulator rega |
| `calc.description` | Check your cost per kg and minimum selling price. | Cek biaya saben kg lan rega jual minimal. |
| `calc.marginLabel` | Profit margin | Margin bathi |
| `calc.marginHint` | Default 10%. Enter 0-100. | Biasane 10%. Isi 0-100. |
| `calc.effectiveYield` | Saleable yield | Asil sing bisa didol |
| `calc.totalCost` | Total cost | Total biaya |
| `calc.costPerUnit` | Cost per kg | Biaya saben kg |
| `calc.minimumPrice` | Minimum price | Rega minimal |
| `calc.marketPrice` | Market price | Rega pasar |
| `calc.recommend` | View recommendation | Deleng saran |
| `calc.errorMargin` | Margin must be between 0 and 100. | Margin kudu antarane 0 lan 100. |
| `calc.resultTitle` | Recommendation | Saran |
| `calc.recommendedPrice` | Recommended price | Rega sing disaranake |
| `calc.comparisonTitle` | Market vs minimum price | Rega pasar vs rega minimal |
| `calc.adviceTitle` | What to do | Sing kudu ditindakake |
| `calc.adviceAman` | The market price covers your costs with a safe margin. You can sell near the market price. | Rega pasar nutup biayamu kanthi margin aman. Kowe bisa ngedol cedhak rega pasar. |
| `calc.adviceTipis` | The market price only just covers your costs. Sell soon and keep costs low. | Rega pasar mung cukup nutup biaya. Enggal edol lan tekan biaya. |
| `calc.adviceRugi` | The market price is below your minimum. Selling now would make a loss. | Rega pasar luwih murah saka minimalmu. Ngedol saiki bakal rugi. |
| `calc.tipHold` | Wait for a better price if you can store the harvest. | Ngenteni rega luwih apik yen asil bisa disimpen. |
| `calc.tipMarket` | Check another market or buyer that pays more. | Cek pasar utawa panuku liya sing mbayar luwih. |
| `calc.tipCost` | Review hidden costs to find savings. | Tliti biaya sing ndhelik kanggo golek penghematan. |
| `calc.askAi` | Ask AI for advice | Takon AI |
| `calc.updateMargin` | Change margin | Ganti margin |
| `calc.backToCrop` | Back to crop | Bali menyang tanaman |

## radar

| Key | English | Basa Jawa |
| --- | --- | --- |
| `radar.title` | Price Radar | Radar Rega |
| `radar.description` | Official market prices from Malaysia and Indonesia. | Rega pasar resmi saka Malaysia lan Indonesia. |
| `radar.malaysiaTitle` | Malaysia | Malaysia |
| `radar.indonesiaTitle` | Indonesia | Indonesia |
| `radar.countryLabel` | Price source | Sumber rega |
| `radar.sampleNote` | Sample data for the demo. Not live market data. | Data conto kanggo demo. Ora rega pasar langsung. |
| `radar.sampleBadge` | Sample data | Data conto |
| `radar.emptyTitle` | No price data yet | Durung ana data rega |
| `radar.emptyDescription` | Commodity prices and trends will be listed here. | Rega lan tren komoditas bakal katon ing kene. |
| `radar.change7d` | 7-day change | Owahan 7 dina |
| `radar.change1d` | since yesterday | wiwit wingi |
| `radar.trendTitle` | 30-day trend | Tren 30 dina |
| `radar.marketNow` | Current market | Rega pasar saiki |
| `radar.yourMinimum` | Your minimum (MSP) | Minimalmu (MSP) |
| `radar.mspHint` | Based on your latest {commodity} crop. | Saka tanaman {commodity} pungkasan. |
| `radar.noMsp` | Add costs for this commodity to compare with your minimum price. | Isi biaya komoditas iki supaya bisa dibandhingake karo rega minimalmu. |
| `radar.viewDetail` | View details | Deleng rincian |
| `radar.backToRadar` | Back to Price Radar | Bali menyang Radar Rega |
| `radar.notFoundTitle` | Commodity not found | Komoditas ora ketemu |
| `radar.notFoundDescription` | Choose another commodity from Price Radar. | Pilih komoditas liya ing Radar Rega. |
| `radar.updated` | Updated {date} | Dianyari {date} |
| `radar.legendPrice` | Market price | Rega pasar |
| `radar.legendMsp` | Your minimum | Minimalmu |
| `radar.liveBadge` | Official data | Data resmi |
| `radar.producerPrice` | Producer price | Rega produsen |
| `radar.unavailableBadge` | Not available | Durung ana |
| `radar.liveNote` | Source: PriceCatcher (KPDN, retail) · observed {date} | Sumber: PriceCatcher (KPDN, retail) · diamati {date} |
| `radar.indonesiaNote` | Source: Panel Harga Bapanas (producer) · observed {date} · shown in Rupiah | Sumber: Panel Harga Bapanas (produsen) · diamati {date} · ditampilake ing Rupiah |
| `radar.indonesiaCoverage` | Bapanas publishes daily prices for padi, maize, and chilli. Spinach and banana are not in this feed, so they appear only under Malaysia. | Bapanas ngetokake rega saben dina kanggo pari, jagung, lan lombok. Bayem lan gedhang ora ana ing sumber iki, dadi mung katon ing bagean Malaysia. |
| `radar.indonesiaUnavailable` | Indonesia prices are unavailable right now. Try again in a few minutes. | Rega Indonesia durung ana saiki. Coba maneh sawetara menit. |
| `radar.seedNote` | No official price feed for this commodity yet. Showing sample data. | Durung ana data rega resmi kanggo komoditas iki. Nampilake data conto. |
| `radar.refreshNote` | Refreshes automatically every minute. | Dianyari otomatis saben menit. |

## ai

| Key | English | Basa Jawa |
| --- | --- | --- |
| `ai.title` | AI advice | Saran AI |
| `ai.subtitle` | Ask about costs, prices, or selling your harvest. | Takon bab biaya, rega, utawa ngedol asil panen. |
| `ai.contextTitle` | Crop context | Konteks tanaman |
| `ai.inputLabel` | Your question | Pitakonmu |
| `ai.placeholder` | Type your question... | Tulis pitakonmu... |
| `ai.send` | Send | Kirim |
| `ai.thinking` | Thinking... | Lagi mikir... |
| `ai.slowNote` | This is taking longer than usual. You can wait or try again. | Iki luwih suwe tinimbang biyasane. Enteni utawa coba maneh. |
| `ai.suggestionsTitle` | Try asking | Coba takon |
| `ai.suggestion1` | Why is my price a loss? | Kenapa regaku rugi? |
| `ai.suggestion2` | How can I reduce costs? | Kepiye nyuda biaya? |
| `ai.suggestion3` | Should I sell now? | Apa luwih becik ngedol saiki? |
| `ai.emptyTitle` | Ask your farming question | Takon bab tetanenmu |
| `ai.emptyDescription` | The advisor uses your crop and cost data. Answers are short and in your language. | Penasihat nganggo data tanaman lan biayamu. Wangsulan cendhak lan miturut basamu. |
| `ai.errorGeneric` | The advisor is unavailable. Check your connection and try again. | Penasihat ora kasedhiya. Cek sambungan banjur coba maneh. |
| `ai.errorNotConfigured` | AI is not configured yet. Add an AI provider key on the server. | AI durung diatur. Tambahake kunci panyedhiya AI ing server. |
| `ai.disclaimer` | AI advice is a guide, not a guarantee. Prototype only. | Saran AI mung pandhuan, dudu jaminan. Mung prototipe. |
| `ai.you` | You | Kowe |
| `ai.advisor` | Advisor | Penasihat |
| `ai.clear` | New chat | Obrolan anyar |

## community

| Key | English | Basa Jawa |
| --- | --- | --- |
| `community.title` | Community | Paguyuban |
| `community.description` | Talk with other farmers by commodity. | Ngobrol karo petani liya miturut komoditas. |
| `community.liveNote` | Messages are saved and shown to every farmer in the room. | Pesen disimpen lan katon kanggo kabeh petani ing kamar iki. |
| `community.missingTable` | Chat is not active yet. Run supabase/schema.sql in the Supabase SQL editor, then reload. | Obrolan durung aktif. Jalanake supabase/schema.sql ing SQL Editor Supabase, banjur muat ulang. |
| `community.roomsTitle` | Rooms | Kamar |
| `community.openRoom` | Open room | Bukak kamar |
| `community.backToRooms` | All rooms | Kabeh kamar |
| `community.emptyTitle` | No messages yet | Durung ana pesen |
| `community.emptyDescription` | Write the first message for this room. | Tulis pesen pisanan ing kamar iki. |
| `community.inputLabel` | Your message | Pesenmu |
| `community.placeholder` | Type a message... | Tulis pesen... |
| `community.send` | Send | Kirim |
| `community.errorLoad` | Could not load messages. Check your connection and try again. | Pesen gagal dimuat. Cek sambungan banjur coba maneh. |
| `community.errorSend` | Message not sent. Try again. | Pesen gagal dikirim. Coba maneh. |
| `community.you` | You | Kowe |
| `community.rooms.padi.name` | Paddy Farmers | Petani Pari |
| `community.rooms.padi.preview` | Paddy prices, fertiliser, and planting schedules. | Rega gabah, pupuk, lan jadwal tandur. |
| `community.rooms.chilli.name` | Red Chilli Growers | Petani Lombok Abang |
| `community.rooms.chilli.preview` | Chilli prices, pests, and harvest news. | Rega lombok, hama, lan kabar panen. |
| `community.rooms.beginners.name` | New Farmers | Petani Anyar |
| `community.rooms.beginners.preview` | Ask about costs, yields, and selling. | Takon bab biaya, asil, lan cara ngedol. |

## profile

| Key | English | Basa Jawa |
| --- | --- | --- |
| `profile.title` | Profile | Profil |
| `profile.accountTitle` | Account | Akun |
| `profile.phone` | Phone | Nomer HP |
| `profile.region` | Region | Wilayah |
| `profile.settingsTitle` | Settings | Setelan |
| `profile.language` | Language | Basa |
| `profile.currency` | Currency | Dhuwit |
| `profile.saved` | Changes are saved automatically. | Owahan disimpen otomatis. |
| `profile.dataTitle` | Your data | Data tanduran |
| `profile.cloudSynced` | Saved to cloud | Wis kesimpen neng internet |
| `profile.cloudSyncing` | Saving to cloud… | Lagi nyimpen neng internet… |
| `profile.cloudLocal` | This phone only | Mung neng HP iki |
| `profile.cloudError` | Cloud save failed — data is safe on this phone | Gagal nyimpen neng internet — data isih aman neng HP iki |
| `profile.cloudHint` | Crop data is kept on this phone and copied to the cloud when there is a connection. | Data tanduran disimpen neng HP iki lan disalin neng internet yen ana sambungan. |
| `profile.demoNote` | Demo account for the iASI 2026 prototype. Do not use with real farm data. | Akun demo kanggo prototipe iASI 2026. Aja nganggo data tegal tenanan. |
| `profile.logout` | Log out | Metu |

## currency

| Key | English | Basa Jawa |
| --- | --- | --- |
| `currency.myr` | Malaysian Ringgit (MYR) | Ringgit Malaysia (MYR) |
| `currency.idr` | Indonesian Rupiah (IDR) | Rupiah Indonesia (IDR) |
| `currency.sgd` | Singapore Dollar (SGD) | Dolar Singapura (SGD) |
| `currency.usd` | US Dollar (USD) | Dolar AS (USD) |

## Key checks

- Missing jv keys: none.
- Extra jv keys not in en: none.
