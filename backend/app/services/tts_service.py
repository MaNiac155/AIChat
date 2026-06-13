from dataclasses import dataclass


@dataclass(frozen=True)
class TTSPlayback:
    provider: str
    text: str


class TTSService:
    """Reserves the backend TTS boundary while the browser performs playback."""

    @staticmethod
    def prepare_browser_playback(text: str) -> TTSPlayback:
        return TTSPlayback(provider="browser-speech-synthesis", text=text.strip())


tts_service = TTSService()
