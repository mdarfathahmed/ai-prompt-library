from django.http import JsonResponse
from .models import Prompt
import json
import redis
import os
from django.views.decorators.csrf import csrf_exempt

r = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    password=os.getenv('REDIS_PASSWORD') or None,
    decode_responses=True
)

def welcome(request):
    return JsonResponse({
        "message": "Welcome to AI Prompt Library API,Where You save your AI Prompts and share with the world",
        "status": "running"
    })

@csrf_exempt
def prompts_handler(request):
    if request.method == 'GET':
        prompts = list(Prompt.objects.all().values())
        return JsonResponse(prompts, safe=False)

    if request.method == 'POST':
        body = json.loads(request.body)

        title = body.get('title')
        content = body.get('content')
        complexity = body.get('complexity')

        if not title or len(title) < 3:
            return JsonResponse({'error': 'Title too short'}, status=400)

        if not content or len(content) < 20:
            return JsonResponse({'error': 'Content too short'}, status=400)

        if not (1 <= int(complexity) <= 10):
            return JsonResponse({'error': 'Complexity must be 1-10'}, status=400)

        prompt = Prompt.objects.create(
            title=title,
            content=content,
            complexity=complexity
        )

        return JsonResponse({'id': prompt.id}, status=201)


def get_prompt(request, id):
    if request.method == 'GET':
        prompt = Prompt.objects.filter(id=id).values().first()

        if not prompt:
            return JsonResponse({'error': 'Not found'}, status=404)

        key = f"prompt:{id}:views"
        view_count = r.incr(key)

        prompt['view_count'] = view_count

        return JsonResponse(prompt)
