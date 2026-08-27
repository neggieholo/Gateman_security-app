import ExpoModulesCore
import WebKit

class LocationModuleView: ExpoView {
  let webView = WKWebView()
  let onLoad = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    addSubview(webView)
  }

  override func layoutSubviews() {
    webView.frame = bounds
  }
}