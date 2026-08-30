"""
AIRA Local STT Test Runner
"""
import sys
from tests.test_stt import run_stt_test

if __name__ == "__main__":
    run_stt_test(seconds=5.0)