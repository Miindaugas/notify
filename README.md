# Notify

[![tests](https://github.com/Miindaugas/notify/actions/workflows/main.yml/badge.svg)](https://github.com/Miindaugas/notify/actions/workflows/main.yml?query=workflow%3ATest++)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/Miindaugas/notify/actions)

Send notifications to Slack, Microsoft Teams when your website goes down.

### Configuration

```yml
# ./config.js
services: [ "https://example.com" ],
slackWebhook: "https://hooks.slack.com/services/<TOKEN>",
microsoftTeamsWebhook: "https://outlook.office.com/webhook/<TOKEN>",
serviceUpMessage: "Service available",
serviceDownMessage: "Service unavailable",
checkHealthIntervalSeconds: 60,
```

### Using node.js

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

```
node src/start.js
```

### Using docker

![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

```
docker build -t notify .
docker run notify
```
