class ClaudexSwitch < Formula
  desc "Switch between Claude Code and Codex accounts with ease"
  homepage "https://github.com/Holden-Lin/claudex-switch"
  version "1.1.2"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.2/claudex-switch-darwin-arm64.tar.gz"
      sha256 "90ccd8c7b42102408d62c9dade2e9b103ffa3a96be5e44c4fdd046bc67c5551b"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.2/claudex-switch-darwin-x64.tar.gz"
      sha256 "158a7e5776c3f2b9f23fe89a921de74ec0cbdfa0d971f888148e562be25535af"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.2/claudex-switch-linux-arm64.tar.gz"
      sha256 "ac87c8b2d7286e405c4164fb494fe8c8a69f0242f9f5a5e89fafe2fda160d3d7"
    else
      url "https://github.com/Holden-Lin/claudex-switch/releases/download/v1.1.2/claudex-switch-linux-x64.tar.gz"
      sha256 "62ea4cf49bbc6a02f54b164cf33561e4c794ffff0be26a7b4d0b250aa04809ea"
    end
  end

  def install
    bin.install "claudex-switch"
  end

  test do
    assert_match "claudex-switch", shell_output("#{bin}/claudex-switch help")
  end
end
