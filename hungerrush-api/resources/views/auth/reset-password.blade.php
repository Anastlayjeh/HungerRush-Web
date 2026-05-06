<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Reset Password | HungerRush</title>
    <style>
        :root {
            color-scheme: light;
            --ink: #2e2521;
            --muted: #8f7d70;
            --accent: #ff7e4d;
            --accent-dark: #d95f34;
            --paper: #fffaf6;
            --field: #f3eee9;
            --danger: #b7372b;
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
            padding: 32px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
        }

        .mark {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            background: var(--accent);
            color: white;
            display: grid;
            place-items: center;
            font-size: 25px;
            font-weight: 900;
        }

        h1 {
            margin: 0;
            font-size: 28px;
            line-height: 1.1;
            letter-spacing: 0;
        }

        p {
            margin: 8px 0 0;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.5;
            font-weight: 650;
        }

        form {
            margin-top: 26px;
            display: grid;
            gap: 16px;
        }

        label {
            display: grid;
            gap: 7px;
            color: var(--ink);
            font-size: 13px;
            font-weight: 800;
        }

        input {
            width: 100%;
            border: 1px solid transparent;
            border-radius: 8px;
            background: var(--field);
            color: var(--ink);
            font: inherit;
            font-size: 15px;
            font-weight: 700;
            padding: 14px 15px;
            outline: none;
        }

        input:focus {
            border-color: var(--accent);
            background: white;
            box-shadow: 0 0 0 4px rgba(255, 126, 77, 0.16);
        }

        button {
            margin-top: 6px;
            border: 0;
            border-radius: 8px;
            background: var(--accent);
            color: white;
            cursor: pointer;
            font: inherit;
            font-size: 16px;
            font-weight: 900;
            min-height: 52px;
            padding: 14px 18px;
        }

        button:hover {
            background: var(--accent-dark);
        }

        .errors {
            margin: 0 0 18px;
            border-radius: 8px;
            border: 1px solid rgba(183, 55, 43, 0.2);
            background: #fff1ee;
            color: var(--danger);
            padding: 12px 14px;
            font-size: 13px;
            font-weight: 750;
        }

        .errors ul {
            margin: 0;
            padding-left: 18px;
        }

        @media (max-width: 520px) {
            body {
                padding: 16px;
            }

            main {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    <main>
        <div class="brand">
            <div class="mark">H</div>
            <div>
                <h1>Reset password</h1>
                <p>Enter a new password for your HungerRush account.</p>
            </div>
        </div>

        @if ($errors->any())
            <div class="errors" role="alert">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST" action="{{ route('password.update') }}">
            @csrf
            <input type="hidden" name="token" value="{{ $token }}">

            <label>
                Email
                <input
                    type="email"
                    name="email"
                    value="{{ old('email', $email) }}"
                    autocomplete="email"
                    required
                >
            </label>

            <label>
                New password
                <input
                    type="password"
                    name="password"
                    autocomplete="new-password"
                    minlength="8"
                    required
                >
            </label>

            <label>
                Confirm password
                <input
                    type="password"
                    name="password_confirmation"
                    autocomplete="new-password"
                    minlength="8"
                    required
                >
            </label>

            <button type="submit">Reset Password</button>
        </form>
    </main>
</body>
</html>
