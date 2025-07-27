/**
 * Email template functions for different types of emails
 */

/**
 * Generate magic link email content with verification code
 */
export function generateMagicLinkEmail(
  _email: string,
  magicLinkUrl: string,
  verificationCode: string,
): { html: string; text: string; subject: string } {
  const subject = "Your login code for Barsistant";

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style='background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'>
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;padding:20px 0 48px">
      <tbody>
        <tr style="width:100%">
          <td>
            <div style="margin-bottom:20px">
              <img src="https://barsistant.com/logo.png" alt="Barsistant" width="64" height="64" style="display:block;margin:0 auto" />
            </div>
            <h1 style="font-size:24px;letter-spacing:-0.5px;line-height:1.3;font-weight:400;color:#484848;padding:17px 0 0">
              Your login code for Barsistant
            </h1>
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:27px 0 27px">
              <tbody>
                <tr>
                  <td>
                    <a href="${magicLinkUrl}" style="line-height:100%;text-decoration:none;display:block;max-width:100%;mso-padding-alt:0px;background-color:#2a2a2a;border-radius:3px;font-weight:600;color:#fff;font-size:15px;text-align:center;padding:11px 23px" target="_blank">
                      <span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:8.25px">
                        Login to Barsistant
                      </span>
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <p style="font-size:15px;line-height:1.4;margin:0 0 15px;color:#3c4149">
              This link and code will only be valid for the next 15 minutes. If the link does not work, you can use the login verification code directly:
            </p>
            <code style="font-family:monospace;font-weight:700;padding:1px 4px;background-color:#dfe1e4;letter-spacing:-0.3px;font-size:21px;border-radius:4px;color:#3c4149">
              ${verificationCode}
            </code>
            <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#dfe1e4;margin:42px 0 26px" />
            <a href="https://barsistant.com" style="color:#b4becc;text-decoration-line:none;font-size:14px" target="_blank">
              Barsistant
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
  `;

  const text = `
Your login code for Barsistant

You requested to sign in to your Barsistant account.

Click this link to login:
${magicLinkUrl}

This link and code will only be valid for the next 15 minutes. If the link does not work, you can use the login verification code directly:

${verificationCode}

Happy mixing!
The Barsistant Team
  `;

  return { html, text, subject };
}
