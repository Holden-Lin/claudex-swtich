class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.0/claudex-switch-darwin-arm64.tar.gz"
      sha256 "51bf0031f8b60caa1119ef7786791985aa43152c47d36421a085f04fe12495c6"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.0/claudex-switch-darwin-x64.tar.gz"
      sha256 "ec6edfbdc9e3f3b4311f8856f93e687b4af3f5c447c4de788a4506166af03fff"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.0/claudex-switch-linux-arm64.tar.gz"
      sha256 "f0766156053c29c59ec1327a9f6ace94682abab68e6d1a721fe18ed6a282eaf9"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.0/claudex-switch-linux-x64.tar.gz"
      sha256 "7926511b3466729b36eb0ec963443e0c498f88e6be181b805ccd90aa7795a28e"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
