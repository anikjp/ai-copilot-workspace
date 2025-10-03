from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any

from services.litellm_service import litellm_service
from middleware.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def get_available_models(
    current_user: dict = Depends(get_current_user)
):
    """Get all available AI models"""
    try:
        models = litellm_service.get_available_models()
        return [model.dict() for model in models]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{model_id}", response_model=Dict[str, Any])
async def get_model_info(
    model_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get information about a specific model"""
    try:
        model_info = litellm_service.get_model_info(model_id)
        return model_info.dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/providers/{provider}", response_model=List[Dict[str, Any]])
async def get_models_by_provider(
    provider: str,
    current_user: dict = Depends(get_current_user)
):
    """Get models by provider (e.g., 'openai', 'anthropic')"""
    try:
        # Get all models and filter by provider
        all_models = litellm_service.get_available_models()
        filtered_models = [model.dict() for model in all_models if model.provider.lower() == provider.lower()]
        return filtered_models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
