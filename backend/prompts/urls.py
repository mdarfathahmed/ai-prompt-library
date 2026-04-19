

from django.urls import path
from .views import prompts_handler, get_prompt, welcome

urlpatterns = [
    path('', welcome),
    path('api/prompts/', prompts_handler),
    path('api/prompts/<int:id>/', get_prompt),
]
