import AppKit
import CoreText

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let logoURL = root.appendingPathComponent("src/logo/Jack Sequeira Logo-01.png")
let fontURL = root.appendingPathComponent("src/assets/fonts/Cabin-Bold.ttf")
let androidURL = root.appendingPathComponent("android/app/src/main/res/drawable-nodpi/splash_logo.png")
let androidLeatherURL = root.appendingPathComponent("android/app/src/main/res/drawable-nodpi/splash_leather.png")
let ios1xURL = root.appendingPathComponent("ios/JackSequeiraMobile/Images.xcassets/SplashLogo.imageset/splash-logo.png")
let ios2xURL = root.appendingPathComponent("ios/JackSequeiraMobile/Images.xcassets/SplashLogo.imageset/splash-logo@2x.png")
let ios3xURL = root.appendingPathComponent("ios/JackSequeiraMobile/Images.xcassets/SplashLogo.imageset/splash-logo@3x.png")
let iosLeather1xURL = root.appendingPathComponent("ios/JackSequeiraMobile/Images.xcassets/SplashLeather.imageset/splash-leather.png")
let iosLeather2xURL = root.appendingPathComponent("ios/JackSequeiraMobile/Images.xcassets/SplashLeather.imageset/splash-leather@2x.png")
let iosLeather3xURL = root.appendingPathComponent("ios/JackSequeiraMobile/Images.xcassets/SplashLeather.imageset/splash-leather@3x.png")
let reactLeatherURL = root.appendingPathComponent("src/assets/images/splash-leather.png")

CTFontManagerRegisterFontsForURL(fontURL as CFURL, .process, nil)

struct SplashLayout {
  let scale: CGFloat
  var size: CGSize { CGSize(width: 360 * scale, height: 250 * scale) }
  var logoSize: CGFloat { 148 * scale }
  var cornerRadius: CGFloat { 42 * scale }
  var titleTop: CGFloat { 18 * scale }
  var titleFontSize: CGFloat { 25 * scale }
  var titleLineHeight: CGFloat { 31 * scale }
}

func drawSplash(scale: CGFloat) throws -> NSImage {
  guard let logo = NSImage(contentsOf: logoURL) else {
    throw NSError(domain: "SplashAssets", code: 1, userInfo: [NSLocalizedDescriptionKey: "Missing logo"])
  }

  let layout = SplashLayout(scale: scale)
  let image = NSImage(size: layout.size)
  image.lockFocus()
  NSColor.clear.setFill()
  NSRect(origin: .zero, size: layout.size).fill()

  let logoRect = NSRect(
    x: (layout.size.width - layout.logoSize) / 2,
    y: layout.size.height - layout.logoSize,
    width: layout.logoSize,
    height: layout.logoSize
  )

  let shadow = NSShadow()
  shadow.shadowColor = NSColor.black.withAlphaComponent(0.26)
  shadow.shadowOffset = NSSize(width: 0, height: -18 * scale)
  shadow.shadowBlurRadius = 24 * scale
  shadow.set()

  NSGraphicsContext.current?.saveGraphicsState()
  let framePath = NSBezierPath(roundedRect: logoRect, xRadius: layout.cornerRadius, yRadius: layout.cornerRadius)
  framePath.addClip()
  logo.draw(in: logoRect, from: NSRect(origin: .zero, size: logo.size), operation: .sourceOver, fraction: 1)
  NSGraphicsContext.current?.restoreGraphicsState()

  NSColor.white.withAlphaComponent(0.28).setStroke()
  framePath.lineWidth = scale
  framePath.stroke()

  let title = "Jack Sequeira Ministries" as NSString
  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = .center
  paragraph.minimumLineHeight = layout.titleLineHeight
  paragraph.maximumLineHeight = layout.titleLineHeight
  let font = NSFont(name: "Cabin-Bold", size: layout.titleFontSize)
    ?? NSFont.boldSystemFont(ofSize: layout.titleFontSize)
  let attrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: NSColor.white,
    .paragraphStyle: paragraph,
  ]
  let titleRect = NSRect(
    x: 30 * scale,
    y: 0,
    width: 300 * scale,
    height: layout.titleLineHeight * 2
  )
  title.draw(in: titleRect, withAttributes: attrs)

  image.unlockFocus()
  return image
}

func drawLeatherTexture(scale: CGFloat) -> NSImage {
  let size = CGSize(width: 144 * scale, height: 144 * scale)
  let image = NSImage(size: size)
  var seed: UInt64 = 0x1E1040

  func randomUnit() -> CGFloat {
    seed = seed &* 6364136223846793005 &+ 1442695040888963407
    return CGFloat((seed >> 33) & 0xffff) / CGFloat(0xffff)
  }

  image.lockFocus()
  NSColor(red: 30 / 255, green: 16 / 255, blue: 64 / 255, alpha: 1).setFill()
  NSRect(origin: .zero, size: size).fill()

  for _ in 0..<320 {
    let alpha = 0.018 + randomUnit() * 0.05
    let value = randomUnit() > 0.5 ? CGFloat(1) : CGFloat(0)
    NSColor(
      calibratedWhite: value,
      alpha: alpha
    ).setFill()
    let rect = NSRect(
      x: randomUnit() * size.width,
      y: randomUnit() * size.height,
      width: (0.7 + randomUnit() * 1.8) * scale,
      height: (0.7 + randomUnit() * 1.8) * scale
    )
    rect.fill()
  }

  for _ in 0..<42 {
    let path = NSBezierPath()
    let y = randomUnit() * size.height
    path.move(to: CGPoint(x: -8 * scale, y: y))
    path.curve(
      to: CGPoint(x: size.width + 8 * scale, y: y + (randomUnit() - 0.5) * 16 * scale),
      controlPoint1: CGPoint(x: size.width * 0.34, y: y + (randomUnit() - 0.5) * 12 * scale),
      controlPoint2: CGPoint(x: size.width * 0.66, y: y + (randomUnit() - 0.5) * 12 * scale)
    )
    NSColor.white.withAlphaComponent(0.025 + randomUnit() * 0.045).setStroke()
    path.lineWidth = 0.45 * scale
    path.stroke()
  }

  for _ in 0..<36 {
    let path = NSBezierPath()
    let x = randomUnit() * size.width
    path.move(to: CGPoint(x: x, y: -8 * scale))
    path.curve(
      to: CGPoint(x: x + (randomUnit() - 0.5) * 16 * scale, y: size.height + 8 * scale),
      controlPoint1: CGPoint(x: x + (randomUnit() - 0.5) * 10 * scale, y: size.height * 0.34),
      controlPoint2: CGPoint(x: x + (randomUnit() - 0.5) * 10 * scale, y: size.height * 0.66)
    )
    NSColor.black.withAlphaComponent(0.03 + randomUnit() * 0.04).setStroke()
    path.lineWidth = 0.5 * scale
    path.stroke()
  }

  NSColor.white.withAlphaComponent(0.04).setFill()
  NSRect(x: 0, y: 0, width: size.width, height: 1 * scale).fill()
  NSColor.black.withAlphaComponent(0.04).setFill()
  NSRect(x: 0, y: size.height - 1 * scale, width: size.width, height: 1 * scale).fill()

  image.unlockFocus()
  return image
}

func writePNG(_ image: NSImage, to url: URL) throws {
  guard
    let tiff = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let png = bitmap.representation(using: .png, properties: [:])
  else {
    throw NSError(domain: "SplashAssets", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not encode PNG"])
  }
  try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try png.write(to: url)
}

try writePNG(drawSplash(scale: 1), to: ios1xURL)
try writePNG(drawSplash(scale: 2), to: ios2xURL)
try writePNG(drawSplash(scale: 3), to: ios3xURL)
try writePNG(drawSplash(scale: 2), to: androidURL)
try writePNG(drawLeatherTexture(scale: 1), to: reactLeatherURL)
try writePNG(drawLeatherTexture(scale: 1), to: androidLeatherURL)
try writePNG(drawLeatherTexture(scale: 1), to: iosLeather1xURL)
try writePNG(drawLeatherTexture(scale: 2), to: iosLeather2xURL)
try writePNG(drawLeatherTexture(scale: 3), to: iosLeather3xURL)
