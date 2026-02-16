from api.models import ProjectMembership, Task
from rest_framework import permissions
from rest_framework.permissions import BasePermission, SAFE_METHODS

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
    
class IsOwnerOrProjectManager(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        
        if obj.user == request.user:
            return True
        
        return ProjectMembership.objects.filter(
            user=request.user,
            project=obj.task.project,
            role_in_project="Manager"
        ).exists()
    
class IsAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        if request.user.is_staff:
            return True
        return True
    
class IsProjectManagerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        
        return ProjectMembership.objects.filter(
            user=request.user,
            project=obj,
            role_in_project="Manager"
        ).exists()
    
class IsRoleAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_role == "Admin"