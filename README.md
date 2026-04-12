# HCI Gesture Recognition System

A real-time gesture recognition system built with Node.js, Socket.IO, and TensorFlow.js. This project allows you to collect motion data (accelerometer and gyroscope) from a mobile device or hardware sensor, train a deep learning model to recognize specific gestures, and run real-time predictions. 

By default, the system is calibrated to recognize three combat-style gestures:
- `hadoken`
- `punch`
- `uppercut`

## Tech Stack
- **Backend Server**: Node.js, Express
- **Real-time Communication**: Socket.IO
- **Machine Learning**: TensorFlow.js (`@tensorflow/tfjs-node`)
- **Hardware Integration (Optional)**: Arduino (MPU6050 Accelerometer & Gyroscope)

---

## Project Structure

- **`predict.js`**: Reat-time prediction server that loads the trained model, connects to a mobile via WebSockets, collects motion sensor data, and classifies the gestures in real-time.
- **`record.js`**: Data collection server. Listens to WebSocket streams of motion data to capture raw sensor readings and store them in the database for future training.
- **`train.js`**: The TensorFlow.js training pipeline. Reads locally saved motion data samples, processes them into tensors, and trains a Sequential, multi-class neural network. Saves the output model.
- **`public/`**: Contains the frontend interfaces for both `mobile` (motion data sender) and `desktop` (dashboard/recipient).
- **`data/game/`**: The local storage directory where `record.js` writes training gesture samples.
- **`arduino/mpu6050dmp.ino`**: Arduino sketch to interface with an MPU6050 sensor, capturing Yaw-Pitch-Roll data (for hardware-based alternatives).

---

## Installation

Ensure you have Node.js (version 20+ recommended) and `pnpm` (or `npm`) installed.

1. Clone this repository.
2. Install the necessary dependencies:

```bash
npm install
# or
pnpm install
```

---

## Usage Guide

The workflow relies on three core steps: **Record -> Train -> Predict**.

### 1. Data Recording

To collect training samples for a gesture, start the `record.js` application. It expects the gesture type and a sample index as command-line arguments.

```bash
# Usage: node record.js <gestureType> <sampleNumber>
node record.js punch 1
```
Send the data from your mobile interface. It will save 50 rows of motion data points (6 coordinates: Ax, Ay, Az, Gx, Gy, Gz) into `data/game/sample_punch_1.txt`. 

### 2. Model Training

Once you have recorded a sufficient number of samples across all gesture classes (e.g., 21 samples per gesture for all 3 classes), you can train the model. 

```bash
node train.js
```
The script will shuffle the data, generate tensors, apply Adam optimization to a two-layer Dense Network, output metrics indicating training accuracy, and finally save the completed model architecture and weights to the `model/` directory locally.

### 3. Real-Time Prediction Server

Launch the real-time prediction server to test your trained model.

```bash
node predict.js
```
The server will boot up on `http://localhost:4000`. You can connect mobile devices to send live motion feeds (`http://localhost:4000/predict`). Whenever it detects a valid sequence of motion (300 data points), the server automatically references your saved model to predict whether you just threw a "hadoken", "punch", or "uppercut". The resulting prediction, along with the confidence score, will be emitted back to all connected WebSockets.

---

## Hardware Configuration (Arduino MPU6050)

If you wish to use custom hardware instead of a mobile phone browser for accelerometer + gyroscope tracking, you can flash the Arduino sketch located at `arduino/mpu6050dmp.ino`. 

* It uses I2C to communicate with an MPU6050 IMU.
* Processes raw data using the on-board DMP (Digital Motion Processor).
* Spits out real-time Yaw, Pitch, Roll (among other potential variables) directly to the Serial port.

*Be sure to change your accelerometer offsets in `setup()`.*
