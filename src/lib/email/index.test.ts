import { jest } from "@jest/globals";

jest.mock("@/lib/email/sendgrid", () => ({
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock("./resend", () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

describe("email abstraction provider selection", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // clear env overrides
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_PROVIDER;
  });

  it("uses SendGrid when EMAIL_PROVIDER=sendgrid", async () => {
    process.env.SENDGRID_API_KEY = "sg_test";
    process.env.RESEND_API_KEY = "";
    process.env.EMAIL_PROVIDER = "sendgrid";

    const { sendPasswordResetEmail } = await import("./index");
    const sendgrid = await import("@/lib/email/sendgrid");

    await sendPasswordResetEmail({ to: "a@b.com", resetLink: "link" });

    expect((sendgrid as any).sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it("uses Resend when EMAIL_PROVIDER=resend", async () => {
    process.env.SENDGRID_API_KEY = "";
    process.env.RESEND_API_KEY = "res_test";
    process.env.EMAIL_PROVIDER = "resend";

    const { sendPasswordResetEmail } = await import("./index");
    const resend = await import("./resend");

    await sendPasswordResetEmail({ to: "a@b.com", resetLink: "link" });

    expect((resend as any).default).toHaveBeenCalledTimes(1);
  });

  it("auto-selects SendGrid when keys present and no provider forced", async () => {
    process.env.SENDGRID_API_KEY = "sg_test";
    process.env.RESEND_API_KEY = "res_test";
    delete process.env.EMAIL_PROVIDER;

    const { sendPasswordResetEmail } = await import("./index");
    const sendgrid = await import("@/lib/email/sendgrid");

    await sendPasswordResetEmail({ to: "a@b.com", resetLink: "link" });

    expect((sendgrid as any).sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });
});
