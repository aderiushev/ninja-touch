import ExpoModulesCore
import CoreBluetooth

private let MESSAGE_CHAR_UUID = CBUUID(string: "00001338-0000-1000-8000-00805f9b34fb")

public class BlePeripheralModule: Module {
  private var peripheralManager: CBPeripheralManager?
  private var delegate: PeripheralDelegate?
  private var messageCharacteristic: CBMutableCharacteristic?
  private var connectedCentral: CBCentral?
  private var pendingAdvertisingData: [String: Any]?

  public func definition() -> ModuleDefinition {
    Name("BlePeripheral")

    Events("onCentralConnected", "onCentralDisconnected", "onMessageReceived")

    AsyncFunction("startAdvertising") { (localName: String, serviceUuid: String) in
      let delegate = PeripheralDelegate(module: self, serviceUuid: serviceUuid)
      self.delegate = delegate
      self.peripheralManager = CBPeripheralManager(delegate: delegate, queue: .main)
      self.pendingAdvertisingData = [
        CBAdvertisementDataLocalNameKey: localName,
        CBAdvertisementDataServiceUUIDsKey: [CBUUID(string: serviceUuid)]
      ] as [String: Any]
    }

    AsyncFunction("stopAdvertising") {
      self.peripheralManager?.stopAdvertising()
      self.peripheralManager?.removeAllServices()
      self.peripheralManager = nil
      self.delegate = nil
      self.connectedCentral = nil
      self.messageCharacteristic = nil
    }

    AsyncFunction("sendNotification") { (characteristicUuid: String, data: [Int]) -> Bool in
      guard let characteristic = self.messageCharacteristic,
            let central = self.connectedCentral,
            let manager = self.peripheralManager else {
        return false
      }
      let bytes = Data(data.map { UInt8($0 & 0xFF) })
      return manager.updateValue(bytes, for: characteristic, onSubscribedCentrals: [central])
    }

    AsyncFunction("isAdvertising") { () -> Bool in
      return self.peripheralManager?.isAdvertising ?? false
    }
  }

  fileprivate func setupService(serviceUuid: String) {
    let characteristic = CBMutableCharacteristic(
      type: MESSAGE_CHAR_UUID,
      properties: [.write, .notify, .writeWithoutResponse],
      value: nil,
      permissions: [.writeable, .readable]
    )
    self.messageCharacteristic = characteristic

    let service = CBMutableService(type: CBUUID(string: serviceUuid), primary: true)
    service.characteristics = [characteristic]
    self.peripheralManager?.add(service)
  }

  fileprivate func startAdvertisingNow() {
    guard let data = self.pendingAdvertisingData else { return }
    self.peripheralManager?.startAdvertising(data)
  }

  fileprivate func handleCentralConnected(_ central: CBCentral) {
    self.connectedCentral = central
    sendEvent("onCentralConnected", ["centralId": central.identifier.uuidString])
  }

  fileprivate func handleCentralDisconnected(_ central: CBCentral) {
    if self.connectedCentral?.identifier == central.identifier {
      self.connectedCentral = nil
    }
    sendEvent("onCentralDisconnected", ["centralId": central.identifier.uuidString])
  }

  fileprivate func handleMessageReceived(_ data: Data) {
    let bytes = data.map { Int($0) }
    sendEvent("onMessageReceived", ["data": bytes])
  }
}

private class PeripheralDelegate: NSObject, CBPeripheralManagerDelegate {
  weak var module: BlePeripheralModule?
  let serviceUuid: String

  init(module: BlePeripheralModule, serviceUuid: String) {
    self.module = module
    self.serviceUuid = serviceUuid
    super.init()
  }

  func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
    if peripheral.state == .poweredOn {
      module?.setupService(serviceUuid: serviceUuid)
    }
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, didAdd service: CBService, error: Error?) {
    if error == nil {
      module?.startAdvertisingNow()
    }
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, central: CBCentral, didSubscribeTo characteristic: CBCharacteristic) {
    module?.handleCentralConnected(central)
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, central: CBCentral, didUnsubscribeFrom characteristic: CBCharacteristic) {
    module?.handleCentralDisconnected(central)
  }

  func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveWrite requests: [CBATTRequest]) {
    for request in requests {
      if let data = request.value {
        module?.handleMessageReceived(data)
      }
      peripheral.respond(to: request, withResult: .success)
    }
  }
}
