const htmlVerifyMail = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>fundflow by Reasonable</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Josefin+Sans:ital,wght@0,100..700;1,100..700&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');

        body {
            color: #222;
            /* f1f1f1 */
            background-color: #f1f1f1;
            margin: 0;
            padding: 0;
            padding-top: 2.5rem;
            font-family: 'DM Sans', sans-serif;
        }

        a {
            text-decoration: none;
            color: #222;
        }

        main {
            width: 40%;
            padding: 30px 29px;
            box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
            border-radius: 0.25rem;
            margin: auto;
            background-color: #fdfdfd;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        img {
            width: 55px;
            border-radius: 5px;
        }

        h1 span {
            font-family: 'Josefin Sans', sans-serif;
        }

        h1>p {
            font-size: 1.5rem;
        }

        h1 {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }

        h1>a,
        h2 {
            font-family: 'Montserrat', sans-serif;
        }

        h1,
        h2,
        p {
            margin: 0;
            padding: 0;
        }

        footer p:last-child {
            font-weight: 500;
        }

        footer span {
            font-family: 'Josefin Sans', sans-serif;
            font-weight: 700;
        }

        section hr:first-child {
            margin-bottom: 1rem;
        }

        section hr:last-child {
            margin-top: 1rem;
        }

        h2 {
            padding: 0 0 0.65rem 0;
        }

        section>div>a {
            padding: 0.5rem 1rem;
            width: 33.33%;
            margin: auto;
            background-image: linear-gradient(to right, #c99df4, #ff8b20);
            color: #fdfdfd;
            border-radius: 0.25rem;
            text-align: center;
            font-weight: 500;
        }

        section>div {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        section p>a {
            color: #222;
            border-bottom: solid 1px #222;
        }
    </style>
</head>

<body>
    <main>
        <header>
            <h1>
                <a href="https://fundflow.arcedo.dev" target="_blank">
                    <img src="./public/fundflow.png" alt="fundflow logo">
                    fundflow.
                </a>
                <p>by <span>Reasonable</span></p>
            </h1>
        </header>
        <section>
            <hr>
            <h2>One last step</h2>
            <div>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="https://fundflow.arcedo.dev/verify/idUser" target="_blank">Verify</a>
                <p>You are receiving this email because you signed up for fundflow. If you believe this is a mistake,
                    please
                    contact
                    us at <a href="mailto:info@fundflow.arcedo.dev">info@fundflow.arcedo.dev</a>.</p>
            </div>
            <hr>
        </section>
        <footer>
            <p>Thanks,</p>
            <p>The <span>Reasonable</span> Team.</p>
        </footer>
    </main>
</body>

</html>`;

module.exports = htmlVerifyMail;