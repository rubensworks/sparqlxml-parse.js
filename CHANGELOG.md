# Changelog
All notable changes to this project will be documented in this file.

<a name="v3.3.0"></a>
## [v3.3.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v3.2.0...v3.3.0) - 2025-10-24

### Added
* [Accept and validate version as media type parameter](https://github.com/rubensworks/sparqlxml-parse.js/commit/19d9894dc21b09f70f991669f45ff1847bac741e)

<a name="v3.2.0"></a>
## [v3.2.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v3.1.0...v3.2.0) - 2025-10-23

### Changed
* [Emit error on unsupported versions](https://github.com/rubensworks/sparqlxml-parse.js/commit/a0f212a660842f36dd7605af921f3a0737fd3962)

<a name="v3.1.0"></a>
## [v3.1.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v3.0.0...v3.1.0) - 2025-06-17

### Added
* [Parse version and link head elements](https://github.com/rubensworks/sparqlxml-parse.js/commit/3a42175ad5eb68cf8aaaef65e20dca83f714c483)

<a name="v3.0.0"></a>
## [v3.0.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v2.1.1...v3.0.0) - 2025-01-08

### BREAKING CHANGES
* [Update to rdf-data-factory v2](https://github.com/rubensworks/sparqlxml-parse.js/commit/ae95b61dc7dd125d814a97116115031792fabd91)
    This includes a bump to @rdfjs/types@2.0.0, which requires TypeScript 5 and Node 14+

### Added
* [Add optional direction for literals](https://github.com/rubensworks/sparqlxml-parse.js/commit/6ec8e44f25cf7c3b3b3675a90ca0959ecc2c5ba3)

### Fixed
* [Bump readable-stream to fix Buffer undefined in browsers](https://github.com/rubensworks/sparqlxml-parse.js/commit/1df5d1c03b64f586bd381f32c8e5c3b3c999f97f)

<a name="v2.1.1"></a>
## [v2.1.1](https://github.com/rubensworks/sparqlxml-parse.js/compare/v2.1.0...v2.1.1) - 2023-06-05

### Fixed
* [Migrate to @rubensworks/saxes](https://github.com/rubensworks/sparqlxml-parse.js/commit/370c8e3e0073dd3602338e66181d148be06dbe34)
    This fixes compilation errors on TypeScript 5

<a name="v2.1.0"></a>
## [v2.1.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v2.0.2...v2.1.0) - 2023-01-27

### Added
* [Parse quoted RDF-star triples](https://github.com/rubensworks/sparqlxml-parse.js/commit/da3d7a3ece8ac0565c88463454b61f1ee8b3729a)

<a name="v2.0.2"></a>
## [v2.0.2](https://github.com/rubensworks/sparqlxml-parse.js/compare/v2.0.1...v2.0.2) - 2022-11-09

### Fixed
* [Include source map files in packed files](https://github.com/rubensworks/sparqlxml-parse.js/commit/82acf50024999a1770061964be52d8f98283da7e)

<a name="v2.0.1"></a>
## [v2.0.1](https://github.com/rubensworks/sparqlxml-parse.js/compare/v2.0.0...v2.0.1) - 2022-07-15

### Fixed
* [Ensure variables or error event is emitted](https://github.com/rubensworks/sparqlxml-parse.js/commit/46f6c89526d55c0cbceae72a4521e350f6a8ca6f)

<a name="v2.0.0"></a>
## [v2.0.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.5.0...v2.0.0) - 2022-07-14

This release has been marked as a major change due to the transition from Node's internal `stream` API to `readable-stream`.
Most users should experience not breakages with this change.

### Changed
* [Move away from Node.js built-ins](https://github.com/rubensworks/sparqlxml-parse.js/commit/5b4f65556d8ea9ed4450cdcc5ecf5a75b988ac3e)
* [Enable tree shaking in package.json](https://github.com/rubensworks/sparqlxml-parse.js/commit/2468b763a761ef1e64e07c5c5594cd43425ccaef)

<a name="v1.5.0"></a>
## [v1.5.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.4.0...v1.5.0) - 2021-08-11

### Changed
* [Migrate to @rdfjs/types](https://github.com/rubensworks/sparqlxml-parse.js/commit/5ec3356f4207974c298f921a290cbd2113f64a91)

<a name="v1.4.0"></a>
## [v1.4.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.3.0...v1.4.0) - 2020-09-16

### Changed
* [Migrate to rdf-data-factory and @types/rdf-js 4.x](https://github.com/rubensworks/sparqlxml-parse.js/commit/46f1b6221af949bb7b07bb2aa20ab5f4e4010e57)

<a name="v1.3.0"></a>
## [v1.3.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.2.2...v1.3.0) - 2020-08-24

### Changed
* [Update dependency @types/rdf-js to v3 (#23)](https://github.com/rubensworks/sparqlxml-parse.js/commit/98b25846cb281e0bcd48897e0434cfafd4e87f8a)

<a name="v1.2.2"></a>
## [v1.2.2](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.2.1...v1.2.2) - 2019-08-22

### Fixed
* [Add required typings as dependencies](https://github.com/rubensworks/sparqlxml-parse.js/commit/3724dde828336dad3e4576dd0d4fda789283510e)

<a name="v1.2.1"></a>
## [v1.2.1](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.2.0...v1.2.1) - 2019-02-13

### Fixed
* [Handle emtpy literals correctly](https://github.com/rubensworks/sparqlxml-parse.js/commit/47b67208443899287564882bac6c8f9e193fd359)

<a name="v1.2.0"></a>
## [v1.2.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.1.3...v1.2.0) - 2018-11-08

### Changed
* [Update to generic RDFJS typings](https://github.com/rubensworks/sparqlxml-parse.js/commit/474757e3497d3c4713e0f30eb8b2d700afcee73b)

<a name="1.1.3"></a>
## [1.1.3](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.1.2...v1.1.3) - 2018-09-21
- [Fix crash when bindings without children are present](https://github.com/rubensworks/sparqlxml-parse.js/commit/ed2e9ee1a75ed8a1a548020c02c35a36f9b4f76b)

<a name="1.1.2"></a>
## [1.1.2](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.1.1...v1.1.2) - 2018-09-05
- [Remove tslib dependency](https://github.com/rubensworks/sparqlxml-parse.js/commit/5a4243e22ac01dd3a9bb4e0dac3ff13b7d34ce67)

<a name="1.1.1"></a>
## [1.1.1](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.1.0...v1.1.1) - 2018-08-24
- [Check edge-cases for empty bindings and results](https://github.com/rubensworks/sparqlxml-parse.js/commit/031c30c93e6e2e3a56b1dd2cb47013a30344998e)
- [Fix parsing error on single bindings](https://github.com/rubensworks/sparqlxml-parse.js/commit/79b5a5bcad0abd8080b3900e84ab4e956ad13940)
- [Catch SPARQL XML errors](https://github.com/rubensworks/sparqlxml-parse.js/commit/74787ade801564b2aaf09c50720478aa6c6b3dc3)

<a name="1.1.0"></a>
## [1.1.0](https://github.com/rubensworks/sparqlxml-parse.js/compare/v1.0.0...v1.1.0) - 2018-08-23
- [Update to pure-js sax-stream XML parser](https://github.com/rubensworks/sparqlxml-parse.js/commit/c231ff4045c8c0fddaa5c95f594dc801ee5e1cae)

<a name="1.0.0"></a>
## [1.0.0] - 2018-08-21
- [Add SparqlXmlParser](https://github.com/rubensworks/sparqlxml-parse.js/commit/b15c0109a133144dccd8296756cb73a95ada5893)
