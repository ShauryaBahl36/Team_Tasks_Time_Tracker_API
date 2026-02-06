from django.contrib import admin
from .models import User, Project, Task, ProjectMembership, Comment, TimeEntry
# from django.contrib.auth.admin import UserAdmin
# # Register your models here.

admin.site.register(User)
admin.site.register(Project)
admin.site.register(Task)
admin.site.register(ProjectMembership)
admin.site.register(Comment)
admin.site.register(TimeEntry)