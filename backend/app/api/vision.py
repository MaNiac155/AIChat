from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.vision import VisionResponse
from app.services.vision_service import vision_service

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("", response_model=VisionResponse)
async def describe_image(image: UploadFile = File(...)) -> VisionResponse:
    image_bytes = await image.read()
    image_type = image.content_type or ""

    try:
        return await vision_service.describe(image_bytes, image_type)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
