#include "I2Cdev.h"
#include "MPU6050_6Axis_MotionApps20.h"
#include "Wire.h"

MPU6050 mpu;
bool dmpReady = false;
uint8_t mpuIntStatus;
uint8_t devStatus;
uint16_t packetSize;
uint16_t fifoCount;
uint8_t fifoBuffer[64];

Quaternion q;
VectorFloat gravity;
float ypr[3];

void setup()
{
    Wire.begin();
    Serial.begin(115200);

    mpu.initialize();
    devStatus = mpu.dmpInitialize();

    // adjust these offsets for your MPU6050
    mpu.setXAccelOffset(-1650);
    mpu.setYAccelOffset(-45);
    mpu.setZAccelOffset(1150);
    mpu.setXGyroOffset(40);
    mpu.setYGyroOffset(20);
    mpu.setZGyroOffset(-30);

    if (devStatus == 0)
    {
        mpu.setDMPEnabled(true);
        dmpReady = true;
        packetSize = mpu.dmpGetFIFOPacketSize();
        Serial.println("DMP ready!");
    }
    else
    {
        Serial.print("DMP init failed: ");
        Serial.println(devStatus);
    }
}

void loop()
{
    if (!dmpReady)
        return;

    fifoCount = mpu.getFIFOCount();
    if (fifoCount < packetSize)
        return;
    if (fifoCount >= 1024)
    {
        mpu.resetFIFO();
        return;
    }

    mpu.getFIFOBytes(fifoBuffer, packetSize);
    mpu.dmpGetQuaternion(&q, fifoBuffer);
    mpu.dmpGetGravity(&gravity, &q);
    mpu.dmpGetYawPitchRoll(ypr, &q, &gravity);

    Serial.print(ypr[0] * 180 / M_PI);
    Serial.print(" ");
    Serial.print(ypr[1] * 180 / M_PI);
    Serial.print(" ");
    Serial.println(ypr[2] * 180 / M_PI);
}
