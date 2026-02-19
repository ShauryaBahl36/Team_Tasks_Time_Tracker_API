from rest_framework.routers import DefaultRouter
from django.urls import path
from api.views import UserListAPIView
from . import views

urlpatterns = [
    # path('projects/', views.GetProjectAPIView.as_view()),
    path("users/", UserListAPIView.as_view(), name="user-list"),
]

router = DefaultRouter()
router.register('projects', views.ProjectViewSet, basename="projects")
router.register('tasks', views.TasksViewSet, basename='tasks')
router.register('time-entries', views.TimeEntryViewSet, basename="time-entries")
router.register('comment', views.CommentViewSet)
urlpatterns += router.urls
