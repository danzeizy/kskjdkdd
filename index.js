const express = require('express');
const QRCode = require('qrcode');
const makeString = require('./makeString');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware untuk parsing JSON dan melayani file statis
app.use(express.json());
app.use(express.static(path.join(__dirname, 'danz')));
app.use('/danz', express.static(path.join(__dirname, 'danz')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// File konfigurasi untuk menyimpan QR string dan fee
const configFilePath = path.join(__dirname, 'config.json');

// ✅ Serve Admin Panel di '/'
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'danz', 'index.html'));
});

// ✅ Endpoint untuk menyimpan konfigurasi dari form Admin Panel
app.post('/api/config', (req, res) => {
	const { qrString, fee } = req.body;

	if (!qrString || !fee) {
		return res.status(400).json({ message: 'QR Code String dan Fee wajib diisi.' });
	}

	const configData = { qrString, fee: parseInt(fee) };
	fs.writeFileSync(configFilePath, JSON.stringify(configData, null, 2));

	res.json({ message: 'Konfigurasi berhasil disimpan.' });
});

// ✅ Endpoint untuk generate QRIS dan respons dalam format JSON
app.get('/api/qris', async (req, res) => {
	try {
		const { nominal } = req.query;

		if (!nominal) {
			return res.status(400).json({ error: 'Parameter "nominal" is required.' });
		}

		if (!fs.existsSync(configFilePath)) {
			return res.status(400).json({ error: 'Konfigurasi belum diatur.' });
		}

        // Ambil data konfigurasi dari file
		const { qrString, fee } = JSON.parse(fs.readFileSync(configFilePath));
		const nominalInt = parseInt(nominal);
		const total = nominalInt + parseInt(fee);

        // Buat QRIS dengan total (nominal + fee)
		const qrisString = makeString(qrString, {
			nominal: total.toString()
		});

		const fileName = `qris-${Date.now()}.png`;
		const filePath = path.join(__dirname, 'public', fileName);

		await QRCode.toFile(filePath, qrisString);

        // Jadwalkan penghapusan file setelah 2 jam (7200000 ms)
		setTimeout(() => {
			fs.unlink(filePath, (err) => {
				if (err) {
					console.error(`Gagal menghapus file ${fileName}:`, err.message);
				} else {
					console.log(`File ${fileName} berhasil dihapus setelah 2 jam.`);
				}
			});
        }, 2 * 60 * 60 * 1000); // 2 jam dalam milidetik

		const imgUrl = `http://localhost:${port}/public/${fileName}`;

		res.json({
			id: "11",
			name: "QRIS Orderkuota",
			type: "QRIS",
			by: "DanzfyZ",
			minimum: "1000",
			maximum: "20000000",
			total: total,
			original_nominal: nominalInt,
			settlement: "86400",
			img: imgUrl,
			status: "ON"
		});

	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.listen(port, () => {
	console.log(`Server berjalan di http://localhost:${port}`);
});
