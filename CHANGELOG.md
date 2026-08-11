# Changelog

## 1.0.4 - 2026-08-11

### Fixed

- Removed `PUPPETEER_SKIP_DOWNLOAD=true` from the image. Chrome was pre-installed at build time using the base image's own bundled Puppeteer version; installing a newer `@js-recon/js-recon` at runtime could require a different Chrome build than the one baked in, causing `Could not find Chrome (ver. ...)` failures with `version: latest`. The runtime `npm install -g` now triggers Puppeteer's normal postinstall download, which always fetches the exact Chrome build the resolved version needs.

## 1.0.3 - 2026-07-15

### Changed

- Migrated to the `js-recon` organization. The action now installs `@js-recon/js-recon` (previously `@shriyanss/js-recon`), and the recommended usage is `uses: js-recon/js-recon-action@v1`.

## 1.0.2 - 2026-07-09

### Added

- Publish action on GitHub Marketplace

## 1.0.1 - 2026-07-09

### Fixed

- Print installed JS Recon version after install step for easier debugging
- Ensure entrypoint exits non-zero when `js-recon run` itself fails

## 1.0.0 - 2026-07-09

### Added

- Initial release
- Run JS Recon against any URL (external or localhost)
- Support for starting a local app with `start-cmd` before scanning
- Configurable JS Recon version via `version` input (defaults to `latest`)
- Break on `.map` source map files detected in output (default: enabled)
- Break on vulnerabilities in `analyze.json` with configurable severity threshold (default: `high`)
- Outputs: `map-files-found`, `vulnerability-count`, `output-path`
