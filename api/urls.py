from rest_framework.routers import DefaultRouter
from django.urls import path
from api.views import UserListAPIView, UserProfileAPIView
from . import views

urlpatterns = [
    path("users/", UserListAPIView.as_view(), name="user-list"),
    path("profile/", UserProfileAPIView.as_view()),
]

router = DefaultRouter()
router.register('projects', views.ProjectViewSet, basename="projects")
router.register('tasks', views.TasksViewSet, basename='tasks')
router.register('time-entries', views.TimeEntryViewSet, basename="time-entries")
router.register('comment', views.CommentViewSet, basename="comment")
router.register('bulk-reports', views.BulkUploadReportViewSet, basename="bulk-reports")
router.register('notifications', views.NotificationViewSet, basename="notifications")
urlpatterns += router.urls
