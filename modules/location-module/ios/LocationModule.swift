import ExpoModulesCore
import CoreLocation
import UIKit

public class LocationModule: Module, CLLocationManagerDelegate {
  private let locationManager = CLLocationManager()
  private var isTracking = false

  public func definition() -> ModuleDefinition {
    Name("LocationModule")

    Events("onLocationUpdate")

    OnCreate {
      self.locationManager.delegate = self
      self.locationManager.desiredAccuracy = kCLLocationAccuracyBest
      self.locationManager.allowsBackgroundLocationUpdates = true
      self.locationManager.pausesLocationUpdatesAutomatically = false
    }

    Function("startTracking") { () -> Bool in
      self.locationManager.requestAlwaysAuthorization()
      self.locationManager.startUpdatingLocation()
      self.isTracking = true
      return true
    }

    Function("stopTracking") { () -> Bool in
      self.locationManager.stopUpdatingLocation()
      self.isTracking = false
      return true
    }

    Function("requestBatteryOptimization") {
      // iOS manages battery optimization automatically via low power mode
      // Opening App Settings as a native fallback
      if let url = URL(string: UIApplication.openSettingsURLString) {
        DispatchQueue.main.async {
          UIApplication.shared.open(url)
        }
      }
    }

    Function("isBatteryOptimizationIgnored") { () -> Bool in
      // Always returns true on iOS since Android battery optimization does not exist here
      return true
    }

    Function("saveCSV") { (fileName: String, content: String) -> String in
      do {
        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsURL.appendingPathComponent(fileName)
        try content.write(to: fileURL, atomically: true, encoding: .utf8)
        return "Saved to Documents: \(fileURL.lastPathComponent)"
      } catch {
        return "Error: \(error.localizedDescription)"
      }
    }

    Function("generateSimplePDF") { (fileName: String, content: String) -> String in
      let pdfMetaData = [
        kCGPDFContextCreator: "GateMan",
        kCGPDFContextAuthor: "GateMan Security"
      ]
      let format = UIGraphicsPDFRendererFormat()
      format.documentInfo = pdfMetaData as [String: Any]

      let pageBounds = CGRect(x: 0, y: 0, width: 595.2, height: 841.8) // A4 Paper size
      let renderer = UIGraphicsPDFRenderer(bounds: pageBounds, format: format)

      let data = renderer.pdfData { (context) in
        context.beginPage()
        let attributes: [NSAttributedString.Key: Any] = [
          .font: UIFont.systemFont(ofSize: 12)
        ]
        var yPosition: CGFloat = 40.0
        let lines = content.components(separatedBy: "\n")
        
        for line in lines {
          let text = NSAttributedString(string: line, attributes: attributes)
          text.draw(at: CGPoint(x: 40, y: yPosition))
          yPosition += 20.0
        }
      }

      do {
        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let fileURL = documentsURL.appendingPathComponent(fileName)
        try data.write(to: fileURL)
        return "Saved to Documents: \(fileURL.lastPathComponent)"
      } catch {
        return "Error: \(error.localizedDescription)"
      }
    }

    AsyncFunction("showNativePicker") { (promise: Promise) in
      DispatchQueue.main.async {
        guard let currentViewController = UIApplication.shared.keyWindow?.rootViewController else {
          promise.reject("NO_VIEW_CONTROLLER", "Unable to find root view controller")
          return
        }

        let alert = UIAlertController(title: "Select Date\n\n\n\n\n\n\n\n", message: nil, preferredStyle: .actionSheet)
        let datePicker = UIDatePicker()
        datePicker.datePickerMode = .date
        if #available(iOS 14.0, *) {
          datePicker.preferredDatePickerStyle = .inline
        }
        datePicker.frame = CGRect(x: 0, y: 20, width: alert.view.bounds.size.width - 20, height: 200)

        alert.view.addSubview(datePicker)

        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { _ in
          let formatter = DateFormatter()
          formatter.dateFormat = "yyyy-MM-dd"
          promise.resolve(formatter.string(from: datePicker.date))
        }))

        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: { _ in
          promise.reject("CANCELLED", "Date selection was cancelled")
        }))

        currentViewController.present(alert, animated: true, completion: nil)
      }
    }
  }

  // MARK: - CLLocationManagerDelegate
  public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.last else { return }

    let geocoder = CLGeocoder()
    geocoder.reverseGeocodeLocation(location) { placemarks, error in
      var addressString = "Searching..."
      if let placemark = placemarks?.first {
        let name = placemark.name ?? ""
        let locality = placemark.locality ?? ""
        addressString = "\(name), \(locality)".trimmingCharacters(in: .whitespacesAndNewlines)
      }

      self.sendEvent("onLocationUpdate", [
        "latitude": location.coordinate.latitude,
        "longitude": location.coordinate.longitude,
        "address": addressString,
        "timestamp": Int64(location.timestamp.timeIntervalSince1970 * 1000)
      ])
    }
  }
}