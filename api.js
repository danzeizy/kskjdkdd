const express = require('express');
const QRCode = require('qrcode');
const makeString = require('./src/makeString');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Fee tetap yang langsung diatur di sini
const FIXED_FEE = 300;

app.get('/api/qris', async (req, res) => {
	try {
		const { nominal } = req.query;

		if (!nominal) {
			return res.status(400).json({ error: 'Parameter \"nominal\" is required.' });
		}

		const nominalInt = parseInt(nominal);
		const total = nominalInt + FIXED_FEE;

        // Buat QRIS dengan total (nominal + fee)
		const qrisString = makeString('00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214014199166862150303UMI51440014ID.CO.QRIS.WWW0215ID20243116151060303UMI5204541153033605802ID5920DANZ STORE OK15239806006MALANG61056516762070703A0163040BA8', {
			nominal: total.toString()
		});

		const fileName = `qris-${Date.now()}.png`;
		const filePath = path.join(__dirname, 'public', fileName);

		await QRCode.toFile(filePath, qrisString);

		const imgUrl = `http://localhost:${port}/public/${fileName}`;

		res.json({
			id: "11",
			name: "QRIS Orderkuota",
			type: "QRIS",
			by: 'DanzfyZ',
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

// Middleware untuk akses file statis
app.use('/public', express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
	console.log(`QRIS API is running at http://localhost:${port}`);
});
