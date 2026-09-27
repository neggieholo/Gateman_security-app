import ExpoModulesCore
import CoreLocation
import UIKit

public class LocationModule: Module {
  private let locationManager = CLLocationManager()
  private let locationDelegate = LocationDelegate()
  private var isTracking = false

  public func definition() -> ModuleDefinition {
    Name("LocationModule")

    Events("onLocationUpdate")

    OnCreate {
      self.locationDelegate.module = self

      self.locationManager.delegate = self.locationDelegate
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

    // Keep all your other Functions here...
  }

  func handleLocationUpdate(_ location: CLLocation) {
    let geocoder = CLGeocoder()

    geocoder.reverseGeocodeLocation(location) { placemarks, error in
      var addressString = "Searching..."

      if let placemark = placemarks?.first {
        let name = placemark.name ?? ""
        let locality = placemark.locality ?? ""

        addressString = "\(name), \(locality)"
          .trimmingCharacters(in: .whitespacesAndNewlines)
      }

      self.sendEvent("onLocationUpdate", [
        "latitude": location.coordinate.latitude,
        "longitude": location.coordinate.longitude,
        "address": addressString,
        "timestamp": Int64(
          location.timestamp.timeIntervalSince1970 * 1000
        )
      ])
    }
  }
}


// MARK: - CLLocationManagerDelegate

private class LocationDelegate: NSObject, CLLocationManagerDelegate {

  weak var module: LocationModule?

  func locationManager(
    _ manager: CLLocationManager,
    didUpdateLocations locations: [CLLocation]
  ) {
    guard let location = locations.last else {
      return
    }

    module?.handleLocationUpdate(location)
  }
}