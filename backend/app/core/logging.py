import logging
import sys


def configure_logging(
    log_level: str = "INFO",
) -> None:
    normalized_level = log_level.upper()

    logging.basicConfig(
        level=normalized_level,
        format=("%(asctime)s | %(levelname)s | %(name)s | %(message)s"),
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
        force=True,
    )

    logging.getLogger("httpx").setLevel(logging.WARNING)

    logging.getLogger("apscheduler").setLevel(logging.INFO)
