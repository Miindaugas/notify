const https = require("https");

const notify = (webhooks, message) => {
  for (const webhook of webhooks) {
    const data = JSON.stringify({ text: message });
    const options = {
      method: "POST",
      header: {
        "Content-Type": "application/json",
      },
    };
    const request = https.request(webhook, options);
    request.write(data);
    request.end();
  }
};

const checkHealth = (url, timeout = 5000) => {
  return new Promise((resolve) => {
    try {
      const request = https.get(url, { timeout }, (res) => {
        resolve(res.statusCode === 200);
      });
    } catch {
      resolve(false);
    }
  });
};

const start = (config) => {
  let services = null;
  let webhooks = null;

  const state = {};

  if (config.checkHealthIntervalSeconds < 1) {
    throw Error("Minimum checkHealthIntervalSeconds should be 1 second");
  }

  if (config.services.length < 1) {
    throw Error("No services defined, should add at least one");
  }

  if (
    config.microsoftTeamsWebhook === undefined &&
    config.slackWebhook === undefined
  ) {
    throw Error("Provide microsoft teams or slack webhook to be notified");
  }

  try {
    webhooks = [config.microsoftTeamsWebhook, config.slackWebhook]
      .filter((webhook) => webhook !== undefined && webhook !== null)
      .map((webhook) => new URL(webhook));
  } catch (error) {
    throw Error(`One of provided webhook is invalid: ${error}`);
  }

  for (const service of config.services) {
    try {
      services = config.services.map((service) => new URL(service));
    } catch {
      throw Error(`Services contains invalid url ${service}`);
    }
  }

  for (const service of services) {
    state[service] = true;
  }

  return setInterval(async () => {
    for (const service of services) {
      const healthy = await checkHealth(service);
      if (state[service] !== healthy) {
        state[service] = healthy;
        notify(
          webhooks,
          healthy
            ? `${config.serviceUpMessage || "Service available"}: ${service}`
            : `${config.serviceDownMessage || "Service unavailable"}: ${service}`,
        );
      }
    }
  }, config.checkHealthIntervalSeconds * 1000);
};

module.exports = { start, notify, checkHealth };
