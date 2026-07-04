{
  description = "Anuka Uchika development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          chromium =
            if pkgs.stdenv.isDarwin then
              null
            else
              pkgs.chromium;
          screenshot-url = pkgs.writeShellApplication {
            name = "screenshot-url";
            runtimeInputs = nixpkgs.lib.optionals (!pkgs.stdenv.isDarwin) [ chromium ];
            text = ''
              if [ "$#" -lt 2 ]; then
                echo "usage: screenshot-url <url> <output.png> [width] [height] [wait-ms]" >&2
                exit 2
              fi

              url="$1"
              output="$2"
              width="''${3:-1440}"
              height="''${4:-1600}"
              wait_ms="''${5:-5000}"

              chromium \
                --headless \
                --disable-gpu \
                --no-sandbox \
                --hide-scrollbars \
                --window-size="$width,$height" \
                --virtual-time-budget="$wait_ms" \
                --screenshot="$output" \
                "$url"
            '';
          };
        in
        {
          default = pkgs.mkShell {
            packages =
              [
                pkgs.nodejs_22
                screenshot-url
              ]
              ++ nixpkgs.lib.optionals (!pkgs.stdenv.isDarwin) [
                chromium
              ];

            CHROME_BIN = nixpkgs.lib.optionalString (!pkgs.stdenv.isDarwin) "${chromium}/bin/chromium";
            PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
          };
        }
      );
    };
}
