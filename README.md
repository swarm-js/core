<br/>
<p align="center">
  <a href="https://github.com/swarm-js/core">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">@swarmjs/core</h3>

  <p align="center">
    Fast NodeJS API framework with TypeScript : ACL, validation and serialization, Swagger.json generation ...
    <br/>
    <br/>
  </p>
</p>

![Version](https://img.shields.io/npm/v/@swarmjs/core) ![Downloads](https://img.shields.io/npm/dm/@swarmjs/core) ![License](https://img.shields.io/github/license/swarm-js/core)

## Table Of Contents

- [About the Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)
- [Acknowledgements](#acknowledgements)

## About The Project

Stop losing time on your APIs. You usually manages your routes somewhere, your methods somewhere else, your documentation at another location ... Each code update makes you go everywhere, for nothing.

This framework focuses on keeping you work at only one location : your controllers. With `TypeScript` decorators, you can easily decorate your controllers, methods to configure everything you need about an API endpoint :

- Method
- Route
- API version
- Title
- Description
- Restrict access
- Filter user input
- Filter sent data

With this configuration, SwarmJS runs a HTTP server (working with `Fastify`, so it's fast !), monitors performance and generates automatically `swagger.json` file to share documentation with others.

## Built With

- TypeScript@4
- Fastify@4

## Getting Started

### Prerequisites

To use SwarmJS, you need to use either `TypeScript` or `Babel` with `@babel/plugin-proposal-decorators` plugin.

### Installation

```sh
yarn add @swarmjs/core
```

or

```sh
npm install --save @swarmjs/core
```

## Usage

Please refer to the documentation to [Get Started](https://swarmjs.com/docs/get-started)

## Roadmap

See the [open issues](https://github.com/swarm-js/core/issues) for a list of proposed features (and known issues).

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

- If you have suggestions for adding or removing projects, feel free to [open an issue](https://github.com/swarm-js/core/issues/new) to discuss it, or directly create a pull request after you edit the _README.md_ file with necessary changes.
- Please make sure you check your spelling and grammar.
- Create individual PR for each suggestion.
- Please also read through the [Code Of Conduct](https://github.com/swarm-js/core/blob/main/CODE_OF_CONDUCT.md) before posting your first idea as well.

### Creating A Pull Request

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See [LICENSE](https://github.com/swarm-js/core/blob/main/LICENSE.md) for more information.

## Authors

- [Guillaume Gagnaire](https://github.com/guillaume-gagnaire) - _CTO @ Smart Moov_
