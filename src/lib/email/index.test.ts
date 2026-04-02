import { jest } from "@jest/globals";

jest.unstable_mockModule("@/lib/email/sendgrid", () => ({
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
}));

jest.unstable_mockModule("./resend", () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

describe("email abstraction provider selection", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("uses SendGrid when EMAIL_PROVIDER=sendgrid", async () => {
    jest.unstable_mockModule("@/lib/env", () => ({ env: { SENDGRID_API_KEY: "sg_test", RESEND_API_KEY: undefined, EMAIL_PROVIDER: "sendgrid" } }));

    const { sendPasswordResetEmail } = await import("./index");
    const sendgrid = await import("@/lib/email/sendgrid");

    await sendPasswordResetEmail({ to: "a@b.com", resetLink: "link" });

    expect(sendgrid.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("uses Resend when EMAIL_PROVIDER=resend", async () => {
    jest.unstable_mockModule("@/lib/env", () => ({ env: { SENDGRID_API_KEY: undefined, RESEND_API_KEY: "res_test", EMAIL_PROVIDER: "resend" } }));

    const { sendPasswordResetEmail } = await import("./index");
    const resend = await import("./resend");

    await sendPasswordResetEmail({ to: "a@b.com", resetLink: "link" });

    expect(resend.default).toHaveBeenCalledTimes(1);
  });

  it("auto-selects SendGrid when keys present and no provider forced", async () => {
    jest.unstable_mockModule("@/lib/env", () => ({ env: { SENDGRID_API_KEY: "sg_test", RESEND_API_KEY: "res_test", EMAIL_PROVIDER: undefined } }));

    const { sendPasswordResetEmail } = await import("./index");
    const sendgrid = await import("@/lib/email/sendgrid");

    await sendPasswordResetEmail({ to: "a@b.com", resetLink: "link" });

    expect(sendgrid.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });
});
