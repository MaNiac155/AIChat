from pydantic import BaseModel


class VisionResponse(BaseModel):
    description: str
    image_size: int
    image_type: str
    mock_mode: bool
    cache_reused: bool
    model_call_count: int
