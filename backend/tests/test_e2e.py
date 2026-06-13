import asyncio
import sys
import unittest
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.config import settings  # noqa: E402
from app.services.cost_control import vision_cost_control  # noqa: E402
from main import app  # noqa: E402


class EndToEndApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.original_mock_mode = settings.mock_mode
        settings.mock_mode = True
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls) -> None:
        settings.mock_mode = cls.original_mock_mode
        cls.client.close()

    def setUp(self) -> None:
        asyncio.run(vision_cost_control.clear_cache())

    def test_health_check(self) -> None:
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_normal_chat_returns_complete_response(self) -> None:
        response = self.client.post(
            "/api/chat",
            json={"message": "你好", "session_id": str(uuid4())},
        )
        body = response.json()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(body["reply"])
        self.assertIn("emotion", body)
        self.assertEqual(body["action"], "talking")

    def test_weather_question_does_not_invent_realtime_weather(self) -> None:
        response = self.client.post(
            "/api/chat",
            json={"message": "今天天气怎么样", "session_id": str(uuid4())},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("无法直接获取实时天气", response.json()["reply"])

    def test_visual_description_is_cached_and_injected_into_chat(self) -> None:
        image = ("frame.jpg", b"\xff\xd8\xffmock-camera-frame", "image/jpeg")
        first_vision = self.client.post("/api/vision", files={"image": image})
        second_vision = self.client.post("/api/vision", files={"image": image})
        first_body = first_vision.json()
        second_body = second_vision.json()

        self.assertEqual(first_vision.status_code, 200)
        self.assertIn("我看到了", first_body["description"])
        self.assertFalse(first_body["cache_reused"])
        self.assertTrue(second_body["cache_reused"])
        self.assertEqual(
            first_body["model_call_count"],
            second_body["model_call_count"],
        )

        chat = self.client.post(
            "/api/chat",
            json={
                "message": "你看看桌上有什么",
                "session_id": str(uuid4()),
                "visual_context": first_body["description"],
            },
        )

        self.assertEqual(chat.status_code, 200)
        self.assertIn(first_body["description"], chat.json()["reply"])

    def test_invalid_image_returns_readable_error(self) -> None:
        response = self.client.post(
            "/api/vision",
            files={"image": ("frame.png", b"not-a-png", "image/png")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("仅支持", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
