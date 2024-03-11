const https = require("https");
const { start, notify, checkHealth } = require("./notify.js");

jest.mock("https", () => ({
  get: jest.fn(),
  request: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
});

describe("notify", () => {
  it("should send a POST request to each webhook", () => {
    const message = "Test message";
    const webhooks = ["https://webhook.com/1", "https://webhook.com/2"];
    const mock = {
      write: jest.fn(),
      end: jest.fn(),
    };
    https.request.mockReturnValue(mock);
    notify(webhooks, message);
    expect(https.request).toHaveBeenCalledTimes(2);
  });

  it("should send message as json {text: message}", () => {
    const message = "Test message";
    const webhooks = ["https://webhook.com/1"];
    const json = JSON.stringify({ text: message });
    const mock = {
      write: jest.fn(),
      end: jest.fn(),
    };
    https.request.mockReturnValue(mock);
    notify(webhooks, message);
    expect(mock.write).toHaveBeenCalledWith(json);
  });
});

describe("checkHealth", () => {
  it("should resolve to true if the status code is 200", async () => {
    const url = "https://example.com";
    https.get.mockImplementation((url, options, callback) => {
      callback({ statusCode: 200 });
    });
    const result = await checkHealth(url);
    expect(result).toBe(true);
  });

  it("should resolve to true if the status code is 200", async () => {
    const url = "https://example.com";
    https.get.mockImplementation((url, options, callback) => {
      callback({ statusCode: 500 });
    });

    const result = await checkHealth(url);
    expect(result).toBe(false);
  });

  it("should resolve to false when throw error", async () => {
    const url = "https://example.com";
    https.get.mockImplementation((url, options, callback) => {
      throw Error("Network error");
    });

    const result = await checkHealth(url);
    expect(result).toBe(false);
  });
});

describe("start", () => {
  const validConfig = {
    checkHealthIntervalSeconds: 10,
    services: ["https://example.com"],
    slackWebhook: "https://webhook.com/1",
    microsoftTeamsWebhook: "https://webhook.com/1",
  };

  it("should throw an error if checkHealthIntervalSeconds is less than 1", () => {
    const config = {
      ...validConfig,
      checkHealthIntervalSeconds: 0.5,
    };
    expect(() => start(config)).toThrowError();
  });

  it("should throw an error if microsoftTeamsWebhook and slackWebhook is not provided", () => {
    const config = {
      ...validConfig,
      slackWebhook: undefined,
      microsoftTeamsWebhook: undefined,
    };
    expect(() => start(config)).toThrowError();
  });

  it("should throw an error if slackWebhook webhook is invalid", () => {
    const config = {
      ...validConfig,
      slackWebhook: "invalid-url",
    };
    expect(() => start(config)).toThrow("One of provided webhook is invalid");
  });

  it("should throw an error if microsoftTeamsWebhook webhook is invalid", () => {
    const config = {
      ...validConfig,
      microsoftTeamsWebhook: "invalid-url",
    };
    expect(() => start(config)).toThrow("One of provided webhook is invalid");
  });

  it("should throw an error if services empty", () => {
    const config = {
      ...validConfig,
      services: [],
    };
    expect(() => start(config)).toThrow(
      "No services defined, should add at least one",
    );
  });

  it("should throw an error if services invalid url", () => {
    const config = {
      ...validConfig,
      services: ["invalid-url"],
    };
    expect(() => start(config)).toThrowError(
      "Services contains invalid url invalid-url",
    );
  });

  it("should call notify when service status code 500", async () => {
    const config = {
      ...validConfig,
      checkHealthIntervalSeconds: 1,
    };
    https.get.mockImplementation((url, options, callback) => {
      callback({ statusCode: 500 });
    });
    https.request.mockReturnValue({
      write: jest.fn(),
      end: jest.fn(),
    });
    const process = start(config);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    clearInterval(process);
    expect(https.request).toHaveBeenCalled();
  });

  it("should not do webhook http request when status code 200", async () => {
    const config = {
      ...validConfig,
      checkHealthIntervalSeconds: 1,
    };
    https.get.mockImplementation((url, options, callback) => {
      callback({ statusCode: 200 });
    });
    https.request.mockReturnValue({
      write: jest.fn(),
      end: jest.fn(),
    });
    const process = start(config);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    clearInterval(process);
    expect(https.request).not.toHaveBeenCalledWith();
  });

  it("should two http requests when down and up", async () => {
    const config = {
      ...validConfig,
      slackWebhook: "https://webhook.com/1",
      microsoftTeamsWebhook: undefined,
      checkHealthIntervalSeconds: 1,
    };
    https.get
      .mockImplementationOnce((_, __, callback) => {
        callback({ statusCode: 500 });
      })
      .mockImplementationOnce((_, __, callback) => {
        callback({ statusCode: 200 });
      });

    https.request.mockReturnValue({
      write: jest.fn(),
      end: jest.fn(),
    });

    const process = start(config);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    clearInterval(process);
    expect(https.request).toHaveBeenCalledTimes(2);
  });
});
