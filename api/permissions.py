from .models import ProjectMembership, Task
from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and request.user.user_role == "admin"
        )
    
class IsProjectMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Task):
            project = obj.project
        else:
            project = obj.task.project
        
        return ProjectMembership.objects.filter(user=request.user, project=project).exists()