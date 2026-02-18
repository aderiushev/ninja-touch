package expo.modules.bleperipheral

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.ParcelUuid
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.util.UUID

private val MESSAGE_CHAR_UUID: UUID = UUID.fromString("00001338-0000-1000-8000-00805f9b34fb")

class BlePeripheralModule : Module() {
  private var bluetoothManager: BluetoothManager? = null
  private var advertiser: BluetoothLeAdvertiser? = null
  private var gattServer: BluetoothGattServer? = null
  private var messageCharacteristic: BluetoothGattCharacteristic? = null
  private var connectedDevice: BluetoothDevice? = null
  private var isCurrentlyAdvertising = false

  override fun definition() = ModuleDefinition {
    Name("BlePeripheral")

    Events("onCentralConnected", "onCentralDisconnected", "onMessageReceived")

    AsyncFunction("startAdvertising") { localName: String, serviceUuid: String, promise: Promise ->
      try {
        val context = appContext.reactContext ?: throw Exception("No context")
        bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
        val adapter = bluetoothManager?.adapter ?: throw Exception("No Bluetooth adapter")

        setupGattServer(context, serviceUuid)

        advertiser = adapter.bluetoothLeAdvertiser ?: throw Exception("BLE advertising not supported")

        val settings = AdvertiseSettings.Builder()
          .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
          .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
          .setConnectable(true)
          .build()

        val serviceUuidParsed = UUID.fromString(serviceUuid)

        val data = AdvertiseData.Builder()
          .setIncludeDeviceName(false)
          .addServiceUuid(ParcelUuid(serviceUuidParsed))
          .build()

        val scanResponse = AdvertiseData.Builder()
          .setIncludeDeviceName(false)
          .addServiceData(ParcelUuid(serviceUuidParsed), localName.toByteArray(Charsets.UTF_8))
          .build()

        advertiser?.startAdvertising(settings, data, scanResponse, object : AdvertiseCallback() {
          override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            isCurrentlyAdvertising = true
            promise.resolve(null)
          }

          override fun onStartFailure(errorCode: Int) {
            isCurrentlyAdvertising = false
            promise.reject("ADVERTISE_ERROR", "Failed to start advertising: $errorCode", null)
          }
        })
      } catch (e: Exception) {
        promise.reject("ADVERTISE_ERROR", e.message, e)
      }
    }

    AsyncFunction("stopAdvertising") { promise: Promise ->
      try {
        advertiser?.stopAdvertising(object : AdvertiseCallback() {})
        gattServer?.close()
        gattServer = null
        advertiser = null
        connectedDevice = null
        isCurrentlyAdvertising = false
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("STOP_ERROR", e.message, e)
      }
    }

    AsyncFunction("sendNotification") { characteristicUuid: String, data: List<Int>, promise: Promise ->
      try {
        val device = connectedDevice
        val server = gattServer
        val characteristic = messageCharacteristic

        if (device == null || server == null || characteristic == null) {
          promise.resolve(false)
          return@AsyncFunction
        }

        val bytes = ByteArray(data.size) { data[it].toByte() }
        characteristic.value = bytes
        val sent = server.notifyCharacteristicChanged(device, characteristic, false)
        promise.resolve(sent)
      } catch (e: Exception) {
        promise.resolve(false)
      }
    }

    AsyncFunction("isAdvertising") { promise: Promise ->
      promise.resolve(isCurrentlyAdvertising)
    }
  }

  private fun setupGattServer(context: Context, serviceUuid: String) {
    val callback = object : BluetoothGattServerCallback() {
      override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
        if (newState == BluetoothGatt.STATE_CONNECTED) {
          connectedDevice = device
          sendEvent("onCentralConnected", mapOf("centralId" to device.address))
        } else if (newState == BluetoothGatt.STATE_DISCONNECTED) {
          if (connectedDevice?.address == device.address) {
            connectedDevice = null
          }
          sendEvent("onCentralDisconnected", mapOf("centralId" to device.address))
        }
      }

      override fun onCharacteristicWriteRequest(
        device: BluetoothDevice,
        requestId: Int,
        characteristic: BluetoothGattCharacteristic,
        preparedWrite: Boolean,
        responseNeeded: Boolean,
        offset: Int,
        value: ByteArray?
      ) {
        if (value != null) {
          val intArray = value.map { it.toInt() and 0xFF }
          sendEvent("onMessageReceived", mapOf("data" to intArray))
        }
        if (responseNeeded) {
          gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
        }
      }

      override fun onDescriptorWriteRequest(
        device: BluetoothDevice,
        requestId: Int,
        descriptor: android.bluetooth.BluetoothGattDescriptor,
        preparedWrite: Boolean,
        responseNeeded: Boolean,
        offset: Int,
        value: ByteArray?
      ) {
        if (responseNeeded) {
          gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
        }
      }
    }

    gattServer = bluetoothManager?.openGattServer(context, callback)

    val characteristic = BluetoothGattCharacteristic(
      MESSAGE_CHAR_UUID,
      BluetoothGattCharacteristic.PROPERTY_WRITE or
        BluetoothGattCharacteristic.PROPERTY_NOTIFY or
        BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE,
      BluetoothGattCharacteristic.PERMISSION_WRITE
    )

    // Add CCCD for notifications
    val cccd = android.bluetooth.BluetoothGattDescriptor(
      UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"),
      android.bluetooth.BluetoothGattDescriptor.PERMISSION_WRITE or
        android.bluetooth.BluetoothGattDescriptor.PERMISSION_READ
    )
    characteristic.addDescriptor(cccd)

    messageCharacteristic = characteristic

    val service = BluetoothGattService(
      UUID.fromString(serviceUuid),
      BluetoothGattService.SERVICE_TYPE_PRIMARY
    )
    service.addCharacteristic(characteristic)
    gattServer?.addService(service)
  }
}
