const htmlRecoverPassword = (code, username) => `
<!doctype html>
<html lang="en">

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>fundflow by Reasonable</title>
    <style media="all" type="text/css">
        @media all {
            .btn-primary table td:hover {
                background-color: #ec0867 !important;
            }

            .btn-primary a:hover {
                background-color: #ec0867 !important;
                border-color: #ec0867 !important;
            }
        }

        @media only screen and (max-width: 640px) {

            .main p,
            .main td,
            .main span {
                font-size: 16px !important;
            }

            .wrapper {
                padding: 8px !important;
            }

            .content {
                padding: 0 !important;
            }

            .container {
                padding: 0 !important;
                padding-top: 8px !important;
                width: 100% !important;
            }

            .main {
                border-left-width: 0 !important;
                border-radius: 0 !important;
                border-right-width: 0 !important;
            }

            .btn table {
                max-width: 100% !important;
                width: 100% !important;
            }

            .btn a {
                font-size: 16px !important;
                max-width: 100% !important;
                width: 100% !important;
            }
        }

        @media all {
            .ExternalClass {
                width: 100%;
            }

            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
                line-height: 100%;
            }

            .apple-link a {
                color: inherit !important;
                font-family: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
                text-decoration: none !important;
            }

            #MessageViewBody a {
                color: inherit;
                text-decoration: none;
                font-size: inherit;
                font-family: inherit;
                font-weight: inherit;
                line-height: inherit;
            }
        }
    </style>
</head>

<body
    style="font-family: Helvetica, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.3; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #f4f5f6; margin: 0; padding: 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body"
        style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f4f5f6; width: 100%;"
        width="100%" bgcolor="#f4f5f6">
        <tr>
            <td style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top;" valign="top">&nbsp;
            </td>
            <td class="container"
                style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; max-width: 600px; padding: 0; padding-top: 24px; width: 600px; margin: 0 auto;"
                width="600" valign="top">
                <div class="content"
                    style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 600px; padding: 0;">

                    <!-- START CENTERED WHITE CONTAINER -->
                    <div class="preheader" style="padding-bottom: 20px;">
                        <h1 style="margin: auto; width: fit-content;">
                            <a href="https://fundflow.arcedo.dev" target="_blank"
                                style="text-decoration: none; color: inherit;">
                                <!-- <img src="./fundflow.png" alt="fundflow logo" style="width: 40px; border-radius: 5px;"> -->
                                fundflow.
                            </a>
                        </h1>
                        <p style="margin: auto; width: fit-content;">by <span
                                style="font-weight: bolder;">Reasonable</span></p>
                    </div>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main"
                        style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border: 1px solid #eaebed; border-radius: 16px; width: 100%;"
                        width="100%">
                        <tr>
                            <td class="wrapper"
                                style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; box-sizing: border-box; padding: 24px;"
                                valign="top">
                                <h2
                                    style="font-family: Helvetica, sans-serif; font-size: 20px; font-weight: bold; margin: 0; margin-bottom: 16px;">
                                    Hi ${username},</h2>
                                </h2>
                                <p
                                    style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 16px;">
                                    You recently requested to reset your password for your fundflow account. Use the
                                    button below to reset it.
                                </p>
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0"
                                    class="btn btn-primary"
                                    style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; box-sizing: border-box; width: 100%; min-width: 100%;"
                                    width="100%">
                                    <tbody>
                                        <tr>
                                            <td align="center"
                                                style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; padding-bottom: 16px;"
                                                valign="top">
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0"
                                                    style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
                                                    <tbody>
                                                        <tr>
                                                            <td style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; border-radius: 4px; text-align: center; background-color: #0867ec;"
                                                                valign="top" align="center" bgcolor="#0867ec">
                                                                <a href="${process.env.FRONTEND_HOST}/reset/${code}"
                                                                    target="_blank"
                                                                    style="border-radius: 4px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 16px; font-weight: bold; margin: 0; padding: 12px 24px; text-decoration: none; text-transform: capitalize; background-image: linear-gradient(to right, #c99df4, #ff8b20); color: #fdfdfd;">
                                                                    Recover Password
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p style="font-weight: 600;">This password reset is
                                    only valid for the next
                                    hour.</p>
                                <p
                                    style="font-family: Helvetica, sans-serif; font-size: 15px; font-weight: normal; margin: 0; margin-bottom: 16px; display: inline-block;">
                                    If you believe this is a mistake, please contact us at <a
                                        href="mailto:info@fundflow.arcedo.dev"
                                        style="color: #c99df4; font-weight: 600;">info@fundflow.arcedo.dev</a>.
                                </p>
                                <p
                                    style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 5px;">
                                    Thanks,</p>
                                <p
                                    style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0;">
                                    The <span style="font-weight: bolder;">Reasonable</span> Team.</p>
                            </td>
                        </tr>
                    </table>
                    <div class="footer"
                        style="clear: both; padding-top: 12px; padding-bottom: 12px; text-align: center; width: 100%;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0"
                            style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;"
                            width="100%">
                            <tr>
                                <td class="content-block"
                                    style="font-family: Helvetica, sans-serif; vertical-align: top; color: #9a9ea6; font-size: 16px; text-align: center;"
                                    valign="top" align="center">
                                    <span class="apple-link"
                                        style="color: #9a9ea6; font-size: 14px; text-align: center;">
                                        Do not reply to this email, this is an auto-generated email.
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </td>
            <td style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top;" valign="top">&nbsp;
            </td>
        </tr>
    </table>
</body>

</html>
`;

module.exports = htmlRecoverPassword;