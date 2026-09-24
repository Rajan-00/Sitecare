from app.core.config import Settings


def test_default_cors_origins(
    monkeypatch,
) -> None:
    monkeypatch.delenv(
        "CORS_ORIGINS",
        raising=False,
    )

    monkeypatch.setenv(
        "JWT_SECRET_KEY",
        "a" * 64,
    )

    configuration = Settings(
        _env_file=None,
    )

    assert configuration.cors_origins == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]


def test_cors_origins_load_from_environment(
    monkeypatch,
) -> None:
    monkeypatch.setenv(
        "JWT_SECRET_KEY",
        "b" * 64,
    )

    monkeypatch.setenv(
        "CORS_ORIGINS",
        (
            '["https://sitecare.example.com",'
            '"https://admin.sitecare.example.com"]'
        ),
    )

    configuration = Settings(
        _env_file=None,
    )

    assert configuration.cors_origins == [
        "https://sitecare.example.com",
        "https://admin.sitecare.example.com",
    ]