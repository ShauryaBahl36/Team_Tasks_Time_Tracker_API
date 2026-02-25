from api.models import ProjectMembership, Task

from rest_framework import permissions
from rest_framework.permissions import BasePermission

from django.db.models import Q

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

    def has_permission(self, request, view):
        # allow authenticated users
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        # Admin can do anything
        if request.user.is_staff:
            return True

        # Owner can access
        if obj.user == request.user:
            return True

        # Project manager can access
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
    
class IsProjectMember(BasePermission):

    def has_permission(self, request, view):
        if request.method == "POST":
            project_id = request.data.get("project")
            if not project_id:
                return False

            return ProjectMembership.objects.filter(
                user=request.user,
                project_id=project_id
            ).exists()

        return True

    def has_object_permission(self, request, view, obj):
        return ProjectMembership.objects.filter(
            user=request.user,
            project=obj.project
        ).exists()