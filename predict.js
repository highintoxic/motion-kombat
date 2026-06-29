const tf = require("@tensorflow/tfjs-node");
//require('@tensorflow/tfjs-node');

const express = require("express");
const app = express();
var http = require("http").createServer(app);
const io = require("socket.io")(http);

let connectionsCount = 0;

let model;
const gestureClasses = ["hadoken", "punch", "uppercut"];

console.log("🚀 Starting gesture prediction server...");
console.log("📱 Waiting for mobile device connections...");

(async () => {
	try {
		console.log("🤖 Loading trained model...");
		model = await tf.loadLayersModel("file://model/model.json");
		console.log("✅ Model loaded successfully!");
		console.log(`🎯 Model ready to predict: ${gestureClasses.join(", ")}`);
	} catch (error) {
		console.error("❌ Error loading model:", error.message);
		console.log("💡 Make sure you have trained and saved a model first");
	}
})();

app.get('/predict2', (req, res) => res.redirect('/predict?player=2'));
app.use("/", express.static(__dirname + "/public/desktop"));
app.use("/predict", express.static(__dirname + "/public/mobile"));

io.on("connection", async function (socket) {
	let liveData = [];
	let predictionDone = false;
	let dataPointsReceived = 0;

	connectionsCount++;
	console.log(
		`📱 New device connected! Total connections: ${connectionsCount}`
	);
	console.log(`🔌 Socket ID: ${socket.id}`);

	const playerRole = socket.handshake.query.player === '2' ? '2' : '1';
	console.log('Player role: ' + playerRole);

	socket.on("motion data", function (data) {
		predictionDone = false;
		dataPointsReceived++;

		if (liveData.length < 300) {
			liveData.push(
				data.xAcc,
				data.yAcc,
				data.zAcc,
				data.xGyro,
				data.yGyro,
				data.zGyro
			);

			// Log every 10 data points to avoid spam
			if (dataPointsReceived % 10 === 0) {
				console.log(
					`📊 Collecting motion data... ${liveData.length}/300 points (${dataPointsReceived} total received)`
				);
				console.log(
					`   Latest: Acc(${data.xAcc.toFixed(3)}, ${data.yAcc.toFixed(
						3
					)}, ${data.zAcc.toFixed(3)}) Gyro(${data.xGyro.toFixed(
						3
					)}, ${data.yGyro.toFixed(3)}, ${data.zGyro.toFixed(3)})`
				);
			}
		} else {
			console.log(
				"⚠️  Motion data buffer full (300 points), ignoring additional data"
			);
		}
	});

	socket.on("end motion data", function () {
		console.log("🛑 Motion data collection ended");
		console.log(`📈 Total data points collected: ${liveData.length}`);

		if (!predictionDone && liveData.length) {
			if (liveData.length === 300) {
				console.log("🔮 Starting gesture prediction...");
				predictionDone = true;
				predict(model, liveData, playerRole);
				liveData = [];
				dataPointsReceived = 0;
			} else {
				console.log(
					`⚠️  Insufficient data for prediction (${liveData.length}/300 points needed)`
				);
				console.log(
					"💡 Gesture may have been too short or data collection interrupted"
				);
				liveData = [];
				dataPointsReceived = 0;
			}
		} else if (predictionDone) {
			console.log("⚠️  Prediction already done for this gesture");
		} else {
			console.log("⚠️  No data collected for prediction");
		}
	});

	socket.on("connected", function (data) {
		console.log("✅ Front end connected and ready");
		console.log("📱 Mobile device is now sending motion data");
	});

	socket.on("disconnect", function () {
		connectionsCount--;
		console.log(
			`📱 Device disconnected. Remaining connections: ${connectionsCount}`
		);
		console.log(`🔌 Socket ID: ${socket.id} disconnected`);

		// Reset data for this connection
		liveData = [];
		predictionDone = false;
		dataPointsReceived = 0;
	});
});

const predict = (model, newSampleData, playerRole) => {
	console.log("🧠 Running prediction on collected data...");
	console.log(`📊 Input data shape: ${newSampleData.length} points`);

	tf.tidy(() => {
		const inputData = newSampleData;
		const input = tf.tensor2d([inputData], [1, 300]);

		console.log("🔢 Input tensor created, running model inference...");
		const predictOut = model.predict(input);
		const predictions = predictOut.dataSync();
		const winnerIndex = predictOut.argMax(-1).dataSync()[0];
		const winner = gestureClasses[winnerIndex];
		const confidence = predictions[winnerIndex];

		console.log("🎯 Prediction Results:");
		gestureClasses.forEach((gesture, index) => {
			const conf = predictions[index];
			const isWinner = index === winnerIndex;
			console.log(
				`   ${isWinner ? "🏆" : "  "} ${gesture}: ${(conf * 100).toFixed(2)}%${
					isWinner ? " ← PREDICTED" : ""
				}`
			);
		});

		console.log(
			`🎉 Final prediction: ${winner} (${(confidence * 100).toFixed(
				2
			)}% confidence)`
		);

		// Only emit if confidence is above threshold
		if (confidence > 0.5) {
			console.log(`✅ High confidence prediction, sending gesture: ${winner}`);
			const gestureEvent = playerRole === '2' ? 'p2:gesture' : 'gesture';
			io.emit(gestureEvent, winner);
		} else {
			console.log(
				`⚠️  Low confidence prediction (${(confidence * 100).toFixed(
					2
				)}%), not sending gesture`
			);
			console.log(
				"💡 Consider collecting more training data or improving model"
			);
		}

		switch (winner) {
			case "punch":
				break;
			case "hadoken":
				break;
			case "uppercut":
				break;
			default:
				console.log("❓ Unknown gesture predicted");
				break;
		}
	});
};

const PORT = process.env.PORT || 4000;
http.listen(PORT);

console.log(`🌐 Server running on port ${PORT}`);
console.log(`📱 Mobile interface: http://localhost:${PORT}/predict`);
console.log(`📱 Player 2 mobile interface: http://localhost:${PORT}/predict2`);
console.log(`🖥️  Desktop interface: http://localhost:${PORT}/`);
console.log("⏳ Waiting for connections...");
