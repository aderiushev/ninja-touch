Pod::Spec.new do |s|
  s.name           = 'BlePeripheral'
  s.version        = '0.1.0'
  s.summary        = 'BLE Peripheral module for ninja-msg'
  s.description    = 'Expo native module providing BLE peripheral (GATT server) capabilities'
  s.author         = ''
  s.homepage       = 'https://github.com/example/ble-peripheral'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
