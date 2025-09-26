# Changelog

All notable changes to the TestAPI extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-26

### Added
- **Initial release** of TestAPI - REST API Client for VS Code
- **Complete HTTP support**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Authentication methods**: Bearer Token, Basic Auth, API Key, No Auth
- **Request body types**: JSON, Raw Text, Form Data, x-www-form-urlencoded
- **Multipart form-data** with file upload support
- **Monaco editor integration** for syntax highlighting
- **Environment variables** with {{variable}} substitution
- **Request history** with click-to-reload functionality
- **Response viewer** with JSON formatting and syntax highlighting
- **Tabbed interface** inspired by Thunder Client
- **Sidebar navigation** for history and environments
- **VS Code theme integration** with dark mode support
- **Error handling** and validation for requests
- **Keyboard shortcuts** and intuitive UI

### Features
- **Beautiful UI**: Clean, professional interface with VS Code integration
- **Real-time responses**: Instant feedback with formatted JSON responses
- **File uploads**: Support for multiple file types and sizes
- **Variable management**: Environment-specific configurations
- **History management**: Auto-save and quick access to previous requests
- **Syntax highlighting**: Monaco editor for JSON and code editing
- **Header management**: Easy header configuration with validation
- **Status codes**: Color-coded response status indicators
- **Response details**: Headers, timing, and size information

### Technical
- **Built with**: TypeScript, Monaco Editor, VS Code Extension API
- **Compatibility**: VS Code 1.96.0 and above
- **Performance**: Optimized for fast API testing workflows
- **Reliability**: Robust error handling and fallback mechanisms

## [0.9.0] - 2024-01-01 (Pre-release)

### Added
- Basic HTTP request functionality
- JSON body editor
- Simple response viewer
- Initial extension setup

### Fixed
- Monaco editor loading issues
- VS Code compatibility adjustments
- UI layout improvements

## [0.1.0] - 2024-01-01 (Alpha)

### Added
- Project initialization
- Basic extension structure
- Webview panel setup
- Initial UI concepts

---

## Upcoming Features

### Planned for v1.1.0
- [ ] **Collection support**: Group and organize API requests
- [ ] **Scripting**: Pre-request and post-response scripts
- [ ] **GraphQL support**: Built-in GraphQL query editor
- [ ] **WebSocket testing**: Real-time WebSocket connections
- [ ] **Export/Import**: Share collections and environments
- [ ] **Tests automation**: Response validation and testing
- [ ] **Keyboard shortcuts**: Enhanced productivity features
- [ ] **Themes**: Additional color theme options

### Planned for v1.2.0
- [ ] **API documentation**: Generate docs from collections
- [ ] **Performance testing**: Load testing capabilities
- [ ] **Team collaboration**: Shared collections and environments
- [ ] **Plugin system**: Extensible functionality
- [ ] **Mobile preview**: Responsive design testing

---

## Versioning Scheme

- **Major version**: Breaking changes or major feature additions
- **Minor version**: New features and improvements
- **Patch version**: Bug fixes and minor enhancements

## Support

For bug reports, feature requests, or questions:
- Create an issue on our GitHub repository
- Check the documentation for common solutions
- Join our community discussions

---

*This changelog is maintained by the TestAPI development team.*