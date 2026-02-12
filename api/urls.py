from rest_framework.routers import DefaultRouter
from django.urls import path
from api.views import TasksViewSet, TimeEntryViewSet, GetProjectAPIView
from . import views

urlpatterns = [
    # path('projects/', views.GetProjectAPIView.as_view()),
]

router = DefaultRouter()
router.register('projects', views.ProjectViewSet, basename="projects")
router.register('tasks', views.TasksViewSet, basename='tasks')
router.register('time-entries', views.TimeEntryViewSet, basename="time-entries")
router.register('comment', views.CommentViewSet)
urlpatterns += router.urls
