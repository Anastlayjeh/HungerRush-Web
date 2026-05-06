<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Password Reset | HungerRush</title>
    <style>
        :root {
            color-scheme: light;
            --ink: #2e2521;
            --muted: #8f7d70;
            --accent: #ff7e4d;
            --paper: #fffaf6;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: linear-gradient(160deg, #fff6ef 0%, #f7ebe3 55%, #f2f4ed 100%);
            color: var(--ink);
            display: grid;
            place-items: center;
            padding: 24px;
        }

        main {
            width: min(100%, 430px);
            background: var(--paper);
            border: 1px solid rgba(46, 37, 33, 0.08);
            border-radius: 8px;
            box-shadow: 0 24px 70px rgba(46, 37, 33, 0.14);
            padding: 34px;
            text-align: center;
        }

        .mark {
            width: 58px;
            height: 58px;
            border-radius: 8px;
            background: var(--accent);
            color: white;
            display: grid;
            place-items: center;
            margin: 0 auto 20px;
            font-size: 28px;
            font-weight: 900;
        }

        h1 {
            margin: 0;
            font-size: 27px;
            line-height: 1.12;
            letter-spacing: 0;
        }

        p {
            margin: 12px 0 0;
            color: var(--muted);
            font-size: 15px;
            line-height: 1.5;
            font-weight: 700;
        }
    </style>
</head>
<body>
    <main>
        <div class="mark">H</div>
        <h1>Password reset successfully.</h1>
        <p>You can now return to the HungerRush app and log in.</p>
    </main>
</body>
</html>
